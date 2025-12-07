package models

import (
	"time"

	"gorm.io/gorm"
)

// Link represents a shortened URL
type Link struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	Slug           string         `gorm:"uniqueIndex;size:30" json:"slug"`
	OriginalURL    string         `gorm:"size:2048;not null" json:"original_url"`
	CreatedByAdmin bool           `gorm:"default:false" json:"created_by_admin"`
	CreatedAt      time.Time      `json:"created_at"`
	ExpiresAt      *time.Time     `json:"expires_at,omitempty"`
	Clicks         []Click        `gorm:"foreignKey:LinkID" json:"clicks,omitempty"`
	ClickCount     int64          `gorm:"-" json:"click_count"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// IsExpired checks if the link has expired
func (l *Link) IsExpired() bool {
	if l.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*l.ExpiresAt)
}

// CreateLinkRequest represents the request body for creating a link
type CreateLinkRequest struct {
	URL        string `json:"url" validate:"required,url"`
	CustomSlug string `json:"custom_slug,omitempty"`
}

// CreateLinkResponse represents the response body after creating a link
type CreateLinkResponse struct {
	ID          uint       `json:"id"`
	ShortURL    string     `json:"short_url"`
	Slug        string     `json:"slug"`
	OriginalURL string     `json:"original_url"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	Permanent   bool       `json:"permanent"`
}
