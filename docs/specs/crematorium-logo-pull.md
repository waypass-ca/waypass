# Feature Spec: Crematorium Logo Auto-Pull

## Overview

When a funeral home adds or connects to a crematorium that has a website URL, Passage automatically fetches and stores a logo for that crematorium. Logos are sourced from the crematorium's public web presence and stored permanently in Cloudinary so all users see them without repeated external fetches.

---

## Problem

The crematorium partners list currently shows only name, location, and status — no visual identity. Funeral homes often work with many crematoriums and benefit from quick visual recognition. Logos also signal that a crematorium record is complete and verified.

---

## Goals

- Show a logo for any crematorium that has a website URL
- Fetch the logo automatically — no manual upload required
- Store logos in Cloudinary so they load fast and we own the asset
- Never make an external logo request unless a user actually adds or connects to the crematorium

---

## Non-Goals

- Manual logo upload by the user (out of scope for this feature)
- Bulk back-filling logos for all existing crematoriums
- Logos for crematoriums that have no website URL

---

## User Stories

**As a funeral home admin adding a new crematorium manually,**  
I want the system to pull the crematorium's logo from their website automatically,  
so I don't have to find and upload it myself.

**As a funeral home admin connecting to an existing crematorium,**  
I want to see a logo on that crematorium's card,  
so I can visually identify partners at a glance.

**As a second funeral home connecting to the same crematorium,**  
I want the logo to already be there without any delay,  
because it was fetched the first time someone connected.

---

## Design

### Logo Source Strategy

1. **Clearbit Logo API** — `https://logo.clearbit.com/{domain}` — returns a clean brand logo (PNG). Free, no API key. Best quality.
2. **Google Favicon** — `https://www.google.com/s2/favicons?domain={domain}&sz=128` — always available as a fallback.

After fetching, the image is uploaded to Cloudinary under the folder `crematorium-logos/` with the domain as the public ID (e.g. `crematorium-logos/westlakecremation.com`). The resulting Cloudinary URL is stored in `logo_url`.

### When Logos Are Fetched

| Trigger | Condition | Behaviour |
|---|---|---|
| `POST /api/crematoriums` (manual add) | `website` is provided | Fetch logo before inserting row. Block until complete (logo is in the response). |
| `POST /api/crematoriums/:id/connect` | Row has `website` but no `logo_url` | Add funeral home to connections, respond immediately. Fetch logo in the background. |
| `PATCH /api/crematoriums/:id` | `website` changes to a new non-empty value | Re-fetch logo before responding. |
| Any other connect | Row already has `logo_url` | No external fetch — serve cached Cloudinary URL. |

---

## Data Model

### `crematoriums` table

```sql
alter table crematoriums add column if not exists logo_url text;
```

### `crematoriums_db` table

```sql
alter table crematoriums_db add column if not exists logo_url text;
```

---

## API Changes

### `POST /api/crematoriums`

**Request** — new optional field:
```json
{
  "website": "https://westlakecremation.com"
}
```

**Response** — new field in all crematorium responses:
```json
{
  "logoUrl": "https://res.cloudinary.com/dv7iv29qj/image/upload/crematorium-logos/westlakecremation.com.png"
}
```

### `POST /api/crematoriums/:id/connect`

No request change. Response includes `logoUrl` (may be `null` immediately if the background fetch hasn't completed yet — subsequent `GET /` calls will include it once stored).

### `PATCH /api/crematoriums/:id`

If `website` changes, `logoUrl` is updated synchronously in the response.

---

## Backend Implementation

### New files

**`backend/lib/cloudinary.js`**  
Configures and exports the Cloudinary v2 client using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

**`backend/lib/logoService.js`**  
- `fetchAndStoreLogo(websiteUrl)` — extracts domain, tries Clearbit (HEAD request with 3s timeout), falls back to Google Favicon, downloads the image, uploads to Cloudinary, returns `secure_url`. Returns `null` on any failure.

### Updated files

**`backend/routes/crematoriums.js`**  
- Import `fetchAndStoreLogo`
- `shapeRow` maps `row.logo_url` → `logoUrl`
- `POST /` calls `fetchAndStoreLogo` before insert
- `POST /:id/connect` selects `website, logo_url`; fires logo fetch after response if needed
- `PATCH /:id` compares old vs new website; re-fetches if changed

### Environment variables (backend)

```
CLOUDINARY_CLOUD_NAME=dv7iv29qj
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Frontend Changes

### `NewCrematoriumPage.jsx`

- Added **Website** input field in Step 1 (Details), below Distance
- `website` included in the payload sent to `createCrematorium`
- Website shown in Step 3 confirmation row

### `PartnersList.jsx`

- Partner rows now show a 28×28 rounded logo avatar to the left of the crematorium name
- Falls back to a building icon placeholder when `logoUrl` is null

---

## Acceptance Criteria

- [ ] Adding a crematorium with a website URL stores a Cloudinary logo URL in `logo_url`
- [ ] Adding a crematorium without a website stores `null` in `logo_url` (no error)
- [ ] Connecting to a crematorium that already has a `logo_url` does not trigger an external fetch
- [ ] Connecting to a crematorium with a website but no `logo_url` triggers a background fetch; subsequent API calls return the stored logo
- [ ] Changing a crematorium's website via PATCH updates `logo_url`
- [ ] Partners list displays logos where available, building icon where not
- [ ] Logo fetch failure (network error, domain not found) does not break crematorium creation or connection
