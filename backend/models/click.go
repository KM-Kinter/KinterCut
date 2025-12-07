package models

import (
	"time"
)

// Click represents a link click event with analytics data
type Click struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	LinkID    uint      `gorm:"index;not null" json:"link_id"`
	ClickedAt time.Time `gorm:"autoCreateTime" json:"clicked_at"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"size:512" json:"user_agent"`
	Country   string    `gorm:"size:100" json:"country"`
	City      string    `gorm:"size:100" json:"city"`
	Region    string    `gorm:"size:100" json:"region"`
}

// ClickStats represents aggregated click statistics
type ClickStats struct {
	TotalClicks  int64         `json:"total_clicks"`
	UniqueIPs    int64         `json:"unique_ips"`
	TopCountries []CountryStat `json:"top_countries"`
	RecentClicks []Click       `json:"recent_clicks"`
}

// CountryStat represents click count per country
type CountryStat struct {
	Country string `json:"country"`
	Count   int64  `json:"count"`
}
