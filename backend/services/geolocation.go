package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// GeoLocation represents geographic location data
type GeoLocation struct {
	Country string `json:"country"`
	City    string `json:"city"`
	Region  string `json:"regionName"`
}

// ipAPIResponse represents the response from ip-api.com
type ipAPIResponse struct {
	Status     string `json:"status"`
	Country    string `json:"country"`
	RegionName string `json:"regionName"`
	City       string `json:"city"`
}

// GeoService handles IP geolocation lookups with caching
type GeoService struct {
	cache      map[string]*GeoLocation
	cacheMutex sync.RWMutex
	cacheTTL   time.Duration
	cacheTime  map[string]time.Time
}

// NewGeoService creates a new GeoService instance
func NewGeoService() *GeoService {
	return &GeoService{
		cache:     make(map[string]*GeoLocation),
		cacheTTL:  24 * time.Hour,
		cacheTime: make(map[string]time.Time),
	}
}

// GetLocation returns geographic location for an IP address
func (g *GeoService) GetLocation(ip string) (*GeoLocation, error) {
	// Skip private/local IPs
	if ip == "" || ip == "127.0.0.1" || ip == "::1" || ip == "localhost" {
		return &GeoLocation{
			Country: "Local",
			City:    "Local",
			Region:  "Local",
		}, nil
	}

	// Check cache
	g.cacheMutex.RLock()
	if cached, ok := g.cache[ip]; ok {
		if time.Since(g.cacheTime[ip]) < g.cacheTTL {
			g.cacheMutex.RUnlock()
			return cached, nil
		}
	}
	g.cacheMutex.RUnlock()

	// Query ip-api.com (free tier: 45 requests per minute)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://ip-api.com/json/%s?fields=status,country,regionName,city", ip))
	if err != nil {
		return g.fallbackLocation(), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return g.fallbackLocation(), nil
	}

	var apiResp ipAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return g.fallbackLocation(), nil
	}

	if apiResp.Status != "success" {
		return g.fallbackLocation(), nil
	}

	location := &GeoLocation{
		Country: apiResp.Country,
		City:    apiResp.City,
		Region:  apiResp.RegionName,
	}

	// Update cache
	g.cacheMutex.Lock()
	g.cache[ip] = location
	g.cacheTime[ip] = time.Now()
	g.cacheMutex.Unlock()

	return location, nil
}

// fallbackLocation returns a default location when lookup fails
func (g *GeoService) fallbackLocation() *GeoLocation {
	return &GeoLocation{
		Country: "Unknown",
		City:    "Unknown",
		Region:  "Unknown",
	}
}
