package service

import (
	"crypto/subtle"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"reqst/backend/internal/metrics"

	"github.com/golang-jwt/jwt/v5"
)

type AdminService struct {
	username   string
	password   string
	jwtSecret  []byte
	sessionTTL time.Duration
}

type AdminClaims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func NewAdminService(username string, password string, jwtSecret string, sessionTTL time.Duration) *AdminService {
	return &AdminService{
		username:   strings.TrimSpace(username),
		password:   password,
		jwtSecret:  []byte(strings.TrimSpace(jwtSecret)),
		sessionTTL: sessionTTL,
	}
}

func (s *AdminService) Enabled() bool {
	return s.username != "" && s.password != "" && len(s.jwtSecret) > 0
}

func (s *AdminService) Authenticate(username string, password string) (string, error) {
	if !s.Enabled() {
		return "", errors.New("admin access is not configured")
	}

	if strings.TrimSpace(username) != s.username {
		metrics.IncAuthAttempt("admin_login", "failure", "username")
		return "", errors.New("invalid admin credentials")
	}
	if subtle.ConstantTimeCompare([]byte(s.password), []byte(password)) != 1 {
		metrics.IncAuthAttempt("admin_login", "failure", "password")
		return "", errors.New("invalid admin credentials")
	}

	token, err := s.issueToken()
	if err != nil {
		metrics.IncAuthAttempt("admin_login", "failure", "issue_token")
		return "", err
	}
	metrics.IncAuthAttempt("admin_login", "success", "authenticated")
	return token, nil
}

func (s *AdminService) ParseToken(tokenString string) (AdminClaims, error) {
	if !s.Enabled() {
		return AdminClaims{}, errors.New("admin access is not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	})
	if err != nil {
		metrics.IncAuthAttempt("admin_token", "failure", "parse")
		return AdminClaims{}, fmt.Errorf("parse admin token: %w", err)
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid || claims.Role != "admin" {
		metrics.IncAuthAttempt("admin_token", "failure", "invalid")
		return AdminClaims{}, errors.New("invalid admin token")
	}
	metrics.IncAuthAttempt("admin_token", "success", "authenticated")
	return *claims, nil
}

func (s *AdminService) issueToken() (string, error) {
	now := time.Now().UTC()
	claims := AdminClaims{
		Username: s.username,
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomAdminID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.sessionTTL)),
			Subject:   s.username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign admin token: %w", err)
	}
	return signed, nil
}

func randomAdminID() string {
	var buf [16]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buf[:])
}
