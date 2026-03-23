package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"reqst/backend/internal/store"
)

type BotWorker struct {
	store      *store.Store
	token      string
	httpClient *http.Client
	logger     *slog.Logger
}

func NewBotWorker(st *store.Store, token string, logger *slog.Logger) *BotWorker {
	return &BotWorker{
		store:  st,
		token:  token,
		logger: logger,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (b *BotWorker) Run(ctx context.Context) error {
	if strings.TrimSpace(b.token) == "" {
		b.logger.Info("telegram bot token is empty, bot worker is idle")
		<-ctx.Done()
		return ctx.Err()
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		if err := b.flush(ctx); err != nil {
			b.logger.Error("flush telegram notifications", "error", err)
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (b *BotWorker) flush(ctx context.Context) error {
	jobs, err := b.store.ClaimNotificationJobs(ctx, 20)
	if err != nil {
		return err
	}

	for _, job := range jobs {
		if err := b.sendMessage(ctx, job.RecipientTelegramID, job.Message); err != nil {
			_ = b.store.MarkNotificationFailed(ctx, job.ID, err.Error())
			continue
		}
		_ = b.store.MarkNotificationSent(ctx, job.ID)
	}
	return nil
}

func (b *BotWorker) sendMessage(ctx context.Context, chatID int64, text string) error {
	payload := map[string]any{
		"chat_id": chatID,
		"text":    text,
	}
	body, _ := json.Marshal(payload)
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", b.token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build telegram request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("telegram sendMessage: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("telegram sendMessage failed: %s", strings.TrimSpace(string(respBody)))
	}
	return nil
}
