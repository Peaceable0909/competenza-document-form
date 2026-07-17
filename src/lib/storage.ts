const KEY = "competenza_apps_script_url";

/** Baked in at build time (Vercel env var) — this is how the live site is configured. */
const BUILD_TIME_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? "";

export function getScriptUrl(): string {
  return BUILD_TIME_URL || localStorage.getItem(KEY) || "";
}

export function setScriptUrl(url: string) {
  localStorage.setItem(KEY, url.trim());
}
