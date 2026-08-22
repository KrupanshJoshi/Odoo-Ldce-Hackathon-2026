# GlobeTrotter Frontend

React/Vite frontend integrated with the GlobeTrotter Express + Prisma API.

## Run with the full stack

From the project root, run `start-dev.bat` after setup.

Or manually:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so no CORS/API URL changes are needed for local testing.

## Demo accounts

- `demo@globetrotter.dev` / `password123`
- `admin@globetrotter.dev` / `password123`

The Create Trip screen uses `coverPhotoUrl` because the backend does not expose a binary image-upload endpoint.
