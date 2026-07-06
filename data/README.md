# Data snapshots — provenance

All files are NORAD **TLE** (3-line: name + two element lines) fetched from the public,
no-auth **CelesTrak GP API** (`gp.php`, `FORMAT=tle`).

- **Provider:** CelesTrak — https://celestrak.org/NORAD/documentation/gp-data-formats.php
- **Capture date:** 2026-07-06 (element epochs ≈ day 186 of 2026)
- **License:** CelesTrak data is public / redistributable; no secrets or credentials involved.

Each field's live-refresh URL is stored in `catalog.json` as `liveUrl` (same endpoint the
snapshot came from), so the in-app "Refresh from CelesTrak" button re-fetches the current data.

## Snapshots (object counts at capture)

| id            | dataset                         | NORAD / GROUP                  | objects |
|---------------|---------------------------------|--------------------------------|--------:|
| `iss`         | ISS (ZARYA)                     | `CATNR=25544`                  |       1 |
| `cosmos-2251` | Cosmos 2251 collision debris    | `GROUP=cosmos-2251-debris`     |     583 |
| `iridium-33`  | Iridium 33 collision debris     | `GROUP=iridium-33-debris`      |     112 |
| `fengyun-1c`  | Fengyun-1C ASAT debris          | `GROUP=fengyun-1c-debris`      |    1918 |
| `analyst`     | Unidentified tracked objects    | `GROUP=analyst`                |     226 |

**Note on `analyst`:** CelesTrak's "analyst" group is uncorrelated / not-yet-identified tracked
objects (their name lines read `UNKNOWN`) — effectively unattributed orbital debris, and a dense,
on-theme cloud for an "orbital trash" survey. To add Cosmos 1408 ASAT debris, add a catalog entry with
`GROUP=cosmos-1408-debris` (only ~3 objects remain catalogued by 2026 — most has re-entered).

## Validation

Each file is non-empty, its line count is a multiple of 3, element lines begin with `1 ` / `2 `,
and the count of `1 ` lines equals the count of `2 ` lines. Verified at capture.

## Refresh

To re-capture a snapshot manually:

```bash
curl -sL "<liveUrl from catalog.json>" -o data/<id>.tle
```
