# Caselaw Access Project (CAP) integration

Harvard Law School Library's Caselaw Access Project (CAP) digitized more than six million U.S. opinions spanning 360+ jurisdictions from 1658 to 2018. The data is available in two primary ways:

- **CourtListener REST API** — maintained by Free Law Project, offers search, filtering, and JSON exports for CAP opinions. This is the same API Life-AI already uses for legal search. Authenticate requests with either a token or username/password.
- **Static bulk downloads** — hosted at `https://static.case.law/`, exposing reporter-level folders containing JSON metadata, HTML renderings, PDFs, ZIP archives, and TAR files for each volume.

## Access options

### CourtListener API

- Base URL: `https://www.courtlistener.com/api/rest/v3/`
- Auth: set `COURT_LISTENER_API_KEY` in `.env` to send `Authorization: Token <key>` (preferred), or provide `COURT_LISTENER_USERNAME` and `COURT_LISTENER_PASSWORD` for basic auth.
- CAP-specific filters: CAP opinions are flagged in `originating_court` metadata and surfaced across the `search/`, `opinions/`, and `dockets/` endpoints. Use the `court`, `jurisdiction`, and `has_oral_argument` filters, plus `order_by=decision_date` for chronology.
- Rate limits: 120 requests/minute per key. Cache responses whenever possible for deterministic training pipelines.

### Static downloads (`static.case.law`)

Key top-level JSON indices:

| Path | Description |
| --- | --- |
| `/ReportersMetadata.json` | List of all CAP reporters with slug, date range, and jurisdictions. |
| `/JurisdictionsMetadata.json` | Each jurisdiction's case, volume, reporter, and page counts with reporter references. |
| `/<reporter-slug>/VolumesMetadata.json` | Reporter-specific volumes (folder name, Hollis ID, publication year, redaction flag). |
| `/<reporter-slug>/<volume>/CasesMetadata.json` | Case-level metadata for a volume (citations, docket, court, provenance). |

Volume folders contain:

- `cases/*.json` — case text segmented by opinion/section.
- `html/*.html` — HTML renderings with OCR coordinates.
- `*.pdf`, `*.zip`, `*.tar`, `*.tar.csv`, `*.tar.sha256` — archival bundles.

Example commands:

```bash
# Download reporter metadata
curl -o reporters.json https://static.case.law/ReportersMetadata.json

# Fetch a volume bundle with retry logic
wget -c https://static.case.law/a2d/100.zip

# Pull case metadata for a specific volume
curl https://static.case.law/a2d/100/CasesMetadata.json | jq '.[0]'
```

## Life-AI implementation highlights

- **Server helpers:** `lib/caselaw/cap.ts` wraps the static endpoints with typed helpers for reporters, jurisdictions, volumes, and cases. It also exports URL builders for JSON/HTML/PDF/TAR assets and CourtListener landing pages.
- **Library page:** `/library/caselaw-access-project` renders an overview with jurisdiction stats, regional reporter coverage, and copy-paste download helpers for curators and data engineers.
- **Library catalog entry:** `lib/library/resources.ts` now lists CAP as a featured dataset so it surfaces in search, filters, and spotlight collections.
- **AI/search alignment:** Existing CourtListener search integration (see `lib/courtlistener/server.ts`) automatically benefits from the CAP metadata once authenticated. Set the env vars above and CAP opinions flow into the legal search workspace and assistant responses.

## Training data workflow suggestions

1. Use `getCapJurisdictions()` to identify priority jurisdictions (highest `caseCount`) for your matter or model.
2. Call `getCapVolumesForReporter(slug)` to enumerate volume folders, then `getCapCasesForVolume(slug, folder)` to stage metadata.
3. Download individual case JSON/HTML with `buildCapCaseJsonUrl` or `buildCapCaseHtmlUrl`, or fetch the full ZIP if you need images and metadata together.
4. Store the `analysis.sha256` and `provenance` fields alongside ingestion records to track source integrity and simplify deduplication.
5. Link back to CourtListener using `buildCourtListenerUrl` to benefit from additional enrichment (citator, similar cases, arguments).

## Licensing and attribution

- CAP data is released under **Creative Commons Attribution 4.0 (CC BY 4.0)**. Always attribute Harvard Law School Library Innovation Lab and Free Law Project when redistributing or surfacing CAP content.
- PDFs may include Harvard-owned scans; respect any additional markings or restrictions noted in metadata.
- Some volumes are marked `redacted: true` — avoid exposing OCR text for those volumes without validating permissible use.

## Operational checklist

- [ ] Add `COURT_LISTENER_API_KEY` (or credentials) to environment configs and secrets stores.
- [ ] Schedule periodic refresh (daily or weekly) of `ReportersMetadata.json` and `JurisdictionsMetadata.json` to update stats.
- [ ] Index CAP datasets into your vector store or RAG pipeline using the helpers in `lib/caselaw/cap.ts`.
- [ ] Update documentation or onboarding materials to reference the new `/library/caselaw-access-project` page.
- [ ] Monitor rate limits; implement retry and caching when pulling large volumes.
