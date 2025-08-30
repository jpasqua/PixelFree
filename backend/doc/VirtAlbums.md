# PixelFree Virtual Albums – Thoughts on Design

This document captures ideas about **Virtual Albums**, starting from the design of the frontend/backend HTTP API, through the internal backend repository interfaces, and other suggested structure.


## 1. Public HTTP API (Frontend ⇄ Backend)

All endpoints are under `/api/albums` and require an authenticated session (OAuth).  
Responses use `application/json`. Errors use the standardized shape:

```json
{ "error": { "code": "BadRequest", "message": "…" } }
```

### 1.1 Create album
**POST** `/api/albums`

Create a new virtual album from a query definition.

**Request**

```json
{
  "name": "Retro Macs",
  "query": {
    "type": "tag" | "user" | "compound",
    "tags": ["retrocomputing","classicmac"],
    "users": { "accts": ["@bits@mastodon.social"] },
    "tagMode": "any" | "all",
    "limit": 40
  },
  "refresh": { "intervalMs": 600000 }
}
```

**Response (201)**

```json
{
  "id": "alb_01HQ0…",
  "name": "Retro Macs",
  "query": { "type":"tag","tags":["retrocomputing","classicmac"],"tagMode":"all","limit":40 },
  "refresh": { "intervalMs": 600000, "last_checked_at": null, "backoff_until": null,
               "since_id": null, "max_id": null },
  "stats": { "total": 0 },
  "enabled": true,
  "created_at": "2025-08-29T02:15:20Z",
  "updated_at": "2025-08-29T02:15:20Z"
}
```


### 1.2 Get album by id
**GET** `/api/albums/:id`

**Response (200)**

```json
{
  "id": "alb_01HQ0…",
  "name": "Retro Macs",
  "query": { "type":"tag","tags":["retrocomputing","classicmac"],"tagMode":"all","limit":40 },
  "refresh": { "intervalMs": 600000, "last_checked_at": "2025-08-29T02:30:02Z", "since_id": "8569…" },
  "stats": { "total": 128, "last_added": "2025-08-29T02:28:30Z" },
  "enabled": true,
  "created_at": "2025-08-29T02:15:20Z",
  "updated_at": "2025-08-29T02:30:02Z"
}
```


### 1.3 List albums
**GET** `/api/albums?offset=0&limit=20&enabled=true`

**Response (200)**

```json
{
  "items": [ { "id":"alb_…", "name":"Retro Macs", "query":{…}, "stats":{ "total":128 } } ],
  "total": 3,
  "offset": 0,
  "limit": 20
}
```

### 1.4 Update album
**PATCH** `/api/albums/:id`

Supports updates to name, query, or refresh policy.


### 1.5 Enable/disable album
**POST** `/api/albums/:id/toggle`


### 1.6 Delete album
**DELETE** `/api/albums/:id`


### 1.7 Manual refresh
**POST** `/api/albums/:id/refresh`


### 1.8 Get photos in an album
**GET** `/api/albums/:id/photos?offset=0&limit=20`


## 2. Internal Backend Interfaces

These are abstractions for repositories and services used internally.

### 2.1 Album Repository
- `create(album)`
- `get(id)`
- `list({ offset, limit, enabled })`
- `update(id, patch)`
- `toggle(id, enabled)`
- `remove(id)`
- `appendItems(albumId, statusIds)`
- `listItems(albumId, { offset, limit })`

### 2.2 Photo Repository
- `upsertMany(photos)`
- `getMany(ids)`
- `listForAlbum(albumId, { offset, limit })`
- `removeUnreferenced()`

### 2.3 Media Cache
- `ensureCached(photo)`
- `touch(statusId)`
- `evict(by)`

### 2.4 Accounts Service
- `resolveAccountId(acct)`
- `resolveManyAccts(accts)`

### 2.5 Fetcher / Scheduler
- `refreshAlbum(album)`
- `scheduleTick()`



## 3. Status & Errors

Common HTTP status codes and standardized error shapes.

Common status codes

	•	200 OK normal read/refresh.
	•	201 Created on album creation.
	•	204 No Content on delete.
	•	400 Bad Request invalid query (e.g., unknown tagMode, empty query).
	•	401 Unauthorized not logged in.
	•	404 Not Found album ID doesn’t exist.
	•	409 Conflict conflicting name (if you enforce uniqueness).
	•	429 Too Many Requests rate-limited upstream; include retryAfter.
	•	5xx for unexpected server errors (mapped via your errorMapper).

Error body

```json
{ "error":
  {
    "code": "ValidationError",
    "message": "tags must be non-empty",
    "details": {...}
  }
}
```

## 4. SQLite Schema & Repositories

### Schema highlights
- `albums` – stores album metadata, query, and refresh state.
- `photos` – normalized metadata for fetched posts.
- `album_items` – join table linking albums to photos.
- `media_manifest` – manages local cache of media files.
- `kv` – key-value store for app metadata.

### Suggested implementation organization
- `db.js` – SQLite bootstrap and schema init.
- `albumRepo.js` – CRUD for albums and album_items.
- `photoRepo.js` – CRUD and upserts for photos.

---

## 5. Frontend Flow

- **Create album** → `POST /api/albums`
- **Refresh** → `POST /api/albums/:id/refresh`
- **Display** → `GET /api/albums/:id/photos`
- **Update settings** → `PATCH /api/albums/:id`
- **Delete** → `DELETE /api/albums/:id`

