# Api-layer-

An early Express API layer for Gulf Coast Radar: entity lookups, bookings, song requests and app-store tool endpoints over Supabase.

Built in July 2026 and replaced by [`gcr-api-clean`](https://github.com/CultureReset/gcr-api-clean), which is the API that runs today. Nothing calls this one.

## How it works

`server.js` is an Express app with CORS and JSON parsing. `config/db.js` creates a Supabase client from environment variables, and every route goes through `utils/lookupEntity.js` to find the business (entity) a request is about.

| Route file | Purpose |
|---|---|
| `routes/health.js` | `GET /api/health` |
| `routes/entities.js` | Look up a business and its sections |
| `routes/bookings.js` | Booking requests |
| `routes/song-requests.js` | Song requests for venues with live music |
| `routes/tools.js` | Tool endpoints for the app store |

## Run it

```bash
cp .env.example .env    # Supabase URL and key
npm install
npm run dev
```
