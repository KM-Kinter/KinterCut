package models

import (
	"time"
)

// LoginAttempt records login attempts for security auditing
type LoginAttempt struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Username  string    `gorm:"size:100" json:"username"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"size:512" json:"user_agent"`
	Success   bool      `json:"success"`
	CreatedAt time.Time `json:"created_at"`
}
