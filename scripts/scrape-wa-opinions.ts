import axios from "axios"
import * as cheerio from "cheerio"
import type { Cheerio, Element } from "cheerio"
import fs from "node:fs/promises"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"

const BASE_URL = "https://www.courts.wa.gov"
const RECENT_OPINIONS_URL = `${BASE_URL}/opinions/?fa=opinions.recent`
const OUTPUT_ROOT = path.join(process.cwd(), "data", "wa-courts")
const REQUEST_DELAY_MS = 250
const USER_AGENT = "life-ai-wa-courts-scraper/1.0 (+https://life.ai)"

type OpinionSection = {
  court: "Supreme Court" | "Court of Appeals"
  category: string
  slug: string
  opinions: CourtOpinion[]
}

type CourtOpinion = {
  docketNumber: string
  docketNumberNormalized: string
  caseTitle: string
  fileDateIso: string
  fileDateText: string
  division: string | null
  fileContains: string
  detailUrl: string
  pdfUrl: string | null
  isSuperseded: boolean
  isOpinion: boolean
  isPublished: boolean
}

type OpinionDetail = {
  [key: string]: string
}

const http = axios.create({
  timeout: 20000,
  headers: {
    "User-Agent": USER_AGENT,
  },
})

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

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

function slugify(input: string, maxLength = 80) {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug.slice(0, maxLength)
}

function normalizeDocket(docket: string) {
  return docket.replace(/[^0-9a-zA-Z]+/g, "")
}

function parseFileDate(input: string): { iso: string; year: number } {
  const trimmed = input.trim()
  const match = trimmed.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),\s+(\d{4})$/)
  if (!match) {
    return { iso: trimmed, year: 0 }
  }
  const [, monthRaw, dayRaw, yearRaw] = match
  const monthKey = monthRaw.slice(0, 3).toLowerCase()
  const monthIndex = MONTH_MAP[monthKey]
  const day = Number.parseInt(dayRaw, 10)
  const year = Number.parseInt(yearRaw, 10)
  if (Number.isNaN(day) || Number.isNaN(year) || monthIndex === undefined) {
    return { iso: trimmed, year: 0 }
  }
  const date = new Date(Date.UTC(year, monthIndex, day))
  return { iso: date.toISOString().slice(0, 10), year }
}

function absoluteUrl(href: string | undefined | null) {
  if (!href) {
    return null
  }
  return new URL(href, BASE_URL).toString()
}

function detectSuperseded($row: Cheerio<Element>) {
  return $row.find("b.error, span.error, .error").length > 0
}

function buildSectionSlug(court: OpinionSection["court"], category: string) {
  return `${court.toLowerCase().replace(/\s+/g, "-")}-${slugify(category, 40)}`
}

function parseOpinionsTable($: cheerio.CheerioAPI, table: cheerio.Element, context: { court: OpinionSection["court"]; category: string }): CourtOpinion[] {
  const opinions: CourtOpinion[] = []
  const $table = $(table)
  const hasDivisionColumn = $table.find("tr").first().find("td").length === 5
  $table
    .find("tr")
    .slice(1)
    .each((_, tr) => {
      const $row = $(tr)
      const cells = $row.find("td")
      if (!cells.length) {
        return
      }
      const fileDateText = $(cells[0]).text().trim()
      const caseInfoCell = hasDivisionColumn ? $(cells[1]) : $(cells[1])
      const divisionCell = hasDivisionColumn ? $(cells[2]) : null
      const titleCell = hasDivisionColumn ? $(cells[3]) : $(cells[2])
      const containsCell = hasDivisionColumn ? $(cells[4]) : $(cells[3])

      const detailAnchor = caseInfoCell.find('a[href*="opinions.showOpinion"]').first()
      const pdfAnchor = caseInfoCell
        .find('a[href]')
        .filter((_, link) => {
          const href = $(link).attr("href")?.toLowerCase() ?? ""
          return href.includes("/pdf/") || href.endsWith(".pdf")
        })
        .first()

      const docketNumber = detailAnchor.text().trim()
      if (!docketNumber) {
        return
      }

      const fileContains = containsCell.text().trim().replace(/\s+/g, " ")
      const isOpinion = /opinion/i.test(fileContains)
      const { iso: fileDateIso } = parseFileDate(fileDateText)

      opinions.push({
        docketNumber,
        docketNumberNormalized: normalizeDocket(docketNumber),
        caseTitle: titleCell.text().trim().replace(/\s+/g, " "),
        fileDateIso,
        fileDateText,
        division: divisionCell ? divisionCell.text().trim() || null : null,
        fileContains,
        detailUrl: absoluteUrl(detailAnchor.attr("href")) ?? "",
        pdfUrl: absoluteUrl(pdfAnchor.attr("href")),
        isSuperseded: detectSuperseded($row),
        isOpinion,
        isPublished: !/unpublished/i.test(context.category),
      })
    })

  return opinions
}

async function fetchRecentOpinions(): Promise<OpinionSection[]> {
  const { data } = await http.get<string>(RECENT_OPINIONS_URL)
  const $ = cheerio.load(data)
  const sections: OpinionSection[] = []

  const supremeTable = $("h3").filter((_, el) => $(el).text().trim().startsWith("Supreme Court Opinions")).nextAll("table.listTable").first()
  if (supremeTable.length) {
    const category = "Supreme Court Opinions"
    sections.push({
      court: "Supreme Court",
      category,
      slug: buildSectionSlug("Supreme Court", category),
      opinions: parseOpinionsTable($, supremeTable.get(0), { court: "Supreme Court", category }),
    })
  }

  const appealsHeading = $("h3")
    .filter((_, el) => $(el).text().trim().startsWith("Court of Appeals Opinions"))
    .first()

  if (appealsHeading.length) {
    let pointer = appealsHeading.next()
    while (pointer.length && pointer.prop("tagName") !== "H3") {
      if (pointer.is("table.listTable")) {
        const precedingStrong = pointer.prevAll("strong").first()
        const category = precedingStrong.length ? precedingStrong.text().trim().replace(/\s+/g, " ") : "Court of Appeals Opinions"
        sections.push({
          court: "Court of Appeals",
          category,
          slug: buildSectionSlug("Court of Appeals", category),
          opinions: parseOpinionsTable($, pointer.get(0), { court: "Court of Appeals", category }),
        })
      }
      pointer = pointer.next()
    }
  }

  return sections
}

async function fetchOpinionDetail(detailUrl: string): Promise<OpinionDetail> {
  if (!detailUrl) {
    return {}
  }
  const { data } = await http.get<string>(detailUrl)
  const $ = cheerio.load(data)
  const table = $("table").first()
  const detail: OpinionDetail = {}
  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("td")
    if (cells.length < 2) {
      return
    }
    const key = $(cells[0]).text().trim().replace(/\s+/g, " ")
    const value = $(cells[1]).text().trim().replace(/\s+/g, " ")
    if (!key) {
      return
    }
    detail[key.replace(/:$/, "")] = value
  })
  return detail
}

async function downloadPdf(opinion: CourtOpinion, dirPath: string) {
  if (!opinion.pdfUrl) {
    return null
  }
  const fileName = `${opinion.docketNumberNormalized || slugify(opinion.docketNumber)}-${slugify(opinion.caseTitle, 60)}.pdf`
  const filePath = path.join(dirPath, fileName)
  if (await fileExists(filePath)) {
    return filePath
  }

  const response = await http.get<ArrayBuffer>(opinion.pdfUrl, {
    responseType: "arraybuffer",
  })
  await fs.writeFile(filePath, Buffer.from(response.data))
  return filePath
}

async function saveMetadata(opinion: CourtOpinion, detail: OpinionDetail, dirPath: string, pdfPath: string | null) {
  const filePath = path.join(dirPath, `${opinion.docketNumberNormalized || slugify(opinion.docketNumber)}.json`)
  const payload = {
    docketNumber: opinion.docketNumber,
    docketNumberNormalized: opinion.docketNumberNormalized,
    caseTitle: opinion.caseTitle,
    fileDate: opinion.fileDateIso || opinion.fileDateText,
    division: opinion.division,
    fileContains: opinion.fileContains,
    detailUrl: opinion.detailUrl,
    pdfUrl: opinion.pdfUrl,
    pdfPath,
    isSuperseded: opinion.isSuperseded,
    isOpinion: opinion.isOpinion,
    isPublished: opinion.isPublished,
    fetchedAt: new Date().toISOString(),
    detail,
  }
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2))
}

async function writeSummary(sections: OpinionSection[]) {
  const summaryPath = path.join(OUTPUT_ROOT, "recent-opinions.json")
  const payload = {
    fetchedAt: new Date().toISOString(),
    source: RECENT_OPINIONS_URL,
    sections: sections.map((section) => ({
      court: section.court,
      category: section.category,
      slug: section.slug,
      opinionCount: section.opinions.length,
    })),
  }
  await fs.writeFile(summaryPath, JSON.stringify(payload, null, 2))
}

async function main() {
  console.log("Fetching recent opinions…")
  const sections = await fetchRecentOpinions()
  await ensureDir(OUTPUT_ROOT)

  for (const section of sections) {
    if (!section.opinions.length) {
      continue
    }

    const sectionDir = path.join(OUTPUT_ROOT, section.slug)
    await ensureDir(sectionDir)

    for (const opinion of section.opinions) {
      if (!opinion.isOpinion || opinion.isSuperseded) {
        continue
      }
      const { year } = parseFileDate(opinion.fileDateText)
      const yearDir = year ? path.join(sectionDir, `${year}`) : sectionDir
      await ensureDir(yearDir)

      console.log(`Processing ${opinion.docketNumber} (${opinion.caseTitle})`)
      try {
        const detail = await fetchOpinionDetail(opinion.detailUrl)
        const pdfPath = await downloadPdf(opinion, yearDir)
        await saveMetadata(opinion, detail, yearDir, pdfPath)
      } catch (error) {
        console.error(`Failed to process ${opinion.docketNumber}:`, (error as Error).message)
      }
      await delay(REQUEST_DELAY_MS)
    }
  }

  await writeSummary(sections)
  console.log("Done.")
}

main().catch((error) => {
  console.error("Scraper failed:", error)
  process.exitCode = 1
})
