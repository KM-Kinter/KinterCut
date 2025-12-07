package middleware

import (
	"strings"

	"link-shortener/config"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Claims represents JWT token claims
type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// AuthRequired is middleware that requires valid JWT authentication
func AuthRequired(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenString := parts[1]

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// Set admin username in context
		c.Locals("admin", claims.Username)

		return c.Next()
	}
}

// OptionalAuth checks for JWT but does not require it
func OptionalAuth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			c.Locals("isAdmin", false)
			return c.Next()
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Locals("isAdmin", false)
			return c.Next()
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.Locals("isAdmin", false)
			return c.Next()
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.Locals("isAdmin", false)
			return c.Next()
		}

		c.Locals("isAdmin", true)
		c.Locals("admin", claims.Username)

		return c.Next()
	}
}
