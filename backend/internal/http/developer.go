package http

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type apiKeyContext struct {
	Key store.APIKeyRecord
}

var defaultAPIKeyScopes = []string{"invoices:read", "invoices:write"}

func (s *Server) apiKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractAPIKey(c)
		if token == "" {
			metrics.IncAuthAttempt("api_key", "failure", "missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing API key"})
			return
		}

		hash := hashSecret(token)
		record, err := s.store.GetAPIKeyByTokenHash(c.Request.Context(), hash)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
			return
		}

		seller, err := s.store.GetSellerByID(c.Request.Context(), record.SellerID)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "seller_not_found")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "seller not found"})
			return
		}
		if seller.IsBlocked {
			metrics.IncAuthAttempt("api_key", "failure", "seller_blocked")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "seller account is blocked"})
			return
		}

		plan := seller.EffectivePlan(time.Now())
		if !plan.HasAPI {
			metrics.IncLimitDecision("api_access", "denied", "plan")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "current plan does not include Reqst Dev or Reqst Enterprise API access"})
			return
		}

		monthStart := monthWindowStart(time.Now().UTC())
		requestsThisMonth, err := s.store.CountAPIRequestsSince(c.Request.Context(), seller.ID, nil, monthStart)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "count_month_usage")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		remainingMinute, allowed := s.apiLimiter.Allow(fmt.Sprintf("%d:%d", seller.ID, record.ID), plan.RequestsPerMinute)
		c.Header("X-RateLimit-Limit-Minute", strconv.Itoa(plan.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining-Minute", strconv.Itoa(max(0, remainingMinute)))
		if plan.MonthlyRequestCap > 0 {
			c.Header("X-RateLimit-Limit-Month", strconv.Itoa(plan.MonthlyRequestCap))
			c.Header("X-RateLimit-Remaining-Month", strconv.Itoa(max(0, plan.MonthlyRequestCap-requestsThisMonth)))
		}

		if !allowed {
			metrics.IncLimitDecision("api_rate_limit", "denied", "minute")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "minute rate limit exceeded"})
			return
		}
		if plan.MonthlyRequestCap > 0 && requestsThisMonth >= plan.MonthlyRequestCap {
			metrics.IncLimitDecision("api_quota", "denied", "month")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "monthly API quota exceeded"})
			return
		}

		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "developer_api"))
		metrics.IncAuthAttempt("api_key", "success", "authenticated")
		c.Set("seller_ctx", sellerContext{Seller: seller})
		c.Set("api_key_ctx", apiKeyContext{Key: record})
		c.Next()

		statusCode := c.Writer.Status()
		_ = s.store.TouchAPIKeyLastUsed(context.Background(), record.ID)
		_ = s.store.RecordAPIRequest(context.Background(), seller.ID, record.ID, c.Request.Method, c.FullPath(), statusCode)
	}
}

func (s *Server) handleDeveloperUsage(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	monthUsage, err := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, monthWindowStart(time.Now().UTC()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	minuteUsage, err := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, time.Now().UTC().Add(-1*time.Minute))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	keyCount, err := s.store.CountActiveAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	webhooks, err := s.store.ListWebhookEndpoints(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plan": plan,
		"usage": gin.H{
			"monthly_requests":    monthUsage,
			"monthly_limit":       plan.MonthlyRequestCap,
			"requests_this_min":   minuteUsage,
			"minute_limit":        plan.RequestsPerMinute,
			"active_api_keys":     keyCount,
			"api_key_limit":       plan.APIKeyLimit,
			"webhook_endpoints":   len(webhooks),
			"webhook_retry_limit": plan.WebhookRetries,
		},
	})
}

func (s *Server) handleListAPIKeys(c *gin.Context) {
	sc := sellerFromContext(c)
	items, err := s.store.ListAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleCreateAPIKey(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	if !plan.HasAPI {
		c.JSON(http.StatusForbidden, gin.H{"error": "current plan does not include API keys"})
		return
	}

	count, err := s.store.CountActiveAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if plan.APIKeyLimit > 0 && count >= plan.APIKeyLimit {
		c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("current plan allows up to %d active API keys", plan.APIKeyLimit)})
		return
	}

	var body struct {
		Label  string   `json:"label"`
		Scopes []string `json:"scopes"`
		Mode   string   `json:"mode"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	label := strings.TrimSpace(body.Label)
	if label == "" {
		label = fmt.Sprintf("%s key", plan.Name)
	}
	scopes := normalizeScopes(body.Scopes)
	mode := "live"
	if strings.EqualFold(strings.TrimSpace(body.Mode), "test") {
		mode = "test"
	}
	prefixName := "rk_live_"
	if mode == "test" {
		prefixName = "rk_test_"
	}
	token, prefix, err := generateTokenWithPrefix(prefixName, 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	key, err := s.store.CreateAPIKey(c.Request.Context(), sc.Seller.ID, label, prefix, hashSecret(token), scopes, mode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"api_key": key,
		"secret":  token,
	})
}

func (s *Server) handleDeleteAPIKey(c *gin.Context) {
	sc := sellerFromContext(c)
	keyID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key id"})
		return
	}
	if err := s.store.RevokeAPIKey(c.Request.Context(), sc.Seller.ID, keyID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleListWebhookEndpoints(c *gin.Context) {
	sc := sellerFromContext(c)
	items, err := s.store.ListWebhookEndpoints(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for index := range items {
		items[index].Secret = ""
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleCreateWebhookEndpoint(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	if !plan.HasWebhooks {
		c.JSON(http.StatusForbidden, gin.H{"error": "current plan does not include webhooks"})
		return
	}

	var body struct {
		Label string `json:"label"`
		URL   string `json:"url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	endpointURL := strings.TrimSpace(body.URL)
	if err := validateWebhookURL(endpointURL, s.cfg.AppEnv); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	label := strings.TrimSpace(body.Label)
	if label == "" {
		label = "Primary endpoint"
	}
	secret, _, err := generateTokenWithPrefix("whsec_", 18)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	endpoint, err := s.store.CreateWebhookEndpoint(c.Request.Context(), sc.Seller.ID, label, endpointURL, secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"webhook": endpoint})
}

func (s *Server) handleRotateWebhookEndpointSecret(c *gin.Context) {
	sc := sellerFromContext(c)
	endpointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook endpoint id"})
		return
	}
	secret, _, err := generateTokenWithPrefix("whsec_", 18)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	endpoint, err := s.store.RotateWebhookEndpointSecret(c.Request.Context(), sc.Seller.ID, endpointID, secret)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"webhook": endpoint})
}

func (s *Server) handleDeleteWebhookEndpoint(c *gin.Context) {
	sc := sellerFromContext(c)
	endpointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook endpoint id"})
		return
	}
	if err := s.store.DeactivateWebhookEndpoint(c.Request.Context(), sc.Seller.ID, endpointID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleAPIMe(c *gin.Context) {
	sc := sellerFromContext(c)
	keyCtx := apiKeyFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	monthUsage, _ := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, monthWindowStart(time.Now().UTC()))
	c.JSON(http.StatusOK, gin.H{
		"seller": gin.H{
			"id":       sc.Seller.ID,
			"username": sc.Seller.Username,
			"email":    sc.Seller.Email,
		},
		"plan":  plan,
		"usage": gin.H{"monthly_requests": monthUsage, "monthly_limit": plan.MonthlyRequestCap},
		"key":   gin.H{"id": keyCtx.Key.ID, "label": keyCtx.Key.Label, "prefix": keyCtx.Key.Prefix, "mode": keyCtx.Key.Mode, "scopes": keyCtx.Key.Scopes},
	})
}

// @Summary      List invoices
// @Description  List merchant and subscription invoices with pagination. Requires invoices:read scope.
// @Tags         invoices
// @Produce      json
// @Param        page       query   int  false  "Page number (default 1)"
// @Param        page_size  query   int  false  "Page size (default 20, max 100)"
// @Success      200  {object}  map[string]interface{}
// @Router       /invoices [get]
func (s *Server) handleAPIListInvoices(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:read") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_read")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:read is required"})
		return
	}
	sc := sellerFromContext(c)
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	items, err := s.store.ListInvoices(c.Request.Context(), sc.Seller.ID, pageSize, (page-1)*pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "page": page, "page_size": pageSize})
}

func (s *Server) handleAPICreateInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:write") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_write")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:write is required"})
		return
	}
	sc := sellerFromContext(c)
	keyCtx := apiKeyFromContext(c)
	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(rawBody))
	idempotencyKey := strings.TrimSpace(c.GetHeader("Idempotency-Key"))
	requestHash := hashRequestBody(rawBody)
	var idempotencyRecord *store.IdempotencyRecord
	if idempotencyKey != "" {
		existing, err := s.store.GetIdempotencyRecord(c.Request.Context(), sc.Seller.ID, keyCtx.Key.ID, c.Request.Method, c.FullPath(), idempotencyKey)
		if err == nil {
			if existing.RequestHash != requestHash {
				c.JSON(http.StatusConflict, gin.H{"error": "Idempotency-Key was already used with a different request body"})
				return
			}
			if existing.StatusCode != nil && len(existing.ResponseBody) > 0 {
				c.Data(*existing.StatusCode, "application/json; charset=utf-8", existing.ResponseBody)
				return
			}
			c.JSON(http.StatusConflict, gin.H{"error": "Idempotency-Key request is still processing"})
			return
		}
		if !errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		created, err := s.store.CreateIdempotencyRecord(c.Request.Context(), sc.Seller.ID, keyCtx.Key.ID, c.Request.Method, c.FullPath(), idempotencyKey, requestHash)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		idempotencyRecord = &created
	}
	var body struct {
		Title            string `json:"title"`
		BaseAmountUSD    string `json:"base_amount_usd"`
		PayableNetwork   string `json:"payable_network"`
		ExpiresInMinutes int    `json:"expires_in_minutes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	baseAmount, err := decimal.NewFromString(strings.TrimSpace(body.BaseAmountUSD))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base_amount_usd"})
		return
	}
	invoice, err := s.invoiceService.CreateInvoice(c.Request.Context(), sc.Seller, service.CreateInvoiceInput{
		Title:            strings.TrimSpace(body.Title),
		BaseAmountUSD:    baseAmount,
		PayableNetwork:   store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork))),
		ExpiresInMinutes: body.ExpiresInMinutes,
		Mode:             keyCtx.Key.Mode,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	response := publicInvoiceResponse(invoice)
	if idempotencyRecord != nil {
		_ = s.store.CompleteIdempotencyRecord(c.Request.Context(), idempotencyRecord.ID, http.StatusCreated, store.MustJSON(response))
	}
	c.JSON(http.StatusCreated, response)
}

func (s *Server) handleAPIGetInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:read") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_read")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:read is required"})
		return
	}
	sc := sellerFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	invoice, err := s.store.GetInvoiceByID(c.Request.Context(), sc.Seller.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

// @Summary      Cancel an invoice
// @Description  Cancel an awaiting_payment invoice. Requires invoices:write scope.
// @Tags         invoices
// @Produce      json
// @Param        id   path      int  true  "Invoice ID"
// @Success      200  {object}  map[string]interface{}
// @Router       /invoices/{id}/cancel [post]
func (s *Server) handleAPICancelInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:write") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_write")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:write is required"})
		return
	}
	sc := sellerFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	currentInvoice, err := s.store.GetInvoiceByID(c.Request.Context(), sc.Seller.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	if !isSellerManagedInvoice(currentInvoice) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only seller-created invoices can be canceled"})
		return
	}
	invoice, err := s.store.SetInvoiceStatus(c.Request.Context(), sc.Seller.ID, invoiceID, store.InvoiceStatusExpired)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func (s *Server) handleAPISimulatePayment(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:write") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_write")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:write is required"})
		return
	}
	keyCtx := apiKeyFromContext(c)
	if keyCtx.Key.Mode != "test" {
		c.JSON(http.StatusForbidden, gin.H{"error": "payment simulator is only available for rk_test_ API keys"})
		return
	}
	sc := sellerFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	invoice, err := s.store.GetInvoiceByID(c.Request.Context(), sc.Seller.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	if invoice.Mode != "test" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only test invoices can be simulated"})
		return
	}
	updated, err := s.store.CompleteInvoicePayment(c.Request.Context(), invoice.ID, invoice.Status, fmt.Sprintf("sim_%d", time.Now().UTC().UnixNano()), store.InvoiceStatusPaid, "test_simulated", invoice.PayableAmount, time.Now().UTC())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(updated))
}

func (s *Server) handleListWebhookDeliveries(c *gin.Context) {
	sc := sellerFromContext(c)
	limit := parseIntDefault(c.Query("limit"), 50)
	if limit < 1 || limit > 100 {
		limit = 50
	}
	items, err := s.store.ListWebhookDeliveries(c.Request.Context(), sc.Seller.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleResendWebhookDelivery(c *gin.Context) {
	sc := sellerFromContext(c)
	deliveryID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook delivery id"})
		return
	}
	item, err := s.store.ResendWebhookDelivery(c.Request.Context(), sc.Seller.ID, deliveryID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"delivery": item})
}

func apiKeyFromContext(c *gin.Context) apiKeyContext {
	value, _ := c.Get("api_key_ctx")
	return value.(apiKeyContext)
}

func apiKeyHasScope(c *gin.Context, scope string) bool {
	key := apiKeyFromContext(c).Key
	for _, candidate := range key.Scopes {
		if candidate == scope {
			return true
		}
	}
	return false
}

func extractAPIKey(c *gin.Context) string {
	if value := strings.TrimSpace(c.GetHeader("X-API-Key")); value != "" {
		return value
	}
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[len("Bearer "):])
	}
	return ""
}

func normalizeScopes(scopes []string) []string {
	if len(scopes) == 0 {
		return append([]string(nil), defaultAPIKeyScopes...)
	}
	items := make([]string, 0, len(scopes))
	seen := map[string]struct{}{}
	for _, scope := range scopes {
		scope = strings.TrimSpace(scope)
		switch scope {
		case "invoices:read", "invoices:write":
			if _, ok := seen[scope]; !ok {
				items = append(items, scope)
				seen[scope] = struct{}{}
			}
		}
	}
	if len(items) == 0 {
		return append([]string(nil), defaultAPIKeyScopes...)
	}
	return items
}

func hashSecret(value string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(sum[:])
}

func generateTokenWithPrefix(prefix string, randomBytes int) (string, string, error) {
	buffer := make([]byte, randomBytes)
	if _, err := rand.Read(buffer); err != nil {
		return "", "", fmt.Errorf("read random bytes: %w", err)
	}
	secret := prefix + hex.EncodeToString(buffer)
	prefixValue := secret
	if len(prefixValue) > 14 {
		prefixValue = prefixValue[:14]
	}
	return secret, prefixValue, nil
}

func validateWebhookURL(raw string, appEnv string) error {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return fmt.Errorf("invalid webhook url: %w", err)
	}
	isProduction := appEnv == "production"
	if parsed.Scheme != "https" && (!(!isProduction && parsed.Scheme == "http")) {
		if isProduction {
			return errors.New("webhook url must start with https:// in production")
		}
		return errors.New("webhook url must start with http:// or https://")
	}
	if parsed.Host == "" {
		return errors.New("webhook url host is required")
	}
	host := parsed.Hostname()
	hostLower := strings.ToLower(host)
	if isProduction && (hostLower == "localhost" || strings.HasSuffix(hostLower, ".localhost")) {
		return errors.New("webhook url host is not allowed in production")
	}
	if ip := net.ParseIP(host); ip != nil && isBlockedWebhookIP(ip) {
		return errors.New("webhook url IP range is not allowed")
	}
	return nil
}

func isBlockedWebhookIP(ip net.IP) bool {
	metadataIP := net.ParseIP("169.254.169.254")
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() || ip.Equal(metadataIP)
}

func hashRequestBody(raw []byte) string {
	var normalized any
	if err := json.Unmarshal(raw, &normalized); err == nil {
		if encoded, err := json.Marshal(normalized); err == nil {
			raw = encoded
		}
	}
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}

func (l *memoryRateLimiter) Allow(key string, limit int) (int, bool) {
	if limit <= 0 {
		return 0, true
	}
	now := time.Now().UTC()
	l.mu.Lock()
	defer l.mu.Unlock()
	bucket := l.buckets[key]
	if bucket.resetAt.IsZero() || now.After(bucket.resetAt) || bucket.lastLimit != limit {
		bucket = rateBucket{tokens: limit, resetAt: now.Truncate(time.Minute).Add(time.Minute), lastLimit: limit}
	}
	if bucket.tokens <= 0 {
		l.buckets[key] = bucket
		return 0, false
	}
	bucket.tokens--
	l.buckets[key] = bucket
	return bucket.tokens, true
}

func monthWindowStart(now time.Time) time.Time {
	return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
}
