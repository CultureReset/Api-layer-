# Api-layer-

An Express + Supabase API for entity listing, bookings, song requests and
per-entity tool installs. Read-oriented public routes plus booking/tool
writes, keyed by an entity `slug`.

## Which database — read this before touching it

**This talks to the `launch gcr` Supabase project, not `cyber check`.** Its
own `.env.example` says so directly:

```
# This API talks to the "launch gcr" Supabase project ONLY.
# Do not point this at the cyber check project.
GCR_SUPABASE_URL=https://xbptmkpbiqzvxptjkfoi.supabase.co
```

and `routes/health.js` reports `database: 'launch gcr'` in its own health
check response.

`gcr-api-clean`'s own CLAUDE.md names `launch gcr` (ref `xbptmkpbiqzvxptjkfoi`)
as one of two decoy Supabase projects on the account — old copies of `entity`
with a couple thousand rows, explicitly "not the database." Whether that
means this repo is a retired prototype that predates the move to `cyber
check`, or an intentionally separate tool that was never meant to share a
database with the main platform, is not something the code answers — it's
worth settling before this repo is built on further.

## Routes

```
GET  /api/health                        { status, database: 'launch gcr', connected }
GET  /api/entities                      paginated list — page, limit, includeInactive,
                                         type, subtype, city, search
GET  /api/entities/:slug                one entity, with section content attached
POST /api/entities/:slug/bookings       public: a customer submits a booking request
POST /api/entities/:slug/song-requests  keyed to an artist; finds-or-creates a default
                                         artist row for entities that ARE the artist
GET  /api/entities/:slug/tools          all installed tools, enabled or not — for a
                                         future "app store" dashboard view (comment
                                         in source)
```

## Layout

```
server.js               express app, CORS from CORS_ORIGIN, mounts health + entities
config/db.js             supabase client — requires GCR_SUPABASE_URL + GCR_SUPABASE_SERVICE_KEY,
                          exits if either is missing
routes/entities.js       list/detail, mounts bookings/song-requests/tools per :slug
routes/bookings.js
routes/song-requests.js
routes/tools.js
routes/health.js
utils/lookupEntity.js
utils/sections.js
utils/asyncHandler.js
middleware/errorHandler.js
```

Service-role key, not anon — every table in `launch gcr` has RLS enabled with
no policies yet, per the comment in `.env.example`.

## Run

```bash
npm start   # node server.js
npm run dev # node --watch server.js
```
