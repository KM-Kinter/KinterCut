package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"link-shortener/config"
	"link-shortener/database"
	"link-shortener/handlers"
	"link-shortener/middleware"
	"link-shortener/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize services
	geoService := services.NewGeoService()

	// Initialize handlers
	linkHandler := handlers.NewLinkHandler(cfg, geoService)
	adminHandler := handlers.NewAdminHandler(cfg)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "KinterCut API",
		ServerHeader: "KinterCut",
		ErrorHandler: customErrorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.FrontendURL + ", " + cfg.BaseURL + ", http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"name":   "KinterCut API",
		})
	})

	// API routes
	api := app.Group("/api")

	// Public link shortening (with optional auth)
	api.Post("/shorten", middleware.OptionalAuth(cfg), linkHandler.ShortenLink)

	// Admin routes
	admin := api.Group("/admin")
	
	// Rate limiter for login: 3 attempts per 24 hours per IP (brute-force protection)
	loginLimiter := limiter.New(limiter.Config{
		Max:        3,
		Expiration: 24 * time.Hour,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many login attempts. Your IP is blocked for 24 hours.",
			})
		},
	})
	admin.Post("/login", loginLimiter, adminHandler.Login)

	// Protected admin routes
	adminProtected := admin.Group("", middleware.AuthRequired(cfg))
	adminProtected.Get("/my", adminHandler.GetMyStats)
	adminProtected.Get("/users", adminHandler.GetUserLinks)
	adminProtected.Get("/logins", adminHandler.GetLoginAttempts)
	adminProtected.Get("/links/:id", adminHandler.GetLinkDetails)
	adminProtected.Delete("/links/:id", adminHandler.DeleteLink)
	adminProtected.Post("/links", adminHandler.CreateAdminLink)

	// Expired link page
	app.Get("/expired", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusGone).JSON(fiber.Map{
			"error":   "This link has expired",
			"message": "The short link you are trying to access has expired. Public links expire after 48 hours.",
		})
	})

	// Redirect route (must be last to avoid conflicts)
	app.Get("/:slug", linkHandler.RedirectLink)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		if err := app.Shutdown(); err != nil {
			log.Fatalf("Server shutdown failed: %v", err)
		}
	}()

	// Start server
	log.Printf("Starting KinterCut server on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// customErrorHandler handles HTTP errors
func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}
