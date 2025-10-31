import axios from "axios"
import * as cheerio from "cheerio"
import fs from "node:fs/promises"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"

const BASE_URL = "https://www.courts.wa.gov"
const RULES_BASE = `${BASE_URL}/court_rules/`
const OUTPUT_ROOT = path.join(process.cwd(), "data", "wa-court-rules")
const PDF_ROOT = path.join(OUTPUT_ROOT, "pdf")
const USER_AGENT = "life-ai-wa-courts-scraper/1.0 (+https://life.ai)"
const REQUEST_DELAY_MS = 250

type RuleGroup = {
  code: string
  name: string
  href: string
}

type RuleSetLink = {
  groupCode: string
  groupName: string
  setCode: string
  setAbbreviation: string
  setName: string
  href: string
}

type RuleEntry = {
  ruleNumber: string
  title: string
  category: string | null
  pdfUrl: string
  pdfPath: string | null
}

type RuleSetDocument = {
  fetchedAt: string
  groupCode: string
  groupName: string
  setCode: string
  setAbbreviation: string
  setName: string
  sourceUrl: string
  rules: RuleEntry[]
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

function absoluteUrl(href: string | undefined | null, base = RULES_BASE) {
  if (!href) {
    return null
  }
  return new URL(href, base).toString()
}

async function fetchHtml(url: string) {
  const response = await http.get<string>(url)
  return response.data
}

function extractGroups(html: string): RuleGroup[] {
  const $ = cheerio.load(html)
  const groups: RuleGroup[] = []
  const seen = new Set<string>()

  $('a[href*="?fa=court_rules.state"], a[href*="?fa=court_rules.sw"]').each((_, element) => {
    const href = $(element).attr("href")
    const url = absoluteUrl(href)
    if (!url) {
      return
    }
    const parsed = new URL(url)
    const fa = parsed.searchParams.get("fa")
    if (fa !== "court_rules.state" && fa !== "court_rules.sw") {
      return
    }
    const groupCode = parsed.searchParams.get("group")
    if (!groupCode || seen.has(groupCode)) {
      return
    }
    const name = $(element).text().trim() || `Group ${groupCode}`
    groups.push({
      code: groupCode,
      name,
      href: url,
    })
    seen.add(groupCode)
  })

  return groups
}

function extractRuleSets(html: string, group: RuleGroup): RuleSetLink[] {
  const $ = cheerio.load(html)
  const sets: RuleSetLink[] = []
  $('a[href*="?fa=court_rules.list"]').each((_, element) => {
    const href = $(element).attr("href")
    const url = absoluteUrl(href)
    if (!url) {
      return
    }
    const parsed = new URL(url)
    const setCode = parsed.searchParams.get("set")
    if (!setCode) {
      return
    }
    const groupCode = parsed.searchParams.get("group") ?? group.code
    const abbreviation = $(element).text().replace(/\s+/g, " ").trim()
    const nameCell = $(element).closest("tr").find("td").eq(1)
    const setName = nameCell.text().replace(/\s+/g, " ").trim() || abbreviation
    sets.push({
      groupCode,
      groupName: group.name,
      setCode,
      setAbbreviation: abbreviation || setCode,
      setName,
      href: url,
    })
  })
  return sets
}

function normalizeRuleNumber(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function sanitizeCategory(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim()
  return trimmed.length ? trimmed : null
}

function parseRuleList(html: string): { title: string; rules: RuleEntry[] } {
  const $ = cheerio.load(html)
  const heading = $("h2").first().text().replace(/\s+/g, " ").trim()
  const rules: RuleEntry[] = []
  let currentCategory: string | null = null

  $("table tr").each((_, row) => {
    const $row = $(row)
    const headingCell = $row.find("td[colspan]")
    if (headingCell.length) {
      const text = headingCell.text()
      const category = sanitizeCategory(text)
      if (category) {
        currentCategory = category
      }
      return
    }

    const link = $row.find('a[href*="/court_rules/"]')
    if (!link.length) {
      return
    }
    const numberCell = $row.find("td").first()
    const titleCell = $row.find("td").eq(1)
    const ruleNumber = normalizeRuleNumber(numberCell.text())
    const title = titleCell.text().replace(/\s+/g, " ").trim()
    const href = link.attr("href")
    const pdfUrl = absoluteUrl(href, RULES_BASE)
    if (!ruleNumber || !title || !pdfUrl) {
      return
    }
    rules.push({
      ruleNumber,
      title,
      category: currentCategory,
      pdfUrl,
      pdfPath: null,
    })
  })

  return {
    title: heading,
    rules,
  }
}

async function downloadPdf(pdfUrl: string, destination: string) {
  if (await fileExists(destination)) {
    return
  }
  const response = await http.get<ArrayBuffer>(pdfUrl, { responseType: "arraybuffer" })
  await fs.writeFile(destination, Buffer.from(response.data))
}

async function processRuleSet(link: RuleSetLink) {
  const html = await fetchHtml(link.href)
  const { title, rules } = parseRuleList(html)
  const setDir = path.join(OUTPUT_ROOT, link.groupCode)
  await ensureDir(setDir)
  const pdfDir = path.join(PDF_ROOT, link.groupCode, link.setCode)
  await ensureDir(pdfDir)

  for (const rule of rules) {
    const fileName = path.basename(new URL(rule.pdfUrl).pathname)
    const pdfPath = path.join(pdfDir, fileName)
    try {
      await downloadPdf(rule.pdfUrl, pdfPath)
      rule.pdfPath = path.relative(process.cwd(), pdfPath)
    } catch (error) {
      console.error(`Failed to download PDF ${rule.pdfUrl}`, error)
      rule.pdfPath = null
    }
    await delay(REQUEST_DELAY_MS)
  }

  const document: RuleSetDocument = {
    fetchedAt: new Date().toISOString(),
    groupCode: link.groupCode,
    groupName: link.groupName,
    setCode: link.setCode,
    setAbbreviation: link.setAbbreviation,
    setName: title || link.setName,
    sourceUrl: link.href,
    rules,
  }

  const outputPath = path.join(setDir, `${link.setCode}.json`)
  await fs.writeFile(outputPath, JSON.stringify(document, null, 2))
  console.log(`Saved ${link.groupCode}/${link.setCode} (${rules.length} rules)`)
}

async function main() {
  await ensureDir(OUTPUT_ROOT)
  await ensureDir(PDF_ROOT)

  console.log("Fetching rule groups…")
  const homeHtml = await fetchHtml(`${RULES_BASE}?fa=court_rules.home`)
  const groups = extractGroups(homeHtml)

  if (!groups.length) {
    throw new Error("Unable to locate court rule groups.")
  }

  console.log(`Discovered ${groups.length} rule groups`)
  const ruleSets: RuleSetLink[] = []

  for (const group of groups) {
    console.log(`Loading group ${group.code} (${group.name})`)
    try {
      const groupHtml = await fetchHtml(group.href)
      const sets = extractRuleSets(groupHtml, group)
      console.log(`  Found ${sets.length} rule sets`)
      ruleSets.push(...sets)
    } catch (error) {
      console.error(`Failed to load group ${group.code}`, error)
    }
    await delay(REQUEST_DELAY_MS)
  }

  if (!ruleSets.length) {
    console.warn("No rule sets discovered. Exiting.")
    return
  }

  for (const ruleSet of ruleSets) {
    try {
      await processRuleSet(ruleSet)
    } catch (error) {
      console.error(`Failed to process set ${ruleSet.setCode} (${ruleSet.groupCode})`, error)
    }
    await delay(REQUEST_DELAY_MS)
  }

  const indexPath = path.join(OUTPUT_ROOT, "index.json")
  const indexPayload = {
    fetchedAt: new Date().toISOString(),
    groups: ruleSets.reduce<Record<string, { groupName: string; sets: string[] }>>((acc, set) => {
      if (!acc[set.groupCode]) {
        acc[set.groupCode] = {
          groupName: set.groupName,
          sets: [],
        }
      }
      acc[set.groupCode].sets.push(set.setCode)
      return acc
    }, {}),
  }
  await fs.writeFile(indexPath, JSON.stringify(indexPayload, null, 2))
  console.log("Court rules scrape completed.")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
