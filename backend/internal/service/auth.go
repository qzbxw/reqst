package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	EmailCodePurposeRegistration  = "registration"
	EmailCodePurposeLinkEmail     = "link_email"
	EmailCodePurposePasswordReset = "password_reset"
	emailCodeTTL                  = 10 * time.Minute
	minPasswordLength             = 8
)

type AuthService struct {
	store              *store.Store
	jwtSecret          []byte
	telegramBotToken   string
	allowInsecureDev   bool
	telegramInitMaxAge time.Duration
	emailSender        EmailSender
}

type TelegramAuthInput struct {
	InitData   string `json:"init_data"`
	WidgetData string `json:"widget_data"`
	TelegramID int64  `json:"telegram_id"`
	Username   string `json:"username"`
}

type EmailLoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type EmailCodeRequestInput struct {
	Email string `json:"email"`
}

type EmailRegisterInput struct {
	Email    string `json:"email"`
	Code     string `json:"code"`
	Password string `json:"password"`
}

type EmailPasswordResetInput struct {
	Email       string `json:"email"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

type AuthResult struct {
	Token  string       `json:"token"`
	Seller store.Seller `json:"seller"`
}

type Claims struct {
	SellerID   int64  `json:"seller_id"`
	TelegramID *int64 `json:"telegram_id,omitempty"`
	Username   string `json:"username"`
	jwt.RegisteredClaims
}

func NewAuthService(st *store.Store, jwtSecret string, telegramBotToken string, allowInsecureDev bool, telegramInitMaxAge time.Duration, emailSender EmailSender) *AuthService {
	if emailSender == nil {
		emailSender = LogEmailSender{}
	}
	return &AuthService{
		store:              st,
		jwtSecret:          []byte(jwtSecret),
		telegramBotToken:   telegramBotToken,
		allowInsecureDev:   allowInsecureDev,
		telegramInitMaxAge: telegramInitMaxAge,
		emailSender:        emailSender,
	}
}

func (s *AuthService) AuthenticateTelegram(ctx context.Context, input TelegramAuthInput) (AuthResult, error) {
	telegramID, username, err := s.resolveTelegramIdentity(input)
	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.UpsertSellerByTelegram(ctx, telegramID, username)
	if err != nil {
		return AuthResult{}, fmt.Errorf("upsert seller: %w", err)
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) AuthenticateEmail(ctx context.Context, input EmailLoginInput) (AuthResult, error) {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.GetSellerByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return AuthResult{}, errors.New("account with this email was not found")
		}
		return AuthResult{}, fmt.Errorf("load seller by email: %w", err)
	}
	if !seller.HasPassword {
		return AuthResult{}, errors.New("this account does not have email/password sign-in yet")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(seller.PasswordHash), []byte(strings.TrimSpace(input.Password))); err != nil {
		return AuthResult{}, errors.New("incorrect email or password")
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) RequestRegistrationCode(ctx context.Context, input EmailCodeRequestInput) error {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return err
	}

	if seller, err := s.store.GetSellerByEmail(ctx, email); err == nil && seller.ID > 0 {
		return errors.New("email is already linked to an existing account")
	} else if err != nil && !errors.Is(err, store.ErrNotFound) {
		return fmt.Errorf("check existing email: %w", err)
	}

	return s.createAndSendEmailCode(ctx, nil, email, EmailCodePurposeRegistration)
}

func (s *AuthService) RegisterWithEmail(ctx context.Context, input EmailRegisterInput) (AuthResult, error) {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return AuthResult{}, err
	}
	if err := validatePassword(input.Password); err != nil {
		return AuthResult{}, err
	}

	if seller, err := s.store.GetSellerByEmail(ctx, email); err == nil && seller.ID > 0 {
		return AuthResult{}, errors.New("email is already linked to an existing account")
	} else if err != nil && !errors.Is(err, store.ErrNotFound) {
		return AuthResult{}, fmt.Errorf("check existing email: %w", err)
	}

	if _, err := s.consumeEmailCode(ctx, email, EmailCodePurposeRegistration, input.Code); err != nil {
		return AuthResult{}, err
	}

	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.CreateSellerWithEmail(ctx, email, passwordHash, time.Now())
	if err != nil {
		return AuthResult{}, fmt.Errorf("create seller with email: %w", err)
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) RequestEmailLinkCode(ctx context.Context, seller store.Seller, input EmailCodeRequestInput) error {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return err
	}

	if existing, err := s.store.GetSellerByEmail(ctx, email); err == nil && existing.ID != seller.ID {
		return errors.New("this email is already linked to another account")
	} else if err != nil && !errors.Is(err, store.ErrNotFound) {
		return fmt.Errorf("check linked email: %w", err)
	}

	return s.createAndSendEmailCode(ctx, &seller.ID, email, EmailCodePurposeLinkEmail)
}

func (s *AuthService) ConfirmEmailLink(ctx context.Context, seller store.Seller, input EmailRegisterInput) (store.Seller, error) {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return store.Seller{}, err
	}
	if err := validatePassword(input.Password); err != nil {
		return store.Seller{}, err
	}

	linkedSellerID, err := s.consumeEmailCode(ctx, email, EmailCodePurposeLinkEmail, input.Code)
	if err != nil {
		return store.Seller{}, err
	}
	if linkedSellerID == nil || *linkedSellerID != seller.ID {
		return store.Seller{}, errors.New("the code does not belong to the current account")
	}

	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return store.Seller{}, err
	}

	updated, err := s.store.SetSellerEmailCredentials(ctx, seller.ID, email, passwordHash, time.Now())
	if err != nil {
		return store.Seller{}, fmt.Errorf("save email credentials: %w", err)
	}
	return updated, nil
}

func (s *AuthService) RequestPasswordResetCode(ctx context.Context, input EmailCodeRequestInput) error {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return err
	}

	seller, err := s.store.GetSellerByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil
		}
		return fmt.Errorf("load seller by email: %w", err)
	}

	return s.createAndSendEmailCode(ctx, &seller.ID, email, EmailCodePurposePasswordReset)
}

func (s *AuthService) ResetPassword(ctx context.Context, input EmailPasswordResetInput) (AuthResult, error) {
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return AuthResult{}, err
	}
	if err := validatePassword(input.NewPassword); err != nil {
		return AuthResult{}, err
	}

	sellerID, err := s.consumeEmailCode(ctx, email, EmailCodePurposePasswordReset, input.Code)
	if err != nil {
		return AuthResult{}, err
	}
	if sellerID == nil {
		return AuthResult{}, errors.New("the reset code is not attached to a valid account")
	}

	passwordHash, err := hashPassword(input.NewPassword)
	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.ResetSellerPassword(ctx, *sellerID, passwordHash)
	if err != nil {
		return AuthResult{}, fmt.Errorf("reset seller password: %w", err)
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) LinkTelegram(ctx context.Context, seller store.Seller, input TelegramAuthInput) (store.Seller, error) {
	telegramID, username, err := s.resolveTelegramIdentity(input)
	if err != nil {
		return store.Seller{}, err
	}

	existing, err := s.store.GetSellerByTelegramID(ctx, telegramID)
	if err == nil && existing.ID != seller.ID {
		return store.Seller{}, errors.New("this Telegram account is already linked to another reqst account")
	}
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return store.Seller{}, fmt.Errorf("check existing Telegram link: %w", err)
	}

	updated, err := s.store.LinkTelegramToSeller(ctx, seller.ID, telegramID, username)
	if err != nil {
		return store.Seller{}, fmt.Errorf("link Telegram account: %w", err)
	}
	if updated.IsBlocked {
		return store.Seller{}, errors.New("seller account is blocked")
	}
	return updated, nil
}

func (s *AuthService) ParseToken(tokenString string) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	})
	if err != nil {
		return Claims{}, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return Claims{}, errors.New("invalid token")
	}
	return *claims, nil
}

func (s *AuthService) issueAuthResult(seller store.Seller) (AuthResult, error) {
	if seller.IsBlocked {
		return AuthResult{}, errors.New("seller account is blocked")
	}

	token, err := s.issueToken(seller)
	if err != nil {
		return AuthResult{}, err
	}

	return AuthResult{
		Token:  token,
		Seller: seller,
	}, nil
}

func (s *AuthService) issueToken(seller store.Seller) (string, error) {
	now := time.Now()
	claims := Claims{
		SellerID:   seller.ID,
		TelegramID: seller.TelegramID,
		Username:   seller.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(72 * time.Hour)),
			Subject:   strconv.FormatInt(seller.ID, 10),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}

func (s *AuthService) resolveTelegramIdentity(input TelegramAuthInput) (int64, string, error) {
	if strings.TrimSpace(input.InitData) != "" {
		return s.validateInitData(input.InitData)
	}
	if strings.TrimSpace(input.WidgetData) != "" {
		return s.validateWidgetData(input.WidgetData)
	}
	if s.allowInsecureDev && input.TelegramID > 0 {
		return input.TelegramID, strings.TrimSpace(input.Username), nil
	}
	return 0, "", errors.New("telegram authentication data is required")
}

func (s *AuthService) validateInitData(initData string) (int64, string, error) {
	if s.telegramBotToken == "" {
		return 0, "", errors.New("TELEGRAM_BOT_TOKEN is required for Telegram auth")
	}

	values, err := url.ParseQuery(initData)
	if err != nil {
		return 0, "", fmt.Errorf("parse init_data: %w", err)
	}

	hash := values.Get("hash")
	if hash == "" {
		return 0, "", errors.New("telegram hash is missing")
	}

	authDateValue := values.Get("auth_date")
	if authDateValue == "" {
		return 0, "", errors.New("telegram auth_date is missing")
	}
	authUnix, err := strconv.ParseInt(authDateValue, 10, 64)
	if err != nil {
		return 0, "", errors.New("telegram auth_date is invalid")
	}
	if time.Since(time.Unix(authUnix, 0)) > s.telegramInitMaxAge {
		return 0, "", errors.New("telegram init_data is too old")
	}

	dataCheckString := telegramDataCheckString(values)
	expectedHash, err := telegramExpectedHash(s.telegramBotToken, dataCheckString)
	if err != nil {
		return 0, "", err
	}
	if !hmac.Equal([]byte(hash), []byte(expectedHash)) {
		return 0, "", errors.New("telegram signature mismatch")
	}

	userJSON := values.Get("user")
	if userJSON == "" {
		return 0, "", errors.New("telegram user payload is missing")
	}

	var user struct {
		ID       int64  `json:"id"`
		Username string `json:"username"`
	}
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		return 0, "", fmt.Errorf("decode telegram user: %w", err)
	}
	if user.ID == 0 {
		return 0, "", errors.New("telegram user id is missing")
	}

	return user.ID, strings.TrimSpace(user.Username), nil
}

func (s *AuthService) validateWidgetData(queryString string) (int64, string, error) {
	values, err := url.ParseQuery(queryString)
	if err != nil {
		return 0, "", fmt.Errorf("parse widget_data: %w", err)
	}

	hash := values.Get("hash")
	if hash == "" {
		return 0, "", errors.New("widget hash is missing")
	}

	keys := make([]string, 0, len(values))
	for k := range values {
		if k != "hash" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var dataParts []string
	for _, k := range keys {
		dataParts = append(dataParts, fmt.Sprintf("%s=%s", k, values.Get(k)))
	}
	dataCheckString := strings.Join(dataParts, "\n")

	sha := sha256.New()
	sha.Write([]byte(s.telegramBotToken))
	secretKey := sha.Sum(nil)

	mac := hmac.New(sha256.New, secretKey)
	mac.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(hash), []byte(expectedHash)) {
		return 0, "", errors.New("widget signature mismatch")
	}

	idStr := values.Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, "", fmt.Errorf("invalid telegram id in widget: %w", err)
	}

	return id, strings.TrimSpace(values.Get("username")), nil
}

func (s *AuthService) createAndSendEmailCode(ctx context.Context, sellerID *int64, email string, purpose string) error {
	code, err := randomDigits(6)
	if err != nil {
		return fmt.Errorf("generate auth code: %w", err)
	}

	expiresAt := time.Now().Add(emailCodeTTL)
	if err := s.store.StoreEmailAuthCode(ctx, sellerID, email, purpose, hashEmailCode(email, purpose, code), expiresAt); err != nil {
		return err
	}
	if err := s.emailSender.SendAuthCode(ctx, AuthCodeEmail{
		Email:     email,
		Code:      code,
		Purpose:   purpose,
		ExpiresAt: expiresAt,
	}); err != nil {
		return fmt.Errorf("send auth code email: %w", err)
	}
	return nil
}

func (s *AuthService) consumeEmailCode(ctx context.Context, email string, purpose string, code string) (*int64, error) {
	if strings.TrimSpace(code) == "" {
		return nil, errors.New("verification code is required")
	}

	sellerID, err := s.store.ConsumeEmailAuthCode(ctx, email, purpose, hashEmailCode(email, purpose, code))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, errors.New("verification code is invalid or expired")
		}
		return nil, fmt.Errorf("consume email code: %w", err)
	}
	return sellerID, nil
}

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	if email == "" {
		return "", errors.New("email is required")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return "", errors.New("invalid email address")
	}
	return email, nil
}

func validatePassword(value string) error {
	password := strings.TrimSpace(value)
	if len(password) < minPasswordLength {
		return fmt.Errorf("password must be at least %d characters long", minPasswordLength)
	}
	return nil
}

func hashPassword(value string) (string, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(strings.TrimSpace(value)), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(passwordHash), nil
}

func telegramDataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		if key == "hash" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", key, values.Get(key)))
	}
	return strings.Join(parts, "\n")
}

func telegramExpectedHash(botToken string, dataCheckString string) (string, error) {
	secret := hmac.New(sha256.New, []byte("WebAppData"))
	if _, err := secret.Write([]byte(botToken)); err != nil {
		return "", fmt.Errorf("derive telegram secret: %w", err)
	}

	mac := hmac.New(sha256.New, secret.Sum(nil))
	if _, err := mac.Write([]byte(dataCheckString)); err != nil {
		return "", fmt.Errorf("hash telegram data: %w", err)
	}
	return hex.EncodeToString(mac.Sum(nil)), nil
}

func hashEmailCode(email string, purpose string, code string) string {
	sum := sha256.Sum256([]byte(strings.ToLower(strings.TrimSpace(email)) + "|" + purpose + "|" + strings.TrimSpace(code)))
	return hex.EncodeToString(sum[:])
}

func randomDigits(length int) (string, error) {
	if length <= 0 {
		return "", errors.New("invalid random length")
	}

	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	var builder strings.Builder
	builder.Grow(length)
	for _, part := range buf {
		builder.WriteByte('0' + (part % 10))
	}
	return builder.String(), nil
}

func randomID() string {
	var buf [16]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	return hex.EncodeToString(buf[:])
}
