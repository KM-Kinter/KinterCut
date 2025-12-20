package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/url"
	"regexp"
	"strings"
	"time"

	"link-shortener/config"
	"link-shortener/database"
	"link-shortener/models"
	"link-shortener/services"

	"github.com/gofiber/fiber/v2"
)

// Reserved slugs that cannot be used by users
var reservedSlugs = map[string]bool{
	"admin":     true,
	"adminek":   true,
	"not-found": true,
	"kinter":    true,
	"me":        true,
	"my":        true,
	"api":       true,
	"health":    true,
	"expired":   true,
}

// Slug validation regex (alphanumeric, hyphens, underscores)
var slugRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

// LinkHandler handles link-related HTTP requests
type LinkHandler struct {
	config     *config.Config
	geoService *services.GeoService
}

// NewLinkHandler creates a new LinkHandler instance
func NewLinkHandler(cfg *config.Config, geoService *services.GeoService) *LinkHandler {
	return &LinkHandler{
		config:     cfg,
		geoService: geoService,
	}
}

// ShortenLink creates a new short link
func (h *LinkHandler) ShortenLink(c *fiber.Ctx) error {
	var req models.CreateLinkRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate URL
	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL is required",
		})
	}

	// Parse and validate URL
	parsedURL, err := url.Parse(req.URL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid URL. Must be a valid HTTP or HTTPS URL",
		})
	}

	// Check if admin is creating the link
	isAdmin := c.Locals("isAdmin")
	createdByAdmin := isAdmin != nil && isAdmin.(bool)

	var slug string

	// Handle custom slug if provided
	if req.CustomSlug != "" {
		customSlug := strings.ToLower(strings.TrimSpace(req.CustomSlug))
		
		// Validate custom slug format
		if len(customSlug) < 3 || len(customSlug) > 30 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Custom slug must be 3-30 characters long",
			})
		}

		if !slugRegex.MatchString(customSlug) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Custom slug can only contain letters, numbers, hyphens, and underscores",
			})
		}

		// Check if slug is reserved (only admin can use reserved slugs)
		if reservedSlugs[customSlug] && !createdByAdmin {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "This slug is reserved",
			})
		}

		// Check if slug already exists
		var existing models.Link
		if err := database.DB.Where("slug = ?", customSlug).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This slug is already taken",
			})
		}

		slug = customSlug
	} else {
		// Generate random slug
		var err error
		slug, err = generateSlug()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate short link",
			})
		}
	}

	// Create link
	link := models.Link{
		Slug:           slug,
		OriginalURL:    req.URL,
		CreatedByAdmin: createdByAdmin,
		CreatedAt:      time.Now(),
	}

	// Set expiration for non-admin links
	if !createdByAdmin {
		expiresAt := time.Now().Add(h.config.PublicLinkTTL)
		link.ExpiresAt = &expiresAt
	}

	// Save to database
	if err := database.DB.Create(&link).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This slug is already taken",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create short link",
		})
	}

	// Build response with configurable base URL
	shortURL := h.config.BaseURL + "/" + link.Slug

	return c.Status(fiber.StatusCreated).JSON(models.CreateLinkResponse{
		ID:          link.ID,
		ShortURL:    shortURL,
		Slug:        link.Slug,
		OriginalURL: link.OriginalURL,
		ExpiresAt:   link.ExpiresAt,
		Permanent:   createdByAdmin,
	})
}

// RedirectLink redirects to the original URL and tracks the click
func (h *LinkHandler) RedirectLink(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Slug is required",
		})
	}

	// Find link
	var link models.Link
	if err := database.DB.Where("slug = ?", slug).First(&link).Error; err != nil {
		return c.Redirect("/not-found", fiber.StatusTemporaryRedirect)
	}

	// Check if link is expired
	if link.IsExpired() {
		return c.Redirect("/expired", fiber.StatusTemporaryRedirect)
	}

	// IMPORTANT: Extract all data from context BEFORE spawning goroutine
	// Fiber contexts are pooled and will be reused after the request completes
	ip := c.IP()
	if forwardedFor := c.Get("X-Forwarded-For"); forwardedFor != "" {
		ips := strings.Split(forwardedFor, ",")
		ip = strings.TrimSpace(ips[0])
	}
	userAgent := c.Get("User-Agent")
	if len(userAgent) > 512 {
		userAgent = userAgent[:512]
	}

	// Track click asynchronously with extracted data
	go h.trackClick(link.ID, ip, userAgent)

	// Redirect to original URL
	return c.Redirect(link.OriginalURL, fiber.StatusTemporaryRedirect)
}

// trackClick records click analytics asynchronously
func (h *LinkHandler) trackClick(linkID uint, ip string, userAgent string) {
	// Get geolocation
	geo, _ := h.geoService.GetLocation(ip)

	click := models.Click{
		LinkID:    linkID,
		ClickedAt: time.Now(),
		IPAddress: ip,
		UserAgent: userAgent,
		Country:   geo.Country,
		City:      geo.City,
		Region:    geo.Region,
	}

	if err := database.DB.Create(&click).Error; err != nil {
		// Log error but don't fail - click tracking is best-effort
		println("Error tracking click:", err.Error())
	}

	// Also update click count on the link
	database.DB.Model(&models.Link{}).Where("id = ?", linkID).UpdateColumn("click_count", database.DB.Raw("click_count + 1"))
}

// generateSlug creates a unique 7-character slug
func generateSlug() (string, error) {
	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	// Use URL-safe base64 encoding and trim to 7 chars
	slug := base64.URLEncoding.EncodeToString(bytes)
	slug = strings.ReplaceAll(slug, "+", "")
	slug = strings.ReplaceAll(slug, "/", "")
	slug = strings.ReplaceAll(slug, "=", "")
	if len(slug) > 7 {
		slug = slug[:7]
	}
	return slug, nil
}
