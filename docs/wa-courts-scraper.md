# Washington Courts Slip Opinion Scraper

This repository now ships with a TypeScript scraper for the recent slip opinions published on [courts.wa.gov](https://www.courts.wa.gov). The script targets the official “Recently Filed” page and saves both the PDFs and structured metadata for opinions that remain citable law.

## Data sources covered

| Source | URL | Notes |
| --- | --- | --- |
| Supreme Court opinions (last 14 days) | `https://www.courts.wa.gov/opinions/?fa=opinions.recent` | Rows that contain opinions are downloaded; orders without opinions and entries marked with the red asterisk flag are skipped. |
| Court of Appeals opinions (published in part / published / unpublished) | Same page, separate tables | Division information is captured when available so downstream filters can focus on the right appellate division. |

The script deliberately **skips** any slip opinion row that:

- includes the red asterisk flag (`<b class="error">*</b>`) indicating the slip version has been superseded by the official report, or
- does not list an opinion in the “File Contains” column (pure orders, errata, etc.).

## Running the scraper

```bash
pnpm scrape:wa-opinions
```

Output is saved under `data/wa-courts/`:

```
data/
  wa-courts/
    supreme-court-opinions/
      2025/
        1031351-erickson-v-pharmacia-llc.pdf
        1031351.json
        …
    court-of-appeals-opinions-published-opinions/
      2025/
        587866-state-of-washington-v-perrin.pdf
        587866.json
        …
    recent-opinions.json
```

- Each docket gets a PDF (when available) and a metadata JSON file containing the case title, file date, division, disposition notes, and the parsed fields from the opinion detail page (signing judges, lower court docket, etc.).
- The summary file `recent-opinions.json` records which buckets were fetched and when.

### Throttling and headers

Requests are serialized with a 250 ms delay and include a descriptive `User-Agent` string. Adjust `REQUEST_DELAY_MS` in `scripts/scrape-wa-opinions.ts` if you need slower or faster polling, but keep an eye on the judiciary’s bandwidth guidance.

### Managing relevance

If you need to further restrict what is “relevant law”:

- Check the `fileContains` field in the metadata JSON (e.g., `"Majority Opinion"`, `"Maj., and Dis. Opinions"`).
- Use the `isPublished` flag to ignore unpublished Court of Appeals decisions.
- Watch the `detail` object for status cues (lower court case number, oral argument date, etc.) when triaging which opinions to keep in downstream training sets.

## LexisNexis official reports

Washington links to the official, edited opinions via the **Washington State Judicial Opinions Website** (powered by LexisNexis) at `https://www.lexisnexis.com/clients/wareports/`. That portal loads through `advance.lexis.com` and requires JavaScript as well as acceptance of LexisNexis terms of use. The site’s terms prohibit bulk scraping without permission, so the automated script here does **not** attempt to mirror or download those official reports.

Recommended workflow:

1. Use the slip-opinion scraper to identify new and relevant dockets quickly.
2. When an authoritative cite is required, follow the `detailUrl` in the metadata or the Lexis portal link exposed on courts.wa.gov, then download or cite the official version manually (or through an approved Lexis API where licensing allows).
3. Record the official citation in your downstream metadata so your datasets reflect whether you are training on a slip version or the final report.

If you later secure permission or an API contract with LexisNexis, you can add an authenticated fetcher module to this script; keep that logic isolated so it is easy to disable when outside the permitted scope.

### Licensing status (Oct 2025)

- The Washington portal is governed by the **LexisNexis® General Terms of Use** plus the **Advance® Subscriber Agreement**. Both bar automated extraction, caching, or redistribution without prior written consent.
- Lexis provides an official contact form for licensing at `https://www.lexisnexis.com/en-us/contact-us.page` (select “Licensing” → “Public Records & Court Content”).
- Until we have a signed agreement, treat the portal as a read-only reference for humans. If/when legal clears an integration, archive the signed permission alongside this documentation and gate any automated fetcher behind a feature flag.

## Future enhancements

- Persist hashes of downloaded PDFs to detect substantive updates.
- Add CLI flags for dry runs, keyword filters, or division-specific pulls.
- Queue metadata into Firestore or another store so the library UI can surface Washington opinions alongside CourtListener results.
- Extend the scraper to watch historic archives (`opinions/?fa=opinions.archList`) once you need deeper backfills.
