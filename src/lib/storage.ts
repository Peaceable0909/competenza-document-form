const KEY = "competenza_apps_script_url";

export function getScriptUrl(): string {
  return localStorage.getItem(KEY) ?? "";
}

export function setScriptUrl(url: string) {
  localStorage.setItem(KEY, url.trim());
}
