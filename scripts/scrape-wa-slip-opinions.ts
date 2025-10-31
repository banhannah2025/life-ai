import axios from "axios"
import * as cheerio from "cheerio"
import fs from "node:fs/promises"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"

const BASE_URL = "https://www.courts.wa.gov"
const OPINIONS_BASE = `${BASE_URL}/opinions/`
const OUTPUT_ROOT = path.join(process.cwd(), "data", "wa-courts")
const USER_AGENT = "life-ai-wa-courts-scraper/1.0 (+https://life.ai)"
const REQUEST_DELAY_MS = 250

type CourtLevel = "S" | "C"
type PublicationStatus = "PUB" | "PAR" | "UNP"

type YearLink = {
  courtLevel: CourtLevel
  publicationStatus: PublicationStatus
  year: number
  url: string
}

type SlipOpinionEntry = {
  docketNumber: string
  docketNumberNormalized: string
  caseTitle: string
  fileDate: string | null
  fileContains: string
  fileMonthSection: string | null
  courtLevel: CourtLevel
  publicationStatus: PublicationStatus
  detailUrl: string | null
  pdfUrl: string | null
  htmlUrl: string | null
  pdfPath: string | null
  isRevised: boolean
  fetchedAt: string
  division: string | null
}

const http = axios.create({
  headers: {
    "User-Agent": USER_AGENT,
  },
  timeout: 20000,
})

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function absoluteUrl(href: string | undefined | null, base = OPINIONS_BASE) {
  if (!href) {
    return null
  }
  return new URL(href, base).toString()
}

async function fetchHtml(url: string) {
  const response = await http.get<string>(url)
  return response.data
}

function extractYearLinks(html: string): YearLink[] {
  const $ = cheerio.load(html)
  const links: YearLink[] = []

  const linkPattern = /fa=opinions\.byYear&fileYear=(\d{4})&crtLevel=([SC])&pubStatus=(PUB|PAR|UNP)/i
  $("a[href*='fa=opinions.byYear']").each((_, element) => {
    const href = $(element).attr("href")
    const url = absoluteUrl(href, OPINIONS_BASE)
    if (!url) {
      return
    }
    const match = url.match(linkPattern)
    if (!match) {
      return
    }
    const year = Number.parseInt(match[1], 10)
    const courtLevel = match[2].toUpperCase() as CourtLevel
    const publicationStatus = match[3].toUpperCase() as PublicationStatus
    links.push({
      courtLevel,
      publicationStatus,
      year,
      url,
    })
  })

  return links
}

function normalizeDocket(docket: string) {
  return docket.replace(/[^0-9A-Za-z]+/g, "")
}

function parseFileDate(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  const normalized = trimmed.replace(/\./g, "")
  const date = Date.parse(normalized)
  if (!Number.isNaN(date)) {
    return new Date(date).toISOString().slice(0, 10)
  }
  return null
}

function extractSlipOpinions(
  html: string,
  options: { courtLevel: CourtLevel; publicationStatus: PublicationStatus }
): SlipOpinionEntry[] {
  const $ = cheerio.load(html)
  const entries: SlipOpinionEntry[] = []
  let currentMonthSection: string | null = null

  $("table tr").each((_, row) => {
    const $row = $(row)
    if ($row.find("strong").length && $row.find("td").length === 1) {
      const sectionTitle = $row.find("strong").text().replace(/\s+/g, " ").trim()
      if (sectionTitle) {
        currentMonthSection = sectionTitle
      }
      return
    }

    const cells = $row.find("td")
    if (cells.length < 4) {
      return
    }

    const fileDateText = cells.eq(0).text().replace(/\s+/g, " ").trim()
    if (
      !fileDateText ||
      fileDateText.toLowerCase().includes("no opinions") ||
      /file date/i.test(fileDateText)
    ) {
      return
    }

    let columnIndex = 1
    const caseInfoCell = cells.eq(columnIndex++)
    let division: string | null = null
    if (cells.length === 5) {
      division = cells.eq(columnIndex++).text().replace(/\s+/g, " ").trim() || null
    }
    const caseTitleCell = cells.eq(columnIndex++)
    const fileContainsCell = cells.eq(columnIndex++)

    const docketLink = caseInfoCell.find("a[href*='fa=opinions.showOpinion']").first()
    const pdfLink = caseInfoCell.find("a[href$='.pdf']").first()
    const caseTitleRaw = caseTitleCell.text().replace(/\s+/g, " ").trim()
    const isRevised = caseTitleCell.find(".warning").length > 0
    const docketText = docketLink.text().replace(/\s+/g, " ").trim()

    if (!docketText || !caseTitleRaw) {
      return
    }

    const htmlUrl = absoluteUrl(docketLink.attr("href"), OPINIONS_BASE)
    const pdfUrl = absoluteUrl(pdfLink.attr("href"), OPINIONS_BASE)
    const normalizedDocket = normalizeDocket(docketText)

    entries.push({
      docketNumber: docketText,
      docketNumberNormalized: normalizedDocket,
      caseTitle: caseTitleRaw.replace(/^\*/, "").trim(),
      fileDate: parseFileDate(fileDateText),
      fileContains: fileContainsCell.text().replace(/\s+/g, " ").trim(),
      fileMonthSection: currentMonthSection,
      courtLevel: options.courtLevel,
      publicationStatus: options.publicationStatus,
      detailUrl: htmlUrl,
      pdfUrl,
      htmlUrl,
      pdfPath: null,
      isRevised,
      fetchedAt: new Date().toISOString(),
      division,
    })
  })

  return entries
}

async function downloadPdf(pdfUrl: string | null, destination: string) {
  if (!pdfUrl) {
    return
  }
  if (await fileExists(destination)) {
    return
  }
  const response = await http.get<ArrayBuffer>(pdfUrl, { responseType: "arraybuffer" })
  await fs.writeFile(destination, Buffer.from(response.data))
}

function directoryForEntry(entry: SlipOpinionEntry): string {
  const courtSlug = entry.courtLevel === "S" ? "supreme" : "court-of-appeals"
  const statusSlug =
    entry.publicationStatus === "PUB"
      ? "published"
      : entry.publicationStatus === "PAR"
        ? "partial"
        : "unpublished"
  return `${courtSlug}-slip-${statusSlug}`
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "opinion"
}

function fileNameForEntry(entry: SlipOpinionEntry) {
  const base = entry.docketNumberNormalized || entry.docketNumber.replace(/\s+/g, "_")
  const variant = slugify(entry.fileContains || "opinion")
  return `${base}-${variant}.json`
}

async function saveEntry(entry: SlipOpinionEntry) {
  const year = entry.fileDate ? new Date(entry.fileDate).getUTCFullYear().toString() : "unknown"
  const dirSlug = directoryForEntry(entry)
  const dirPath = path.join(OUTPUT_ROOT, dirSlug, year)
  await ensureDir(dirPath)

  if (entry.pdfUrl) {
    const pdfFileName = path.basename(new URL(entry.pdfUrl).pathname)
    const pdfPath = path.join(dirPath, pdfFileName)
    try {
      await downloadPdf(entry.pdfUrl, pdfPath)
      entry.pdfPath = path.relative(process.cwd(), pdfPath)
    } catch (error) {
      console.error(`Failed to download PDF ${entry.pdfUrl}`, error)
      entry.pdfPath = null
    }
  }

  const outputPath = path.join(dirPath, fileNameForEntry(entry))
  await fs.writeFile(outputPath, JSON.stringify(entry, null, 2))
}

async function processYearLink(link: YearLink) {
  console.log(
    `Fetching ${link.courtLevel} ${link.publicationStatus} opinions for ${link.year}`
  )
  const html = await fetchHtml(link.url)
  const entries = extractSlipOpinions(html, {
    courtLevel: link.courtLevel,
    publicationStatus: link.publicationStatus,
  })

  if (!entries.length) {
    console.warn(`No entries found for ${link.year} (${link.courtLevel} ${link.publicationStatus})`)
    return
  }

  for (const entry of entries) {
    await saveEntry(entry)
    await delay(REQUEST_DELAY_MS)
  }
  console.log(
    `  Saved ${entries.length} entries for ${link.year} ${link.courtLevel} ${link.publicationStatus}`
  )
}

async function main() {
  await ensureDir(OUTPUT_ROOT)
  console.log("Fetching slip opinions index…")
  const html = await fetchHtml(`${OPINIONS_BASE}index.cfm?fa=opinions.displayAll`)
  const yearLinks = extractYearLinks(html)
  if (!yearLinks.length) {
    throw new Error("No slip opinion year links found.")
  }

  const sortedLinks = yearLinks.sort((a, b) => b.year - a.year)

  for (const link of sortedLinks) {
    try {
      await processYearLink(link)
    } catch (error) {
      console.error(
        `Failed to process ${link.year} (${link.courtLevel} ${link.publicationStatus})`,
        error
      )
    }
    await delay(REQUEST_DELAY_MS)
  }

  console.log("Slip opinion scrape completed.")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
