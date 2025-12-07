# KinterCut

A modern, fast link shortening service with admin panel and analytics.

## Features

- Fast link shortening with instant redirects
- Custom slugs - choose your own memorable URLs
- User link history saved locally
- Admin panel with My Links and User Links sections
- Click tracking with IP, User Agent, and geolocation
- Public links expire after 48 hours
- Admin-created links are permanent
- Reserved slugs protection (/adminek, /kinter, /my, /meine)
- Modern dark-themed UI with React and Tailwind CSS
- Docker-ready for easy deployment

## Tech Stack

- **Backend:** Go (Fiber framework)
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** PostgreSQL
- **Containerization:** Docker + Docker Compose

## Quick Start with Docker

### 1. Clone the repository

```bash
git clone https://github.com/KM-Kinter/KinterCut
cd link-shortener
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and change passwords!
```

### 3. Start all services

```bash
docker-compose up -d --build
```

### 4. Open in browser

- **Homepage:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/adminek

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `linkuser` |
| `POSTGRES_PASSWORD` | Database password | `linkpass` |
| `POSTGRES_DB` | Database name | `linkdb` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `JWT_SECRET` | Secret for signing JWT tokens | - |
| `PUBLIC_LINK_TTL` | Time-to-live for public links | `48h` |
| `BASE_URL` | Base URL for generated links | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `FRONTEND_PORT` | Port to expose frontend | `3000` |

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/shorten` | Create a short link (supports custom_slug) |
| `GET` | `/:slug` | Redirect to original URL |

### Admin (requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/my` | List admin's own links |
| `GET` | `/api/admin/users` | List user-created links |
| `GET` | `/api/admin/links/:id` | Get link details |
| `POST` | `/api/admin/links` | Create permanent link |
| `DELETE` | `/api/admin/links/:id` | Delete any link |

## Reserved Slugs

The following slugs are reserved and cannot be used by regular users:
- `/adminek` - Admin panel
- `/kinter` - Reserved
- `/my` - Reserved
- `/meine` - Reserved

## Production Deployment

Before deploying to production:

1. Change all default passwords in `.env`
2. Set a strong `JWT_SECRET` (minimum 32 characters)
3. Configure HTTPS via reverse proxy (e.g., Traefik, Nginx, Caddy)
4. Set `BASE_URL` to your production domain
5. Set `FRONTEND_URL` to your production domain

## Project Structure

```
link-shortener/
├── backend/                 # Go API
│   ├── config/             # Configuration
│   ├── database/           # Database connection
│   ├── handlers/           # HTTP handlers
│   ├── middleware/         # Auth middleware
│   ├── models/             # Data models
│   ├── services/           # Business logic
│   ├── main.go
│   └── Dockerfile
├── frontend/               # React SPA
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── context/       # React Context
│   │   ├── pages/         # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── LICENSE
└── README.md
```

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ by [Kinter](https://kinter.one)
