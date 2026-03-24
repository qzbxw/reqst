package service

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"

	"reqst/backend/internal/config"
)

type EmailSender interface {
	SendAuthCode(ctx context.Context, input AuthCodeEmail) error
}

type AuthCodeEmail struct {
	Email     string
	Code      string
	Purpose   string
	ExpiresAt time.Time
}

type LogEmailSender struct{}

func (s LogEmailSender) SendAuthCode(_ context.Context, input AuthCodeEmail) error {
	log.Printf("reqst auth code for %s (%s): %s, expires at %s", input.Email, input.Purpose, input.Code, input.ExpiresAt.Format(time.RFC3339))
	return nil
}

type SMTPEmailSender struct {
	fromEmail string
	fromName  string
	host      string
	port      string
	username  string
	password  string
}

func NewEmailSender(cfg config.Config) EmailSender {
	if strings.TrimSpace(cfg.SMTPHost) == "" || strings.TrimSpace(cfg.SMTPFromEmail) == "" {
		return LogEmailSender{}
	}

	return &SMTPEmailSender{
		fromEmail: cfg.SMTPFromEmail,
		fromName:  cfg.SMTPFromName,
		host:      cfg.SMTPHost,
		port:      cfg.SMTPPort,
		username:  cfg.SMTPUsername,
		password:  cfg.SMTPPassword,
	}
}

func (s *SMTPEmailSender) SendAuthCode(ctx context.Context, input AuthCodeEmail) error {
	subject, headline, description := authEmailCopy(input.Purpose)
	fromHeader := s.fromEmail
	if strings.TrimSpace(s.fromName) != "" {
		fromHeader = fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	}

	body := strings.Join([]string{
		fmt.Sprintf("From: %s", fromHeader),
		fmt.Sprintf("To: %s", input.Email),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		headline,
		"",
		fmt.Sprintf("Code: %s", input.Code),
		fmt.Sprintf("Expires: %s", input.ExpiresAt.Format(time.RFC1123)),
		"",
		description,
		"",
		"If you did not request this code, you can ignore this email.",
	}, "\r\n")

	addr := net.JoinHostPort(s.host, s.port)
	dialer := &net.Dialer{Timeout: 8 * time.Second}
	conn, err := dialer.DialContext(ctx, "tcp", addr)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return fmt.Errorf("create smtp client: %w", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}); err != nil {
			return fmt.Errorf("starttls: %w", err)
		}
	}

	if strings.TrimSpace(s.username) != "" {
		auth := smtp.PlainAuth("", s.username, s.password, s.host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}

	if err := client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("smtp from: %w", err)
	}
	if err := client.Rcpt(input.Email); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := writer.Write([]byte(body)); err != nil {
		_ = writer.Close()
		return fmt.Errorf("write smtp body: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close smtp writer: %w", err)
	}
	if err := client.Quit(); err != nil {
		return fmt.Errorf("smtp quit: %w", err)
	}
	return nil
}

func authEmailCopy(purpose string) (subject string, headline string, description string) {
	switch purpose {
	case EmailCodePurposePasswordReset:
		return "Reqst password reset code", "Use this code to set a new password for your reqst account.", "The code works only once and is meant for password recovery."
	case EmailCodePurposeLinkEmail:
		return "Reqst email link code", "Use this code to link email/password login to your current reqst account.", "After confirmation, the same account will be available both by email/password and by Telegram."
	default:
		return "Reqst sign-up code", "Use this code to finish creating your reqst account.", "After confirmation, you can sign in with your email/password and later link Telegram if you want."
	}
}
