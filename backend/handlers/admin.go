package handlers

import (
	"log"
	"strings"
	"time"

	"link-shortener/config"
	"link-shortener/database"
	"link-shortener/middleware"
	"link-shortener/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AdminHandler handles admin-related HTTP requests
type AdminHandler struct {
	config *config.Config
}

// NewAdminHandler creates a new AdminHandler instance
func NewAdminHandler(cfg *config.Config) *AdminHandler {
	return &AdminHandler{
		config: cfg,
	}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response body
type LoginResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

// Login authenticates admin and returns JWT
func (h *AdminHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get client IP
	ip := c.IP()
	if forwardedFor := c.Get("X-Forwarded-For"); forwardedFor != "" {
		ips := strings.Split(forwardedFor, ",")
		ip = strings.TrimSpace(ips[0])
	}
	userAgent := c.Get("User-Agent")
	if len(userAgent) > 512 {
		userAgent = userAgent[:512]
	}

	// Validate credentials
	success := req.Username == h.config.AdminUsername && req.Password == h.config.AdminPassword

	// Record login attempt
	attempt := models.LoginAttempt{
		Username:  req.Username,
		IPAddress: ip,
		UserAgent: userAgent,
		Success:   success,
		CreatedAt: time.Now(),
	}
	database.DB.Create(&attempt)

	if !success {
		log.Printf("FAILED LOGIN ATTEMPT: username=%s, ip=%s", req.Username, ip)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	log.Printf("SUCCESSFUL LOGIN: username=%s, ip=%s", req.Username, ip)

	// Generate JWT
	expiresAt := time.Now().Add(24 * time.Hour)
	claims := middleware.Claims{
		Username: req.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "kintercut",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.config.JWTSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(LoginResponse{
		Token:     tokenString,
		ExpiresAt: expiresAt.Unix(),
	})
}

// GetMyStats returns admin-created links with statistics
func (h *AdminHandler) GetMyStats(c *fiber.Ctx) error {
	var links []models.Link

	// Get admin-created links ordered by creation date
	err := database.DB.
		Where("created_by_admin = ?", true).
		Order("created_at DESC").
		Find(&links).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch links",
		})
	}

	// Get click counts for each link
	for i := range links {
		var count int64
		database.DB.Model(&models.Click{}).Where("link_id = ?", links[i].ID).Count(&count)
		links[i].ClickCount = count
	}

	return c.JSON(fiber.Map{
		"links": links,
		"total": len(links),
	})
}

// GetUserLinks returns user-created links (not admin) for admin to manage
func (h *AdminHandler) GetUserLinks(c *fiber.Ctx) error {
	var links []models.Link

	// Get user-created links (non-admin) ordered by creation date
	err := database.DB.
		Where("created_by_admin = ?", false).
		Order("created_at DESC").
		Find(&links).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch links",
		})
	}

	// Get click counts for each link
	for i := range links {
		var count int64
		database.DB.Model(&models.Click{}).Where("link_id = ?", links[i].ID).Count(&count)
		links[i].ClickCount = count
	}

	return c.JSON(fiber.Map{
		"links": links,
		"total": len(links),
	})
}

// GetLinkDetails returns detailed statistics for a specific link
func (h *AdminHandler) GetLinkDetails(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Link ID is required",
		})
	}

	var link models.Link
	if err := database.DB.Where("id = ?", id).First(&link).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Link not found",
		})
	}

	// Get total clicks
	var totalClicks int64
	database.DB.Model(&models.Click{}).Where("link_id = ?", link.ID).Count(&totalClicks)

	// Get unique IPs
	var uniqueIPs int64
	database.DB.Model(&models.Click{}).
		Where("link_id = ?", link.ID).
		Distinct("ip_address").
		Count(&uniqueIPs)

	// Get top countries
	var topCountries []models.CountryStat
	database.DB.Model(&models.Click{}).
		Select("country, count(*) as count").
		Where("link_id = ?", link.ID).
		Group("country").
		Order("count DESC").
		Limit(10).
		Scan(&topCountries)

	// Get recent clicks (last 100)
	var recentClicks []models.Click
	database.DB.
		Where("link_id = ?", link.ID).
		Order("clicked_at DESC").
		Limit(100).
		Find(&recentClicks)

	return c.JSON(fiber.Map{
		"link": link,
		"stats": models.ClickStats{
			TotalClicks:  totalClicks,
			UniqueIPs:    uniqueIPs,
			TopCountries: topCountries,
			RecentClicks: recentClicks,
		},
	})
}

// DeleteLink deletes a link and its click history
func (h *AdminHandler) DeleteLink(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Link ID is required",
		})
	}

	var link models.Link
	if err := database.DB.Where("id = ?", id).First(&link).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Link not found",
		})
	}

	// Delete clicks first (hard delete)
	database.DB.Unscoped().Where("link_id = ?", link.ID).Delete(&models.Click{})

	// Delete link (hard delete using Unscoped so slug can be reused)
	if err := database.DB.Unscoped().Delete(&link).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete link",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Link deleted successfully",
	})
}

// CreateAdminLink creates a permanent link (for admin use)
func (h *AdminHandler) CreateAdminLink(c *fiber.Ctx) error {
	var req models.CreateLinkRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL is required",
		})
	}

	var slug string
	if req.CustomSlug != "" {
		slug = req.CustomSlug
		// Check if slug exists
		var existing models.Link
		if err := database.DB.Where("slug = ?", slug).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This slug is already taken",
			})
		}
	} else {
		var err error
		slug, err = generateSlug()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate short link",
			})
		}
	}

	link := models.Link{
		Slug:           slug,
		OriginalURL:    req.URL,
		CreatedByAdmin: true,
		CreatedAt:      time.Now(),
		ExpiresAt:      nil, // Never expires
	}

	if err := database.DB.Create(&link).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create short link",
		})
	}

	// Use configurable base URL
	shortURL := h.config.BaseURL + "/" + link.Slug

	return c.Status(fiber.StatusCreated).JSON(models.CreateLinkResponse{
		ID:          link.ID,
		ShortURL:    shortURL,
		Slug:        link.Slug,
		OriginalURL: link.OriginalURL,
		ExpiresAt:   nil,
		Permanent:   true,
	})
}

// GetLoginAttempts returns recent login attempts for security auditing
func (h *AdminHandler) GetLoginAttempts(c *fiber.Ctx) error {
	var attempts []models.LoginAttempt

	// Get last 100 login attempts, newest first
	err := database.DB.
		Order("created_at DESC").
		Limit(100).
		Find(&attempts).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch login attempts",
		})
	}

	// Count failed attempts in last 24 hours
	var failedLast24h int64
	database.DB.Model(&models.LoginAttempt{}).
		Where("success = ? AND created_at > ?", false, time.Now().Add(-24*time.Hour)).
		Count(&failedLast24h)

	return c.JSON(fiber.Map{
		"attempts":        attempts,
		"total":           len(attempts),
		"failed_last_24h": failedLast24h,
	})
}
