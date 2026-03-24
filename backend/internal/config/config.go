package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv               string
	AppRuntime           string
	HTTPPort             string
	MetricsPort          string
	DatabaseURL          string
	JWTSecret            string
	InternalToken        string
	TelegramBotToken     string
	TelegramInitMaxAge   time.Duration
	AllowInsecureDevAuth bool
	PublicAppURL         string
	WatcherPollInterval  time.Duration
	TronGridBaseURL      string
	TronGridAPIKey       string
	TonCenterBaseURL     string
	TonCenterAPIKey      string
	TonUSDOverride       string
	SolanaRPCURL         string
	EthereumRPCURL       string
	BaseRPCURL           string
	ArbitrumRPCURL       string
	BSCRPCURL            string
	AdminUsername        string
	AdminPassword        string
	AdminJWTSecret       string
	AdminSessionTTL      time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:               envOrDefault("APP_ENV", "development"),
		AppRuntime:           envOrDefault("APP_RUNTIME", "api"),
		HTTPPort:             envOrDefault("HTTP_PORT", "8080"),
		DatabaseURL:          os.Getenv("DATABASE_URL"),
		JWTSecret:            os.Getenv("JWT_SECRET"),
		InternalToken:        os.Getenv("INTERNAL_TOKEN"),
		TelegramBotToken:     os.Getenv("TELEGRAM_BOT_TOKEN"),
		AllowInsecureDevAuth: boolEnv("ALLOW_INSECURE_DEV_AUTH", false),
		PublicAppURL:         envOrDefault("PUBLIC_APP_URL", "http://localhost:5173"),
		TronGridBaseURL:      envOrDefault("TRONGRID_BASE_URL", "https://api.trongrid.io"),
		TronGridAPIKey:       os.Getenv("TRONGRID_API_KEY"),
		TonCenterBaseURL:     envOrDefault("TONCENTER_BASE_URL", "https://toncenter.com/api/v2"),
		TonCenterAPIKey:      os.Getenv("TONCENTER_API_KEY"),
		TonUSDOverride:       os.Getenv("TON_USD_RATE"),
		SolanaRPCURL:         envOrDefault("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
		EthereumRPCURL:       envOrDefault("ETHEREUM_RPC_URL", "https://eth.llamarpc.com"),
		BaseRPCURL:           envOrDefault("BASE_RPC_URL", "https://base.llamarpc.com"),
		ArbitrumRPCURL:       envOrDefault("ARBITRUM_RPC_URL", "https://arbitrum.llamarpc.com"),
		BSCRPCURL:            envOrDefault("BSC_RPC_URL", "https://bsc.llamarpc.com"),
		AdminUsername:        os.Getenv("ADMIN_USERNAME"),
		AdminPassword:        os.Getenv("ADMIN_PASSWORD"),
		AdminJWTSecret:       envOrDefault("ADMIN_JWT_SECRET", os.Getenv("JWT_SECRET")),
	}
	cfg.MetricsPort = envOrDefault("METRICS_PORT", defaultMetricsPort(cfg.AppRuntime))

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	initMaxAgeSeconds := intEnv("TELEGRAM_INIT_MAX_AGE_SECONDS", 86400)
	cfg.TelegramInitMaxAge = time.Duration(initMaxAgeSeconds) * time.Second

	pollInterval, err := time.ParseDuration(envOrDefault("WATCHER_POLL_INTERVAL", "20s"))
	if err != nil {
		return Config{}, fmt.Errorf("WATCHER_POLL_INTERVAL: %w", err)
	}
	cfg.WatcherPollInterval = pollInterval

	adminSessionTTL, err := time.ParseDuration(envOrDefault("ADMIN_SESSION_TTL", "12h"))
	if err != nil {
		return Config{}, fmt.Errorf("ADMIN_SESSION_TTL: %w", err)
	}
	cfg.AdminSessionTTL = adminSessionTTL

	return cfg, nil
}

func defaultMetricsPort(runtime string) string {
	switch runtime {
	case "watcher":
		return "9091"
	case "bot":
		return "9092"
	default:
		return "9090"
	}
}

func envOrDefault(name string, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func boolEnv(name string, fallback bool) bool {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func intEnv(name string, fallback int) int {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
