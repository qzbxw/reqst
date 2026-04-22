package http

import (
	"encoding/json"
	stdhttp "net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func TestInternalTokenMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("rejects when token is not configured", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("accepts token from internal header", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "secret"}}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		request.Header.Set("X-Internal-Token", "secret")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 204, got %d", recorder.Code)
		}
	})

	t.Run("accepts token from bearer header", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "secret"}}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		request.Header.Set("Authorization", "Bearer secret")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 204, got %d", recorder.Code)
		}
	})
}

func TestCORSMiddlewareHandlesPreflight(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(corsMiddleware())
	router.OPTIONS("/resource", func(c *gin.Context) {
		t.Fatal("preflight request should not reach route handler")
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodOptions, "/resource", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != stdhttp.StatusNoContent {
		t.Fatalf("expected 204, got %d", recorder.Code)
	}
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("unexpected allow-origin header: %q", recorder.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestAdminLoginAndMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)

	loginRecorder := httptest.NewRecorder()
	loginRequest := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRecorder, loginRequest)

	if loginRecorder.Code != stdhttp.StatusOK {
		t.Fatalf("expected login 200, got %d", loginRecorder.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(loginRecorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	if body["token"] == "" {
		t.Fatal("expected admin token in response")
	}

	protectedRouter := gin.New()
	protectedRouter.Use(server.adminMiddleware())
	protectedRouter.GET("/api/admin/overview", func(c *gin.Context) {
		c.Status(stdhttp.StatusNoContent)
	})

	protectedRecorder := httptest.NewRecorder()
	protectedRequest := httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil)
	protectedRequest.Header.Set("Authorization", "Bearer "+body["token"])
	protectedRouter.ServeHTTP(protectedRecorder, protectedRequest)

	if protectedRecorder.Code != stdhttp.StatusNoContent {
		t.Fatalf("expected protected route 204, got %d", protectedRecorder.Code)
	}
}

func TestNormalizeScopes(t *testing.T) {
	defaults := normalizeScopes(nil)
	if len(defaults) != 2 || defaults[0] != "invoices:read" || defaults[1] != "invoices:write" {
		t.Fatalf("unexpected default scopes: %#v", defaults)
	}

	scopes := normalizeScopes([]string{" invoices:read ", "invoices:write", "invoices:read", "ignored"})
	if len(scopes) != 2 {
		t.Fatalf("expected two normalized scopes, got %#v", scopes)
	}
}

func TestExtractAPIKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = httptest.NewRequest(stdhttp.MethodGet, "/v1/me", nil)
	context.Request.Header.Set("X-API-Key", "header-key")
	if got := extractAPIKey(context); got != "header-key" {
		t.Fatalf("expected header api key, got %q", got)
	}

	context.Request = httptest.NewRequest(stdhttp.MethodGet, "/v1/me", nil)
	context.Request.Header.Set("Authorization", "Bearer bearer-key")
	if got := extractAPIKey(context); got != "bearer-key" {
		t.Fatalf("expected bearer api key, got %q", got)
	}
}

func TestValidateWebhookURL(t *testing.T) {
	if err := validateWebhookURL("https://example.com/hooks", "production"); err != nil {
		t.Fatalf("expected valid webhook URL, got %v", err)
	}
	if err := validateWebhookURL("ftp://example.com/hooks", "production"); err == nil {
		t.Fatal("expected unsupported scheme error")
	}
	if err := validateWebhookURL("https:///hooks", "production"); err == nil {
		t.Fatal("expected missing host error")
	}
	if err := validateWebhookURL("http://example.com/hooks", "production"); err == nil {
		t.Fatal("expected production http webhook error")
	}
	if err := validateWebhookURL("https://127.0.0.1/hooks", "production"); err == nil {
		t.Fatal("expected loopback webhook error")
	}
}

func TestPublicInvoiceResponse(t *testing.T) {
	comment := "REQST-ABC123"
	txHash := "tx-1"
	invoice := store.Invoice{
		ID:                 1,
		PublicID:           "INV123",
		Kind:               store.InvoiceKindSubscription,
		PlanCode:           store.PlanCodeTrial,
		Title:              "Reqst PRO · 30 days",
		BaseAmountUSD:      decimal.RequireFromString("39"),
		PayableAmount:      decimal.RequireFromString("11.250000"),
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
		PaymentComment:     &comment,
		Status:             store.InvoiceStatusAwaitingPayment,
		ExpiresAt:          time.Now().Add(time.Hour),
		TxHash:             &txHash,
	}

	response := publicInvoiceResponse(invoice)

	if response["checkout_badge"] != "Reqst PRO" {
		t.Fatalf("unexpected checkout badge: %#v", response["checkout_badge"])
	}
	if response["plan_code"] != store.PlanCodePro {
		t.Fatalf("unexpected plan code: %#v", response["plan_code"])
	}
	paymentURI, ok := response["payment_uri"].(string)
	if !ok || !strings.HasPrefix(paymentURI, "ton://transfer/") {
		t.Fatalf("unexpected payment uri: %#v", response["payment_uri"])
	}
	if response["status"] != store.InvoiceStatusAwaitingPayment {
		t.Fatalf("unexpected status: %#v", response["status"])
	}

	invoice.ExpiresAt = time.Now().Add(-time.Minute)
	response = publicInvoiceResponse(invoice)
	if response["status"] != store.InvoiceStatusExpired {
		t.Fatalf("expected expired status, got %#v", response["status"])
	}
}

func TestHelperUtilities(t *testing.T) {
	if !isSellerManagedInvoice(store.Invoice{Kind: store.InvoiceKindMerchant}) {
		t.Fatal("expected merchant invoice to be seller managed")
	}
	if isSellerManagedInvoice(store.Invoice{Kind: store.InvoiceKindSubscription, SubscriptionDays: 30}) {
		t.Fatal("expected subscription invoice not to be seller managed")
	}
	if got := parseIntDefault("15", 1); got != 15 {
		t.Fatalf("expected 15, got %d", got)
	}
	if got := parseIntDefault("invalid", 7); got != 7 {
		t.Fatalf("expected fallback 7, got %d", got)
	}
	if got := inferredNetworkFromPath("/internal/watchers/arbitrum"); got != store.NetworkARBITRUM {
		t.Fatalf("expected arbitrum, got %s", got)
	}
	if got := inferredNetworkFromPath("/internal/watchers/ton"); got != store.NetworkTON {
		t.Fatalf("expected ton, got %s", got)
	}
	if got := monthWindowStart(time.Date(2026, time.March, 24, 17, 30, 0, 0, time.FixedZone("UTC+3", 3*3600))); !got.Equal(time.Date(2026, time.March, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected month window start: %s", got)
	}
	if got := hashSecret(" secret "); got == "" {
		t.Fatal("expected secret hash")
	}
	token, prefix, err := generateTokenWithPrefix("rk_live_", 8)
	if err != nil {
		t.Fatalf("generateTokenWithPrefix returned error: %v", err)
	}
	if !strings.HasPrefix(token, "rk_live_") || prefix == "" {
		t.Fatalf("unexpected token or prefix: %q / %q", token, prefix)
	}
	if got := ternary(true, "a", "b"); got != "a" {
		t.Fatalf("expected ternary true branch, got %q", got)
	}
	if got := max(2, 5); got != 5 {
		t.Fatalf("expected max 5, got %d", got)
	}
	if err := validateWallet(store.NetworkEVM, "0x1111111111111111111111111111111111111111"); err != nil {
		t.Fatalf("expected valid wallet, got %v", err)
	}
}

func TestSellerHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	seller := store.Seller{ID: 1}

	t.Run("update contact email rejects invalid address", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(seller))
		router.POST("/api/me/contact-email", server.handleUpdateContactEmail)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/me/contact-email", strings.NewReader(`{"email":"not-an-email"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("create wallet rejects unsupported network", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(seller))
		router.POST("/api/wallets", server.handleCreateWallet)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets", strings.NewReader(`{"network":"BASE","address":"0x1"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("create invoice rejects invalid amount", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(seller))
		router.POST("/api/invoices", server.handleCreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices", strings.NewReader(`{"title":"Demo","base_amount_usd":"oops","payable_network":"TON"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("cancel invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(seller))
		router.POST("/api/invoices/:id/cancel", server.handleCancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices/not-a-number/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("mark invoice paid rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(seller))
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices/not-a-number/mark-paid", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestPublicAndInternalHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}

	t.Run("telegram auth rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram", server.handleTelegramAuth)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("telegram code request rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/request-code", server.handleTelegramCodeRequest)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/request-code", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("telegram code login rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/login", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("observed transfers reject incomplete event", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/watchers/ton", server.handleObservedTransfers)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(`{"events":[{"amount":"1","destination_address":"wallet","network":"TON"}]}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("grant pro rejects invalid seller id", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/sellers/:id/grant-pro", server.handleGrantPRO)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/admin/sellers/oops/grant-pro", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("block seller rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/sellers/:id/block", server.handleBlockSeller)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/admin/sellers/1/block", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestDeveloperHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	trialSeller := store.Seller{ID: 1}

	t.Run("create api key rejects unsupported plan", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller))
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("create webhook endpoint rejects unsupported plan", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller))
		router.POST("/api/developer/webhooks", server.handleCreateWebhookEndpoint)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("api create invoice rejects missing scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller), withAPIKeyScopes("invoices:read"))
		router.POST("/v1/invoices", server.handleAPICreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("api create invoice rejects invalid amount", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices", server.handleAPICreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{"title":"Demo","base_amount_usd":"oops"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("api get invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller), withAPIKeyScopes("invoices:read"))
		router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices/oops", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("api cancel invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withSellerContext(trialSeller), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/oops/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func withSellerContext(seller store.Seller) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("seller_ctx", sellerContext{Seller: seller})
		c.Next()
	}
}

func withAPIKeyScopes(scopes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("api_key_ctx", apiKeyContext{
			Key: store.APIKeyRecord{
				APIKey: store.APIKey{
					ID:     1,
					Scopes: scopes,
				},
			},
		})
		c.Next()
	}
}
