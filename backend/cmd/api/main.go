package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"reqst/backend/internal/config"
	httpapi "reqst/backend/internal/http"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	st, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	authService := service.NewAuthService(st, cfg.JWTSecret, cfg.TelegramBotToken, cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge)
	invoiceService := service.NewInvoiceService(st, cfg.TonUSDOverride)
	paymentService := service.NewPaymentService(st)

	engine := httpapi.NewServer(cfg, st, authService, invoiceService, paymentService)
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
