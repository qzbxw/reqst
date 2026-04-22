package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"reqst/backend/internal/config"
	httpapi "reqst/backend/internal/http"
	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"
)

// @title           Reqst API
// @version         1.0
// @description     Reqst Payment API
// @host            localhost:8080
// @BasePath        /v1

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	metrics.Init("api", cfg.AppEnv)
	st, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	authService := service.NewAuthService(st, cfg.JWTSecret, cfg.TelegramBotToken, cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge)
	adminService := service.NewAdminService(cfg.AdminUsername, cfg.AdminPassword, cfg.AdminJWTSecret, cfg.AdminSessionTTL)
	invoiceService := service.NewInvoiceService(st, cfg.TonUSDOverride)
	paymentService := service.NewPaymentService(st)

	engine := httpapi.NewServer(cfg, st, authService, adminService, invoiceService, paymentService)
	metrics.StartServer(ctx, ":"+cfg.MetricsPort, logger)
	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("reqst api listening on :%s", cfg.HTTPPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
