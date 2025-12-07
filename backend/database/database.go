package database

import (
	"fmt"
	"log"
	"time"

	"link-shortener/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global database connection
var DB *gorm.DB

// Connect establishes connection to the PostgreSQL database
func Connect(databaseURL string) error {
	var err error

	// Retry connection with backoff
	for i := 0; i < 5; i++ {
		DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		log.Printf("Failed to connect to database, attempt %d/5: %v", i+1, err)
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database after 5 attempts: %w", err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Connected to database successfully")
	return nil
}

// Migrate runs database migrations
func Migrate() error {
	log.Println("Running database migrations...")
	err := DB.AutoMigrate(&models.Link{}, &models.Click{}, &models.LoginAttempt{})
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	log.Println("Database migrations completed")
	return nil
}

// Close closes the database connection
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
