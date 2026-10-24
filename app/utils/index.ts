export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(date);
}

export function formatTime(total: number) {
  // in seconds
  const parts = [];
  const days = Math.floor(total / 86400);
  if (days > 0) parts.push(String(days));
  total %= 86400;
  const hours = Math.floor(total / 3600);
  if (hours > 0 || parts.length > 0) parts.push(String(hours).padStart(2, "0"));
  total %= 3600;
  const minutes = Math.floor(total / 60);
  parts.push(String(minutes).padStart(2, "0"));
  const seconds = total % 60;
  parts.push(String(seconds).padStart(2, "0"));
  return parts.join(":");
}

/**
 * Converts a URL string or URL object to a safe URL if it uses the http or https protocol.
 * @returns A safe URL string if the input is a valid http(s) URL, otherwise null.
 * @param value The URL string or URL object to be converted to a safe URL.
 */
export function toSafeHTTPUrl(value: string | URL | undefined): string | null {
  if (!value) return null;
  try {
    const url = value instanceof URL ? value : new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function feetStringToCm(feetString: string): number {
  const parts = feetString.split("'");
  if (parts.length !== 2) {
    throw new Error("Invalid feet string format");
  }
  const feet = parseInt(parts[0] || "0", 10);
  const inches = parseInt((parts[1] || "0").replace('"', ""), 10);
  return Math.round((feet * 12 + inches) * 2.54);
}

// This is terrible and uses the deprecated `document.execCommand`,
// but it's the best way to insert plain text into a contenteditable element
export function insertPlainText(text: string) {
  document.execCommand("insertText", false, text);
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}
