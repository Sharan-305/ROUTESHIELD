# RouteShield — Safer Route Planner

[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Theme](https://img.shields.io/badge/Theme-Dark%20Navy%20%26%20Mint-00f5a0.svg)](#ui-and-design)
[![Safety](https://img.shields.io/badge/Safety%20Data-Verified%20Only-emerald.svg)](#safety-scoring-methodology)

RouteShield is a modern, responsive web application and REST API engineered to compare alternative routes between locations using distance, estimated travel time, verified road infrastructure, street lighting coverage, and audited public safety reports.

Built with a command-center dark navigation aesthetic, RouteShield prioritizes objective data integrity: **it never fabricates safety scores or claims that any route is guaranteed safe.**

---

## Key Features

1. **Journey Planner & Alternative Routes:**
   - Address search with debounced autocomplete (Nominatim geocoder abstraction).
   - "Use Current Location" GPS detection with graceful permission handling.
   - Live route calculation (OSRM routing provider abstraction) supporting Walking, Cycling, and Driving modes.
   - Visual comparison: Selected route highlighted in **mint green**; alternatives in **subdued contrasting color**.
   - Direct click-to-select interaction on both route cards and map polylines.

2. **Explainable Safety Scoring:**
   - 4-Factor Weighted Model: Streetlight Density (35%), Pedestrian Infrastructure (25%), Verified Hazards Deductions (25%), Data Freshness (15%).
   - Transparent Data Cutoff: When surveyed data along a route is insufficient (<30%), RouteShield explicitly marks *"Insufficient safety data / Safety data unavailable"* rather than fabricating an unsupported score.
   - Mandatory disclaimers asserting scores are informative estimates, not safety guarantees.

3. **Community Incident Reporting:**
   - Authenticated submissions for road damage, poor lighting, blocked pedestrian paths, and traffic hazards.
   - Map pin picker and optional photo evidence upload with EXIF privacy stripping.
   - Submissions default to `pending` status and only appear on public maps after moderator approval.

4. **Administrator Moderation Dashboard:**
   - Role-based authorization (`admin` vs `user`).
   - Moderation queue: review details, approve, or reject submissions with audit notes.
   - Immutable audit logging (`AuditLog` collection) tracking all moderator actions.
   - Platform statistics: registered users, pending review queue, verified hazards.

5. **Security & Production Readiness:**
   - Bcrypt password hashing (10 salt rounds).
   - JWT authentication via Authorization header and HTTP-only cookies.
   - Tiered rate limiting (general API vs strict authentication protection).
   - Helmet security headers and strict CORS origin enforcement.
   - Docker containerization and Docker Compose orchestration.

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Modern Dark Theme), Vanilla JavaScript (ES6+), Leaflet.js, CartoDB Dark Matter tiles.
- **Backend:** Node.js, Express.js REST API.
- **Database:** MongoDB / MongoDB Atlas with geospatial `2dsphere` indexing.
- **Routing & Geocoding Providers:** OSRM (Open Source Routing Machine), Nominatim (OpenStreetMap).
- **Deployment:** Docker, Docker Compose, Nginx reverse proxy with HTTPS.

---

## Project Structure

```
RouteShield/
├── frontend/
│   ├── index.html            # Main SPA dashboard
│   ├── styles.css            # Dark theme CSS design system
│   ├── app.js                # Core UI & map controller
│   ├── services/
│   │   ├── geocodingService.js # Geocoding provider abstraction
│   │   └── routingService.js   # OSRM routing provider abstraction
│   └── assets/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment & database connection
│   │   ├── controllers/      # Route, Auth, Incident, Admin, Geocoding controllers
│   │   ├── middleware/       # Auth, Rate limiting, Validation, Error handling
│   │   ├── models/           # User, Incident, SafetyData, AuditLog (Mongoose)
│   │   ├── routes/           # Express API route modules
│   │   ├── services/         # Scoring engine, proxy services, audit logger
│   │   ├── utils/            # Geospatial math, logger, response helpers
│   │   ├── app.js            # Express app assembly & security middleware
│   │   └── server.js         # HTTP server entry point
│   └── tests/
│       └── run-tests.js      # Automated unit & integration test suite
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── SAFETY_SCORING_METHODOLOGY.md
│   └── DEPLOYMENT_GUIDE.md
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended, tested on v22)
- [MongoDB](https://www.mongodb.com/) (local community server or free MongoDB Atlas cluster)

### 2. Setup
```bash
# Navigate to project directory
cd F:\Projects\Pro8-CC

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 15 test suites validating geospatial algorithms, geocoding validation, routing abstractions, explainable scoring, password hashing, and role permissions.*

### 4. Start the Application
```bash
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## Docker Deployment

To launch RouteShield and a dedicated MongoDB instance in Docker containers:
```bash
docker compose up -d --build
```
Access the application at [http://localhost:5000](http://localhost:5000).

---

## Safety Disclaimer

RouteShield is an assistive travel planning tool. Evaluated safety indicators are estimates derived from available open public datasets and verified community reports. **No route can be guaranteed 100% safe.** Users must remain alert and exercise situational vigilance at all times.
