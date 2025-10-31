import axios from "axios"
import * as cheerio from "cheerio"
import AdmZip from "adm-zip"
import fs from "node:fs/promises"
import path from "node:path"
import { pipeline } from "node:stream/promises"
import { createWriteStream } from "node:fs"
import { Readable } from "node:stream"
import { constants as fsConstants } from "node:fs"

const DOWNLOAD_PAGE = "https://uscode.house.gov/download/download.shtml"
const BASE_URL = "https://uscode.house.gov/download/"
const OUTPUT_ROOT = path.join(process.cwd(), "data", "uscode")
const USER_AGENT = "life-ai-uscode-fetcher/1.0 (+https://life.ai)"
const SHOULD_EXTRACT = process.argv.includes("--extract")

type TitleDownload = {
  titleSlug: string
  href: string
  url: string
  description: string
}

type ReleaseInfo = {
  releasePath: string
  releaseLabel: string
  downloads: TitleDownload[]
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

function slugToPrettyTitle(slug: string) {
  if (slug === "uscAll") {
    return "AllTitles"
  }
  const match = slug.match(/^usc(\d{2})([a-z]*)$/i)
  if (!match) {
    return slug.replace(/\W+/g, "-")
  }
  const [, numberPart, suffix] = match
  const numberNormalized = numberPart.replace(/^0+/, "") || "0"
  if (!suffix) {
    return `Title${numberNormalized}`
  }
  return `Title${numberNormalized}-${suffix.toUpperCase()}`
}

function resolveUrl(relative: string) {
  return new URL(relative, BASE_URL).toString()
}

async function fetchReleaseInfo(): Promise<ReleaseInfo> {
  const response = await axios.get<string>(DOWNLOAD_PAGE, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  })
  const $ = cheerio.load(response.data)
  const anchor = $('a[href*="xml_uscAll"]').first()
  if (!anchor.length) {
    throw new Error("Unable to locate release information on download page.")
  }
  const href = anchor.attr("href") ?? ""
  const pathMatch = href.match(/^(releasepoints\/us\/pl\/\d+\/\d+)\//)
  const labelMatch = href.match(/@([\d-]+)\.zip$/)
  if (!pathMatch || !labelMatch) {
    throw new Error(`Unexpected release path format: ${href}`)
  }
  const releasePath = pathMatch[1]
  const releaseLabel = labelMatch[1]

  const downloads: TitleDownload[] = []
  $('a[href$=".zip"]').each((_, element) => {
    const link = $(element)
    const hrefValue = link.attr("href")
    if (!hrefValue || !hrefValue.includes(`${releasePath}/`)) {
      return
    }
    if (!hrefValue.includes("/xml_")) {
      return
    }
    const slugMatch = hrefValue.match(/xml_(usc[a-zA-Z0-9]+)@/)
    if (!slugMatch) {
      return
    }
    downloads.push({
      titleSlug: slugMatch[1],
      href: hrefValue,
      url: resolveUrl(hrefValue),
      description: link.attr("title") ?? slugMatch[1],
    })
  })

  if (!downloads.length) {
    throw new Error("No XML download links found.")
  }

  downloads.sort((a, b) => a.titleSlug.localeCompare(b.titleSlug))

  return {
    releasePath,
    releaseLabel,
    downloads,
  }
}

async function extractZip(zipPath: string, destination: string) {
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(destination, true)
}

async function downloadTitle(download: TitleDownload, destinationDir: string) {
  const response = await axios.get<Readable | ArrayBuffer>(download.url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
    responseType: "stream",
  })

  const zipPath = path.join(destinationDir, `${download.titleSlug}.zip`)
  await ensureDir(destinationDir)
  await pipeline(response.data as Readable, createWriteStream(zipPath))
  return zipPath
}

async function isValidZip(filePath: string) {
  try {
    const handle = await fs.open(filePath, fsConstants.O_RDONLY)
    const buffer = Buffer.alloc(4)
    await handle.read(buffer, 0, 4, 0)
    await handle.close()
    return buffer[0] === 0x50 && buffer[1] === 0x4b
  } catch {
    return false
  }
}

async function writeMetadata(releaseDir: string, release: ReleaseInfo) {
  const summaryPath = path.join(releaseDir, "release.json")
  const payload = {
    releaseLabel: release.releaseLabel,
    releasePath: release.releasePath,
    fetchedAt: new Date().toISOString(),
    downloads: release.downloads.map((download) => ({
      titleSlug: download.titleSlug,
      description: download.description,
      href: download.href,
    })),
    source: DOWNLOAD_PAGE,
  }
  await fs.writeFile(summaryPath, JSON.stringify(payload, null, 2))
}

async function main() {
  const release = await fetchReleaseInfo()
  const releaseDir = path.join(OUTPUT_ROOT, release.releaseLabel)
  const zipDir = path.join(releaseDir, "zip")
  await ensureDir(zipDir)

  for (const download of release.downloads) {
    const sentinelPath = path.join(zipDir, `${download.titleSlug}.complete.json`)
    if (await fileExists(sentinelPath)) {
      console.log(`Skipping ${download.titleSlug}, already downloaded.`)
      continue
    }

    const description = download.description || slugToPrettyTitle(download.titleSlug)
    console.log(`Fetching ${description} (${download.titleSlug})`)
    try {
      const zipPath = await downloadTitle(download, zipDir)
      const validZip = await isValidZip(zipPath)
      if (!validZip) {
        console.warn(`Skipping ${download.titleSlug}: download did not return a ZIP archive (likely not published).`)
        await fs.unlink(zipPath).catch(() => {
          /* ignore */
        })
        continue
      }
      if (SHOULD_EXTRACT) {
        const extractDir = path.join(releaseDir, slugToPrettyTitle(download.titleSlug))
        const sentinel = path.join(extractDir, ".complete")
        await ensureDir(extractDir)
        await extractZip(zipPath, extractDir)
        await fs.writeFile(sentinel, JSON.stringify({ source: download.url, fetchedAt: new Date().toISOString(), extracted: true }, null, 2))
      }
      await fs.writeFile(
        sentinelPath,
        JSON.stringify({ source: download.url, fetchedAt: new Date().toISOString(), extracted: SHOULD_EXTRACT }, null, 2)
      )
    } catch (error) {
      console.error(`Failed to fetch ${download.titleSlug}:`, (error as Error).message)
    }
  }

  await writeMetadata(releaseDir, release)
  console.log(`U.S. Code release ${release.releaseLabel} ready at ${releaseDir}`)
}

main().catch((error) => {
  console.error("U.S. Code fetch failed:", error)
  process.exitCode = 1
})
