# U.S. Code bulk XML integration

The Office of the Law Revision Counsel (OLRC) publishes the authoritative U.S. Code in machine-readable formats (USLM XML, XHTML, PCC, PDF). The bulk downloads live at [uscode.house.gov/download](https://uscode.house.gov/download/download.shtml). We now have tooling to pull the latest XML release directly into the repository for downstream parsing or indexing.

## Script: `pnpm fetch:uscode`

```bash
pnpm fetch:uscode                # download ZIP archives only
pnpm fetch:uscode -- --extract   # optional: also extract XML locally
```

What it does:

- Scrapes the OLRC download page for the current release path (e.g., `releasepoints/us/pl/119/36`).
- Downloads every XML zip (`xml_uscXX@...zip`) with a descriptive `User-Agent`. The combined `uscAll.zip` archive exceeds GitHub’s 100 MB limit, so fetch it manually if you need it.
- Stores the archives under `data/uscode/<release>/zip/`, writing a `.complete.json` sentinel next to each file so re-runs skip already-downloaded titles.
- When invoked with `-- --extract`, unpacks each archive into `data/uscode/<release>/<Title>/` and drops a `.complete` marker inside the extracted folder.
- Writes `data/uscode/<release>/release.json` summarising the fetch (source URL, timestamp, titles pulled).

Example layout after a run:

```
data/
  uscode/
    119-36/
      release.json
      zip/
        usc01.zip
        …
      Title1/             # only when --extract is used
        usc01.xml
        …
      Title5-APP/
        usc05a.xml
        …
```

> **Note:** By default only ZIP archives are tracked. If you need materialized XML, run the fetcher with `-- --extract`; the extracted directories are git-ignored so they stay local. Each USLM archive may contain multiple files per title (tables, notes, appendices), so keep the tree intact when you extract it.

## Consuming the XML

- USLM elements map neatly onto titles, chapters, sections, notes, and amendments. Use the [USLM User Guide](https://uscode.house.gov/download/resources/USLM-User-Guide.pdf) and [`schemaandcss.zip`](https://uscode.house.gov/download/resources/schemaandcss.zip) for detailed structure.
- Every element carries a `@identifier` (e.g., `us/usc/t5/s552`) that is ideal for primary keys in downstream databases or vector indices.
- Most releases provide a combined archive (`uscAll.zip`). Because of GitHub’s 100 MB cap, this repo stores only the per-title ZIPs; download the combined archive manually when needed. Per-title files are lighter if you want incremental updates.

## Update cadence & change detection

- OLRC release points follow public law numbers (e.g., `119-36`). Re-run `pnpm fetch:uscode` whenever a new release appears.
- The `.complete` sentinels ensure we don't re-extract unchanged titles. Delete them (or the entire release folder) if you need a clean re-fetch.
- To detect content changes between releases, compare XML hashes (per title) or diff the extracted XML after downloading the combined archive locally when necessary.

## Licensing and use

- The U.S. Code is in the public domain (17 U.S.C. § 105). OLRC requests attribution when feasible.
- The download service has no explicit rate limits, but be respectful: the script serialises requests and identifies itself via `life-ai-uscode-fetcher/1.0`.
- Some titles (e.g., Title 53) are reserved; the OLRC page links to placeholders that return “Document not found”. The script logs those cases and moves on, but keep an eye on the console output for any future genuine failures. You will still see a `.complete.json` sentinel next to the ZIP so repeated runs skip the request.

## Next steps

- Build a parser that converts USLM XML into structured JSON (titles, chapters, sections, notes) and seeds your Firestore/Postgres/vector stores.
- Integrate the release metadata (`release.json`) into the library catalogue so users can browse by Title and release point.
- Set up a periodic job (e.g., GitHub Actions or Airflow) that runs `pnpm fetch:uscode` and commits new releases into version control.
