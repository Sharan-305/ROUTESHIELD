# RouteShield — REST API Documentation

Base URL: `/api/v1`

All responses follow the JSend-compliant envelope structure:
```json
{
  "status": "success | error",
  "statusCode": 200,
  "message": "Human readable status description",
  "data": { ... }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user account. The first registered user automatically receives the `admin` role.
- **Rate Limit:** 15 requests / 15 minutes
- **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (201 Created):**
  Sets `token` HTTP-only cookie and returns user object and JWT.

### `POST /api/v1/auth/login`
Authenticates user credentials.
- **Rate Limit:** 15 requests / 15 minutes
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```

### `GET /api/v1/auth/me`
Retrieves the active user session profile.
- **Headers:** `Authorization: Bearer <jwt_token>` (or via cookie)

### `POST /api/v1/auth/logout`
Clears session token cookie.

---

## 2. Geocoding Endpoints (`/api/v1/geocoding`)

### `GET /api/v1/geocoding/search`
Queries location addresses using Nominatim OpenStreetMap abstraction.
- **Query Params:**
  - `q` (string, required): Search query (e.g. `Trafalgar Square, London`)
  - `limit` (number, optional, default: 5): Maximum results
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "locations": [
        {
          "id": 123456,
          "name": "Trafalgar Square",
          "displayName": "Trafalgar Square, Westminster, London, WC2N 5DN, UK",
          "lat": 51.5080,
          "lng": -0.1281,
          "type": "pedestrian"
        }
      ]
    }
  }
  ```

### `GET /api/v1/geocoding/reverse`
Converts GPS coordinates into a human-readable location.
- **Query Params:**
  - `lat` (float, required)
  - `lng` (float, required)

---

## 3. Routing & Evaluation Endpoints (`/api/v1/routes`)

### `GET /api/v1/routes/calculate`
Calculates navigable route alternatives via OSRM and computes explainable safety indicators for each route corridor.
- **Query Params:**
  - `startLat` (float, required)
  - `startLng` (float, required)
  - `destLat` (float, required)
  - `destLng` (float, required)
  - `mode` (string, optional: `foot` | `bike` | `driving`, default `foot`)
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "routes": [
        {
          "id": "route_0_1729780000",
          "index": 0,
          "title": "Recommended Route (Via The Mall)",
          "distanceMeters": 1420,
          "distanceDisplay": "1.4 km",
          "durationMinutes": 18,
          "durationDisplay": "18 min",
          "geometry": { "type": "LineString", "coordinates": [...] },
          "safety": {
            "score": null,
            "status": "INSUFFICIENT_DATA",
            "statusDisplay": "Safety data unavailable",
            "message": "Available open safety datasets and municipal surveys are insufficient for this specific route. RouteShield does not fabricate scores.",
            "disclaimer": "Safety evaluations are estimates based on available verified datasets and do not guarantee personal safety."
          }
        }
      ]
    }
  }
  ```

---

## 4. Community Incident Reporting (`/api/v1/incidents`)

### `POST /api/v1/incidents`
Submits a public road infrastructure hazard. Reports are marked `pending` until approved by a moderator.
- **Auth:** Required (`Bearer <token>`)
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `category` (enum: `poor_lighting`, `road_damage`, `blocked_path`, `traffic_hazard`, `other_infrastructure`)
  - `description` (string, 10-1000 chars)
  - `latitude` (float, -90 to 90)
  - `longitude` (float, -180 to 180)
  - `address` (string, optional)
  - `photo` (file, optional, JPEG/PNG/WebP max 5MB)

### `GET /api/v1/incidents/public`
Public endpoint returning verified hazards for map overlay. Personal reporter information is strictly omitted for privacy.
- **Query Params:**
  - `minLng`, `minLat`, `maxLng`, `maxLat` (bounding box filter)

### `GET /api/v1/incidents/my`
Returns status history for reports submitted by the authenticated user.

---

## 5. Administrator & Moderation Endpoints (`/api/v1/admin`)

- **Auth:** Requires `Bearer <token>` with `role: "admin"`

### `GET /api/v1/admin/incidents?status=pending`
Paginated queue of incident submissions awaiting review.

### `PUT /api/v1/admin/incidents/:id/review`
Approve or reject a report. Automatically logs an audit entry.
- **Body:**
  ```json
  {
    "status": "verified | rejected",
    "reviewNotes": "Confirmed broken sidewalk fixture with municipal repair order #4021."
  }
  ```

### `GET /api/v1/admin/stats`
Returns system totals (users, pending, verified, rejected reports).

### `GET /api/v1/admin/audit-logs`
Paginated audit log of moderator decisions.
