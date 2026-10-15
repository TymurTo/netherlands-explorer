# Netherlands Explorer

An interactive travel atlas for exploring the Netherlands.

Discover 12 provinces, 40 cities and 40 attractions through a fullscreen map, searchable directories and sliding panels.


[Netherlands Explorer](docs/screenshot.png)

## Features

- Interactive map with province zoom and city selection.
- Search by English and local place names.
- Descriptions and history of provinces and cities.
- Attraction details with links to official websites.
- User registration and sign-in.
- Personal favorites.
- Public comments with the option to delete your own.
- Responsive layout with sliding panels.

The map is schematic, and city positions are approximate. Attraction images currently use labeled placeholder illustrations.

## Technology

| Part     | Technologies                        |
| -------- | ----------------------------------- |
| Frontend | React, JavaScript, CSS, Vite        |
| Backend  | Python, FastAPI, Uvicorn            |
| Database | SQLite                              |
| Tooling  | pytest, httpx, Black, Prettier      |

## Quick Start

### Requirements

- Python 3.11 or newer
- Node.js 22.12 or newer (only needed if you want to rebuild or edit the frontend)

### Run the application

The repository includes a prebuilt frontend in `frontend/dist`, so you only need Python to start the app.

```bash
# 1. Clone the repository
git clone https://github.com/TymurTo/netherlands-explorer.git
cd netherlands-explorer

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\Activate.ps1       # Windows (PowerShell)

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Start the server
python main.py
```

Open **http://127.0.0.1:8000** in your browser. Press `Ctrl+C` to stop the server.

The SQLite database (`backend/atlas.sqlite3`) is created automatically on the first start.

### Explore the map

1. Select a province to zoom in.
2. Select a city to view its description and history.
3. Open Attractions to browse places.
4. Use Search or the ••• menu to find another location.

### Favorites and comments

Create an account to save attractions and post comments.

Sign in using your username and password, not an email address. Visitors can read comments without signing in.

## Development

### Frontend with hot reload

Run the backend and the Vite dev server in two terminals:

```bash
# Terminal 1: API on http://127.0.0.1:8000
python main.py

# Terminal 2: frontend on http://localhost:5173
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend.

To rebuild the production bundle served by FastAPI:

```bash
cd frontend
npm run build
```

### Tests

```bash
pip install -r requirements-dev.txt
pytest
```

The tests cover the full user flow (registration, sessions, favorites, comments), data isolation between users, input validation, CSRF protection, the login rate limit and the consistency of the catalog data. Each test uses a temporary database, so your local data is never touched.

### Code style

```bash
black .                      # Python
cd frontend && npm run format   # JavaScript, JSX, CSS
```

### Configuration

All settings have working defaults for local development. Override them with environment variables:

| Variable          | Default                                        | Purpose                                            |
| ----------------- | ---------------------------------------------- | -------------------------------------------------- |
| `DATABASE_PATH`   | `backend/atlas.sqlite3`                        | Location of the SQLite database file               |
| `COOKIE_SECURE`   | `0`                                            | Set to `1` to mark the session cookie as HTTPS-only |
| `ALLOWED_ORIGINS` | `localhost` and `127.0.0.1` on ports 5173, 8000 | Comma-separated list of origins allowed to send writes |

## Project structure

```
.
├── main.py                  # entry point: starts Uvicorn
├── backend/
│   ├── main.py              # FastAPI app and middleware setup
│   ├── routes/              # auth, catalog, comments, favorites
│   ├── schemas.py           # Pydantic request validation
│   ├── security.py          # password hashing, sessions, rate limiting
│   ├── middleware.py        # CSRF/origin checks and security headers
│   ├── database.py          # SQLite connection helper
│   ├── schema.sql           # database schema
│   └── catalog.json         # provinces, cities and attractions
├── frontend/
│   └── src/
│       ├── components/      # map, modal, forms, comments
│       ├── panels/          # sliding panels (search, places, story)
│       ├── hooks/useAtlas.js  # application state
│       └── utils/           # search helpers
├── scripts/trace_map.py     # converts a map image into SVG paths
└── tests/test_api.py        # API tests
```

## API overview

| Method | Endpoint                                | Auth | Description                          |
| ------ | --------------------------------------- | ---- | ------------------------------------ |
| GET    | `/api/health`                           | no   | Health check                         |
| GET    | `/api/catalog`                          | no   | Provinces, cities and attractions    |
| POST   | `/api/auth/register`                    | no   | Create an account and sign in        |
| POST   | `/api/auth/login`                       | no   | Sign in                              |
| POST   | `/api/auth/logout`                      | yes  | Sign out                             |
| GET    | `/api/auth/me`                          | yes  | Current user                         |
| GET    | `/api/favorites`                        | yes  | List favorite attraction ids         |
| PUT    | `/api/favorites/{attraction_id}`        | yes  | Add a favorite                       |
| DELETE | `/api/favorites/{attraction_id}`        | yes  | Remove a favorite                    |
| GET    | `/api/attractions/{id}/comments`        | no   | Comments, newest first, paginated    |
| POST   | `/api/attractions/{id}/comments`        | yes  | Add a comment                        |
| DELETE | `/api/comments/{comment_id}`            | yes  | Delete your own comment              |

Write requests (`POST`, `PUT`, `DELETE`) must include the `X-Atlas-Request: 1` header. The frontend sends it automatically.

Interactive API documentation is available at **http://127.0.0.1:8000/docs** while the server is running.

## Security notes

- Passwords are hashed with scrypt and a per-user random salt.
- Session tokens are random, stored in the database only as SHA-256 hashes, and sent in an `HttpOnly`, `SameSite=Lax` cookie.
- Write requests require a custom header and a trusted `Origin` as CSRF protection.
- Login and registration are rate-limited per IP address (20 attempts per 10 minutes).
- Login takes the same amount of work whether or not the username exists, which limits user enumeration through response timing.
- All SQL queries are parameterized, and user input is validated with Pydantic.

## Limitations and roadmap

- Attraction photos are placeholders.
- The rate limiter uses the direct client IP, so behind a reverse proxy it needs proxy-aware configuration.
- Comment pagination uses offsets, which can shift if new comments arrive while browsing.
- No frontend tests or CI pipeline yet.
- Planned: real attraction photos, URL routing for provinces and cities, deployment demo.
