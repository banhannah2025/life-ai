import axios from "axios"
import * as cheerio from "cheerio"
import fs from "node:fs/promises"
import path from "node:path"

type TitleIndexEntry = {
  titleNumber: string
  titleName: string
  href: string
}

type RCWSection = {
  sectionNumber: string
  caption: string
  bodyHtml: string
  history?: string
}

type RCWChapter = {
  chapterNumber: string
  chapterTitle: string
  sections: RCWSection[]
}

type RCWTitle = {
  titleNumber: string
  titleName: string
  chapters: RCWChapter[]
}

const BASE_URL = "https://app.leg.wa.gov/RCW"
const OUTPUT_DIR = path.join(process.cwd(), "public", "rcw")
const REQUEST_DELAY_MS = 150
const REQUEST_RETRIES = 3
const CONCURRENCY = 4

const client = axios.create({
  timeout: 20000,
  headers: {
    "User-Agent": "life-ai-rcw-scraper/1.0 (+https://life.ai)",
    Accept: "text/html,application/xhtml+xml",
  },
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHtml(url: string, attempt = 1): Promise<string> {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}/${url.replace(/^\//, "")}`

  try {
    const response = await client.get<string>(fullUrl)
    return response.data
  } catch (error) {
    if (attempt >= REQUEST_RETRIES) {
      throw error
    }
    const backoff = REQUEST_DELAY_MS * attempt * 2
    console.warn(`Retrying ${fullUrl} in ${backoff}ms (attempt ${attempt + 1}/${REQUEST_RETRIES})`)
    await sleep(backoff)
    return fetchHtml(url, attempt + 1)
  } finally {
    await sleep(REQUEST_DELAY_MS)
  }
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return []
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (true) {
      const current = nextIndex++
      if (current >= items.length) break
      results[current] = await worker(items[current], current)
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}

async function fetchTitleIndex(): Promise<TitleIndexEntry[]> {
  const html = await fetchHtml("/")
  const $ = cheerio.load(html)
  const rows = $("#ContentPlaceHolder1_dgSections tr")
  const titles: TitleIndexEntry[] = []

  rows.each((_i, row) => {
    const link = $(row).find("a[href*='default.aspx']")
    if (!link.length) return

    const href = link.attr("href")
    const titleMatch = link.text().match(/Title\s+(.+)/i)
    const titleNumber = titleMatch ? cleanText(titleMatch[1]) : cleanText(link.text().replace(/^Title\s*/, ""))

    const nameCell = $(row).find("td").last().text()
    const titleName = cleanText(nameCell)

    if (!href || !titleNumber) return

    titles.push({
      titleNumber,
      titleName,
      href,
    })
  })

  return titles
}

async function scrapeTitle(entry: TitleIndexEntry): Promise<RCWTitle> {
  const html = await fetchHtml(entry.href)
  const $ = cheerio.load(html)

  const headerText = cleanText($("#contentWrapper h3").first().text())
  const headerMatch = headerText.match(/Title\s+(.+?)\s+RCW/i)
  const titleNumber = headerMatch ? headerMatch[1] : entry.titleNumber

  const titleName = cleanText($("#contentWrapper h3").eq(1).text()) || entry.titleName

  const rows = $("#contentWrapper table tr")
  const chapters = rows
    .map((_idx, row) => {
      const anchor = $(row)
        .find("a")
        .filter((_i, el) => /^\d/.test(cleanText($(el).text())))
        .first()

      if (!anchor.length) {
        return null
      }

      const chapterNumber = cleanText(anchor.text())
      const chapterTitle = cleanText($(row).find("td").last().text())
      const href = anchor.attr("href")
      if (!chapterNumber || !href) return null

      return { chapterNumber, chapterTitle, href }
    })
    .get()

  const chapterData = await mapWithConcurrency(chapters, CONCURRENCY, async (chapter, index) => {
    console.log(`  [${index + 1}/${chapters.length}] Chapter ${chapter.chapterNumber}`)
    return scrapeChapter(chapter)
  })

  return {
    titleNumber,
    titleName,
    chapters: chapterData,
  }
}

async function scrapeChapter(chapter: { chapterNumber: string; chapterTitle: string; href: string }): Promise<RCWChapter> {
  const html = await fetchHtml(chapter.href)
  const $ = cheerio.load(html)

  const chapterTitle =
    cleanText($("#contentWrapper h3").eq(1).text()) || chapter.chapterTitle || `Chapter ${chapter.chapterNumber}`

  const rows = $("#contentWrapper table tr")
  const sections = rows
    .map((_idx, row) => {
      const anchor = $(row)
        .find("a")
        .filter((_i, el) => /^\d/.test(cleanText($(el).text())))
        .first()
      if (!anchor.length) return null

      const sectionNumber = cleanText(anchor.text())
      const caption = cleanText($(row).find("td").last().text())
      const href = anchor.attr("href")
      if (!sectionNumber || !href) return null

      return { sectionNumber, caption, href }
    })
    .get()

  const sectionData = await mapWithConcurrency(sections, CONCURRENCY, async (section, index) => {
    console.log(`    [${index + 1}/${sections.length}] Section ${section.sectionNumber}`)
    return scrapeSection(section)
  })

  return {
    chapterNumber: chapter.chapterNumber,
    chapterTitle,
    sections: sectionData,
  }
}

async function scrapeSection(section: { sectionNumber: string; caption: string; href: string }): Promise<RCWSection> {
  const html = await fetchHtml(section.href)
  const $ = cheerio.load(html)

  const wrapper = $("#contentWrapper")

  const caption = cleanText(wrapper.find("h3").eq(1).text()) || section.caption
  const bodyContainer = wrapper.find("> div").eq(2)
  const historyContainer = wrapper.find("> div").eq(3)

  const bodyHtml = (bodyContainer.html() ?? "").trim()
  const historyHtml = (historyContainer.html() ?? "").trim()

  return {
    sectionNumber: section.sectionNumber,
    caption,
    bodyHtml,
    history: historyHtml || undefined,
  }
}

async function writeTitleToDisk(title: RCWTitle) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const filePath = path.join(OUTPUT_DIR, `title-${title.titleNumber}.json`)
  await fs.writeFile(filePath, JSON.stringify(title, null, 2), "utf8")
}

async function run() {
  console.time("rcw:scrape")
  console.log("Fetching RCW title index…")
  const titles = await fetchTitleIndex()
  console.log(`Discovered ${titles.length} titles`)

  for (let i = 0; i < titles.length; i += 1) {
    const entry = titles[i]
    console.log(`[${i + 1}/${titles.length}] Title ${entry.titleNumber} — ${entry.titleName}`)
    const titleData = await scrapeTitle(entry)
    await writeTitleToDisk(titleData)
  }

  console.log("RCW scrape complete")
  console.timeEnd("rcw:scrape")
}

run().catch((error) => {
  console.error("Scrape failed:", error)
  process.exitCode = 1
})

