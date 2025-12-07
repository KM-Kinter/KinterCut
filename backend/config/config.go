package config

import (
	"os"
	"time"
)

// Config holds all application configuration
type Config struct {
	DatabaseURL   string
	AdminUsername string
	AdminPassword string
	JWTSecret     string
	PublicLinkTTL time.Duration
	Port          string
	FrontendURL   string
	BaseURL       string
}

// Load reads configuration from environment variables
func Load() *Config {
	ttl := 48 * time.Hour
	if ttlStr := os.Getenv("PUBLIC_LINK_TTL"); ttlStr != "" {
		if parsed, err := time.ParseDuration(ttlStr); err == nil {
			ttl = parsed
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}

	return &Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://linkuser:linkpass@localhost:5432/linkdb?sslmode=disable"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		JWTSecret:     getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		PublicLinkTTL: ttl,
		Port:          port,
		FrontendURL:   frontendURL,
		BaseURL:       baseURL,
	}
}

// getEnv returns environment variable value or default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
