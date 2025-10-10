export const DEFAULT_FOLDER_SLUG = "my-documents";
export const DEFAULT_FOLDER_LABEL = "My Documents";
export const DEFAULT_FOLDER_RELATIVE_PATH = `${DEFAULT_FOLDER_SLUG}/`;

export function sanitizePathSegment(segment: string) {
  return segment
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function pathToId(pathname: string) {
  const base64 = Buffer.from(pathname).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function idToPath(id: string) {
  const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

export function joinPath(...parts: string[]) {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/")
    .replace(/\/+$/g, "");
}

export function ensureTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}
