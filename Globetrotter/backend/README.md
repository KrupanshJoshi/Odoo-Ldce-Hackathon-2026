# GlobeTrotter — Backend

Express + Prisma + PostgreSQL backend for the GlobeTrotter travel planning app.
Covers every screen in the problem statement except the pure frontend rendering.

## 1. Setup

```bash
cd globetrotter-backend
npm install
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
```

Get a free Postgres instance in under a minute from **Neon** (neon.tech) or
**Supabase** — copy the connection string into `DATABASE_URL`.

```bash
npx prisma migrate dev --name init   # creates tables
npm run seed                         # demo users + 10 cities + 50 activities
npm run dev                          # starts on http://localhost:4000
```

Demo logins after seeding:
- `demo@globetrotter.dev` / `password123` (regular user)
- `admin@globetrotter.dev` / `password123` (admin — for the analytics dashboard)

## 2. Architecture

```
prisma/schema.prisma   -> single source of truth for the DB (9 tables)
src/config/prisma.js   -> Prisma client singleton
src/middleware/auth.js -> JWT verification, requireAuth / requireAdmin
src/controllers/*      -> one file per resource, thin & explicit
src/routes/*           -> REST routes, mounted under /api
src/app.js              -> express app (helmet, cors, morgan, json)
src/server.js            -> entry point
```

### Data model (maps 1:1 to the screens)

| Table | Screen(s) |
|---|---|
| `users` | Login/Signup, Profile/Settings |
| `trips` | Create Trip, My Trips, Dashboard |
| `cities` | City Search (catalog) |
| `trip_stops` | Itinerary Builder — a city leg of a trip |
| `activities` | Activity Search (catalog, per city) |
| `trip_activities` | Activities scheduled into a stop's day plan |
| `expenses` | Non-activity spend (transport/stay/meal) for Budget screen |
| `saved_cities` | "saved destinations" on Profile |
| — (computed) | Admin dashboard is all aggregate queries, no extra tables |

`trips.isPublic` + `trips.shareSlug` implement the Shared/Public Itinerary
screen without a separate sharing table — simpler and avoids sync bugs.

## 3. API reference

All routes are prefixed with `/api`. Authenticated routes expect
`Authorization: Bearer <token>`.

### Auth
```
POST   /auth/signup            { name, email, password }
POST   /auth/login             { email, password }
POST   /auth/forgot-password   { email }
POST   /auth/reset-password    { token, newPassword }
GET    /auth/me                (auth)
```

### Trips
```
GET    /trips/dashboard         (auth) - Screen 2
GET    /trips                   (auth) - Screen 4, My Trips
POST   /trips                   (auth) - Screen 3, Create Trip
GET    /trips/:id               (auth) - full nested trip (stops+activities)
PUT    /trips/:id               (auth)
DELETE /trips/:id               (auth)
POST   /trips/:id/share         (auth) -> { shareUrl }
POST   /trips/:id/unshare       (auth)
```

### Itinerary builder (stops)
```
POST   /trips/:tripId/stops             (auth) - add a city to the trip
PUT    /trips/:tripId/stops/reorder     (auth) - body: { order: [stopId,...] }
PUT    /trips/stops/:stopId             (auth) - edit dates
DELETE /trips/stops/:stopId             (auth)
```

### Activities (per stop / catalog)
```
GET    /cities/:cityId/activities                 - Screen 8 search/filter
POST   /trips/stops/:stopId/activities     (auth) - assign activity to a day
PUT    /trips/trip-activities/:id          (auth)
DELETE /trips/trip-activities/:id          (auth)
```

### Cities
```
GET    /cities?search=&country=&region=&sort=      - Screen 7
GET    /cities/:id
POST   /cities/:id/save          (auth) - add to saved destinations
DELETE /cities/:id/save          (auth)
POST   /cities                   (admin)
POST   /cities/:cityId/activities (admin)
```

### Budget & calendar
```
GET    /trips/:tripId/budget      (auth) - Screen 9, cost breakdown + overbudget days
POST   /trips/:tripId/expenses    (auth) - add transport/stay/meal spend
DELETE /trips/expenses/:id        (auth)
GET    /trips/:tripId/calendar    (auth) - Screen 10, day-wise timeline
```

### Sharing (public)
```
GET    /public/trips/:slug              - Screen 11, read-only public view
POST   /public/trips/:slug/copy  (auth) - "Copy Trip" button
```

### Profile
```
PUT    /users/me                 (auth) - Screen 12
DELETE /users/me                 (auth)
GET    /users/me/saved-cities    (auth)
```

### Admin
```
GET    /admin/stats   (admin) - Screen 13, totals + top cities + charts data
GET    /admin/users   (admin)
GET    /admin/trips   (admin)
```

## 4. Design notes / trade-offs (worth mentioning to judges)

- **Budget is computed, not stored.** Activity cost lives on `trip_activities`;
  everything else (transport/stay/meals) lives in `expenses`. The budget
  endpoint unions both so there's one source of truth per cost type — no
  double-entry to keep in sync.
- **Sharing is two columns, not a table.** `isPublic` + `shareSlug` on `trips`
  is enough for a public read-only link and avoids a join on every itinerary
  view.
- **"Copy Trip" deep-clones** stops and trip_activities via a nested Prisma
  `create`, so a copied trip is fully independent of the original.
- **Ownership checks are explicit in every controller** (`findOwnedTrip` /
  `findOwnedStop`) rather than relying on a generic middleware, so it's easy
  to see exactly what's protected during a live demo/code walkthrough.
