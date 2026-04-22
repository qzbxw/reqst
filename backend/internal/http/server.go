package http

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Server struct {
	cfg            config.Config
	store          *store.Store
	authService    *service.AuthService
	adminService   *service.AdminService
	invoiceService *service.InvoiceService
	paymentService *service.PaymentService
	apiLimiter     *memoryRateLimiter
}

type memoryRateLimiter struct {
	mu      sync.Mutex
	buckets map[string]rateBucket
}

type rateBucket struct {
	tokens    int
	resetAt   time.Time
	lastLimit int
}

type sellerContext struct {
	Claims service.Claims
	Seller store.Seller
}

func NewServer(cfg config.Config, st *store.Store, authService *service.AuthService, adminService *service.AdminService, invoiceService *service.InvoiceService, paymentService *service.PaymentService) *gin.Engine {
	server := &Server{
		cfg:            cfg,
		store:          st,
		authService:    authService,
		adminService:   adminService,
		invoiceService: invoiceService,
		paymentService: paymentService,
		apiLimiter:     &memoryRateLimiter{buckets: map[string]rateBucket{}},
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), corsMiddleware(), requestMetricsMiddleware())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "service": "reqst-api"})
	})

	router.POST("/api/auth/telegram", server.handleTelegramAuth)
	router.POST("/api/auth/telegram/request-code", server.handleTelegramCodeRequest)
	router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)
	router.POST("/api/admin/login", server.handleAdminLogin)
	router.GET("/api/public/invoices/:public_id", server.handlePublicInvoice)

	internal := router.Group("/internal")
	internal.Use(server.internalTokenMiddleware())
	internal.POST("/watchers/tron", server.handleObservedTransfers)
	internal.POST("/watchers/ton", server.handleObservedTransfers)
	internal.POST("/watchers/solana", server.handleObservedTransfers)
	internal.POST("/watchers/evm", server.handleObservedTransfers)
	internal.POST("/watchers/base", server.handleObservedTransfers)
	internal.POST("/watchers/arbitrum", server.handleObservedTransfers)
	internal.POST("/watchers/bsc", server.handleObservedTransfers)
	internal.POST("/admin/sellers/:id/grant-pro", server.handleGrantPRO)
	internal.POST("/admin/sellers/:id/block", server.handleBlockSeller)

	api := router.Group("/api")
	api.Use(server.authMiddleware())
	api.GET("/me", server.handleMe)
	api.POST("/me/contact-email", server.handleUpdateContactEmail)
	api.GET("/developer/usage", server.handleDeveloperUsage)
	api.GET("/developer/api-keys", server.handleListAPIKeys)
	api.POST("/developer/api-keys", server.handleCreateAPIKey)
	api.DELETE("/developer/api-keys/:id", server.handleDeleteAPIKey)
	api.GET("/developer/webhooks", server.handleListWebhookEndpoints)
	api.POST("/developer/webhooks", server.handleCreateWebhookEndpoint)
	api.POST("/developer/webhooks/:id/rotate-secret", server.handleRotateWebhookEndpointSecret)
	api.DELETE("/developer/webhooks/:id", server.handleDeleteWebhookEndpoint)
	api.GET("/developer/webhook-deliveries", server.handleListWebhookDeliveries)
	api.POST("/developer/webhook-deliveries/:id/resend", server.handleResendWebhookDelivery)
	api.GET("/wallets", server.handleListWallets)
	api.POST("/wallets", server.handleCreateWallet)
	api.DELETE("/wallets/:id", server.handleDeleteWallet)
	api.POST("/billing/checkout", server.handleCreateBillingCheckout)
	api.GET("/invoices", server.handleListInvoices)
	api.POST("/invoices", server.handleCreateInvoice)
	api.GET("/invoices/:id", server.handleGetInvoice)
	api.POST("/invoices/:id/cancel", server.handleCancelInvoice)
	api.POST("/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

	devAPI := router.Group("/v1")
	devAPI.Use(server.apiKeyMiddleware())
	devAPI.GET("/me", server.handleAPIMe)
	devAPI.GET("/invoices", server.handleAPIListInvoices)
	devAPI.POST("/invoices", server.handleAPICreateInvoice)
	devAPI.GET("/invoices/:id", server.handleAPIGetInvoice)
	devAPI.POST("/invoices/:id/cancel", server.handleAPICancelInvoice)
	devAPI.POST("/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

	adminAPI := router.Group("/api/admin")
	adminAPI.Use(server.adminMiddleware())
	adminAPI.GET("/overview", server.handleAdminOverview)
	adminAPI.GET("/invoices", server.handleAdminInvoices)
	adminAPI.POST("/sellers/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

	adminAPI.GET("/blog", server.handleAdminListBlogPosts)
	adminAPI.POST("/blog", server.handleAdminCreateBlogPost)
	adminAPI.PUT("/blog/:id", server.handleAdminUpdateBlogPost)
	adminAPI.DELETE("/blog/:id", server.handleAdminDeleteBlogPost)

	publicBlog := router.Group("/api/public/blog")
	publicBlog.GET("", server.handlePublicListBlogPosts)
	publicBlog.GET("/:slug", server.handlePublicGetBlogPost)

	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return router
}

func (s *Server) handleTelegramAuth(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	var body service.TelegramAuthInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.authService.AuthenticateTelegram(ctx, body)
	if err != nil {
		metrics.IncAuthAttempt("telegram", "failure", "authenticate")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram", "success", "authenticated")
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleTelegramCodeRequest(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	var body service.TelegramCodeRequestInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := s.authService.RequestTelegramLoginCode(ctx, body); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "request_code")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram_code_request", "success", "sent")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) handleTelegramCodeLogin(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	var body service.TelegramCodeLoginInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.authService.AuthenticateTelegramCode(ctx, body)
	if err != nil {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "authenticate")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram_code_login", "success", "authenticated")
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleMe(c *gin.Context) {
	sc := sellerFromContext(c)
	now := time.Now()
	plan := sc.Seller.EffectivePlan(now)

	c.JSON(http.StatusOK, gin.H{
		"seller": sc.Seller,
		"plan": map[string]any{
			"code":            plan.Code,
			"name":            plan.Name,
			"is_pro":          plan.Code != store.PlanCodeTrial,
			"has_api":         plan.HasAPI,
			"has_webhooks":    plan.HasWebhooks,
			"trial_limit":     service.TrialInvoiceLimit,
			"trial_remaining": max(0, service.TrialInvoiceLimit-sc.Seller.FreeInvoicesUsed),
			"price_usd":       plan.PriceUSDString,
			"billing_days":    plan.BillingDays,
			"api_key_limit":   plan.APIKeyLimit,
			"monthly_cap":     plan.MonthlyRequestCap,
			"rpm_limit":       plan.RequestsPerMinute,
			"webhook_retries": plan.WebhookRetries,
		},
		"plans": store.ListPaidPlans(),
	})
}

func (s *Server) handleUpdateContactEmail(c *gin.Context) {
	sc := sellerFromContext(c)
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))
	if email != "" && !strings.Contains(email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
		return
	}

	seller, err := s.store.UpdateSellerEmail(c.Request.Context(), sc.Seller.ID, email)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key") {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"seller": seller})
}

func (s *Server) handleListWallets(c *gin.Context) {
	sc := sellerFromContext(c)
	wallets, err := s.store.ListWallets(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": wallets})
}

func (s *Server) handleCreateWallet(c *gin.Context) {
	sc := sellerFromContext(c)
	var body struct {
		Network string `json:"network"`
		Address string `json:"address"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	network := store.Network(strings.ToUpper(strings.TrimSpace(body.Network)))
	address := strings.TrimSpace(body.Address)
	if !network.IsSupportedWalletNetwork() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported wallet network"})
		return
	}
	if err := validateWallet(network, address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := s.store.CreateWallet(c.Request.Context(), sc.Seller.ID, network, address)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, wallet)
}

func (s *Server) handleDeleteWallet(c *gin.Context) {
	sc := sellerFromContext(c)
	walletID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wallet id"})
		return
	}
	if err := s.store.DeactivateWallet(c.Request.Context(), sc.Seller.ID, walletID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleListInvoices(c *gin.Context) {
	_, _ = s.store.ExpireOverdueInvoices(c.Request.Context())
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

	c.JSON(http.StatusOK, gin.H{
		"items":     items,
		"page":      page,
		"page_size": pageSize,
	})
}

func (s *Server) handleCreateInvoice(c *gin.Context) {
	sc := sellerFromContext(c)
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
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, publicInvoiceResponse(invoice))
}

func (s *Server) handleGetInvoice(c *gin.Context) {
	_, _ = s.store.ExpireOverdueInvoices(c.Request.Context())
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

func (s *Server) handleCancelInvoice(c *gin.Context) {
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

func (s *Server) handleMarkInvoicePaid(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "only seller-created invoices can be marked paid"})
		return
	}

	invoice, err := s.store.MarkInvoicePaidManual(c.Request.Context(), sc.Seller.ID, invoiceID)
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

func (s *Server) handlePublicInvoice(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_checkout")
	_, _ = s.store.ExpireOverdueInvoices(ctx)
	invoice, err := s.store.GetInvoiceByPublicID(ctx, c.Param("public_id"))
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

func (s *Server) handleObservedTransfers(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "watcher_ingest")
	var body struct {
		Events []struct {
			TxHash             string          `json:"tx_hash"`
			Network            store.Network   `json:"network"`
			DestinationAddress string          `json:"destination_address"`
			Amount             decimal.Decimal `json:"amount"`
			PaymentComment     string          `json:"payment_comment"`
			ObservedAt         time.Time       `json:"observed_at"`
			RawPayload         any             `json:"raw_payload"`
		} `json:"events"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	metrics.ObserveBatch("observed_transfers", "watcher_ingest", len(body.Events))

	results := make([]service.PaymentResult, 0, len(body.Events))
	for _, event := range body.Events {
		raw := store.MustJSON(event.RawPayload)
		transfer := store.ObservedTransfer{
			TxHash:             event.TxHash,
			Network:            event.Network,
			DestinationAddress: event.DestinationAddress,
			Amount:             event.Amount,
			PaymentComment:     strings.TrimSpace(event.PaymentComment),
			ObservedAt:         event.ObservedAt,
			RawPayload:         raw,
		}
		if transfer.Network == "" {
			transfer.Network = inferredNetworkFromPath(c.FullPath())
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := s.paymentService.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{"items": results})
}

func (s *Server) handleGrantPRO(c *gin.Context) {
	sellerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller id"})
		return
	}

	var body struct {
		Days int `json:"days"`
	}
	_ = c.ShouldBindJSON(&body)

	seller, err := s.store.GrantPRO(c.Request.Context(), sellerID, body.Days)
	if err != nil {
		metrics.IncAdminOperation("grant_pro", "failure")
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	metrics.IncAdminOperation("grant_pro", "success")
	c.JSON(http.StatusOK, gin.H{"seller": seller})
}

func (s *Server) handleBlockSeller(c *gin.Context) {
	sellerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller id"})
		return
	}

	var body struct {
		Blocked bool `json:"blocked"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	seller, err := s.store.SetSellerBlocked(c.Request.Context(), sellerID, body.Blocked)
	if err != nil {
		metrics.IncAdminOperation("set_blocked", "failure")
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	metrics.IncAdminOperation("set_blocked", "success")
	c.JSON(http.StatusOK, gin.H{"seller": seller})
}

func (s *Server) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			metrics.IncAuthAttempt("bearer_token", "failure", "missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		token := strings.TrimSpace(header[len("Bearer "):])
		claims, err := s.authService.ParseToken(token)
		if err != nil {
			metrics.IncAuthAttempt("bearer_token", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		seller, err := s.store.GetSellerByID(c.Request.Context(), claims.SellerID)
		if err != nil {
			metrics.IncAuthAttempt("bearer_token", "failure", "seller_not_found")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "seller not found"})
			return
		}
		if seller.IsBlocked {
			metrics.IncAuthAttempt("bearer_token", "failure", "seller_blocked")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "seller account is blocked"})
			return
		}

		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "seller_api"))
		metrics.IncAuthAttempt("bearer_token", "success", "authenticated")
		c.Set("seller_ctx", sellerContext{Claims: claims, Seller: seller})
		c.Next()
	}
}

func (s *Server) internalTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if s.cfg.InternalToken == "" {
			metrics.IncAuthAttempt("internal_token", "failure", "not_configured")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "internal token is not configured"})
			return
		}
		token := strings.TrimSpace(c.GetHeader("X-Internal-Token"))
		if token == "" {
			auth := strings.TrimSpace(c.GetHeader("Authorization"))
			if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
				token = strings.TrimSpace(auth[len("Bearer "):])
			}
		}
		if token != s.cfg.InternalToken {
			metrics.IncAuthAttempt("internal_token", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid internal token"})
			return
		}
		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "internal_api"))
		metrics.IncAuthAttempt("internal_token", "success", "authenticated")
		c.Next()
	}
}

func requestMetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()
		metrics.ObserveHTTPRequest(c.Request.Method, c.FullPath(), c.Writer.Status(), time.Since(startedAt))
	}
}

func sellerFromContext(c *gin.Context) sellerContext {
	value, _ := c.Get("seller_ctx")
	return value.(sellerContext)
}

func publicInvoiceResponse(invoice store.Invoice) gin.H {
	status := invoice.Status
	if invoice.IsExpired(time.Now()) {
		status = store.InvoiceStatusExpired
	}
	comment := ""
	if invoice.PaymentComment != nil {
		comment = *invoice.PaymentComment
	}

	return gin.H{
		"id":                  invoice.ID,
		"public_id":           invoice.PublicID,
		"title":               invoice.Title,
		"kind":                invoice.Kind,
		"subscription_days":   invoice.SubscriptionDays,
		"plan_code":           normalizedInvoicePlanCode(invoice),
		"checkout_badge":      checkoutBadge(invoice),
		"base_amount_usd":     invoice.BaseAmountUSD.StringFixed(2),
		"payable_amount":      invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork)),
		"payable_network":     invoice.PayableNetwork,
		"destination_address": invoice.DestinationAddress,
		"payment_comment":     comment,
		"status":              status,
		"mode":                invoice.Mode,
		"expires_at":          invoice.ExpiresAt,
		"created_at":          invoice.CreatedAt,
		"tx_hash":             invoice.TxHash,
		"checkout_url":        "/checkout/" + invoice.PublicID,
		"payment_uri":         paymentURI(invoice),
	}
}

func isSellerManagedInvoice(invoice store.Invoice) bool {
	return invoice.Kind == store.InvoiceKindMerchant && invoice.SubscriptionDays <= 0
}

func (s *Server) handleCreateBillingCheckout(c *gin.Context) {
	sc := sellerFromContext(c)
	var body struct {
		PayableNetwork string `json:"payable_network"`
		PlanCode       string `json:"plan_code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	network := store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork)))
	planCode := store.NormalizePlanCode(body.PlanCode)
	if strings.TrimSpace(body.PlanCode) == "" {
		planCode = store.PlanCodePro
	}
	invoice, err := s.invoiceService.CreatePlanInvoice(c.Request.Context(), sc.Seller, planCode, network)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, publicInvoiceResponse(invoice))
}

func checkoutBadge(invoice store.Invoice) string {
	if invoice.Kind == store.InvoiceKindSubscription {
		return store.ResolvePlan(normalizedInvoicePlanCode(invoice)).CheckoutBadge
	}
	return "Merchant Checkout"
}

func normalizedInvoicePlanCode(invoice store.Invoice) store.PlanCode {
	code := store.NormalizePlanCode(string(invoice.PlanCode))
	if invoice.Kind == store.InvoiceKindSubscription && code == store.PlanCodeTrial {
		return store.PlanCodePro
	}
	return code
}

func paymentURI(invoice store.Invoice) string {
	switch invoice.PayableNetwork {
	case store.NetworkTON:
		comment := ""
		if invoice.PaymentComment != nil {
			comment = *invoice.PaymentComment
		}
		return "ton://transfer/" + invoice.DestinationAddress + "?amount=" + invoice.PayableAmount.Mul(decimal.NewFromInt(1_000_000_000)).StringFixed(0) + "&text=" + url.QueryEscape(comment)
	case store.NetworkTRON, store.NetworkSOLANA, store.NetworkEVM, store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC:
		return invoice.DestinationAddress
	default:
		return invoice.DestinationAddress
	}
}

func validateWallet(network store.Network, address string) error {
	return store.ValidateWalletAddress(network, address)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Internal-Token, X-API-Key, Idempotency-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func parseIntDefault(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func ternary[T any](condition bool, whenTrue T, whenFalse T) T {
	if condition {
		return whenTrue
	}
	return whenFalse
}

func max(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func payableScale(network store.Network) int32 {
	if network == store.NetworkTON {
		return 6
	}
	return 6
}

func inferredNetworkFromPath(path string) store.Network {
	switch {
	case strings.Contains(path, "/watchers/ton"):
		return store.NetworkTON
	case strings.Contains(path, "/watchers/tron"):
		return store.NetworkTRON
	case strings.Contains(path, "/watchers/solana"):
		return store.NetworkSOLANA
	case strings.Contains(path, "/watchers/base"):
		return store.NetworkBASE
	case strings.Contains(path, "/watchers/arbitrum"):
		return store.NetworkARBITRUM
	case strings.Contains(path, "/watchers/bsc"):
		return store.NetworkBSC
	case strings.Contains(path, "/watchers/evm"):
		return store.NetworkEVM
	default:
		return ""
	}
}
