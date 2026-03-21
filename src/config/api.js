// src/config/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Option A (recommended): set VITE_GAS_URL in a .env.local file (never commit it)
// Option B: replace the fallback string below directly
// Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone
// ─────────────────────────────────────────────────────────────────────────────
export const API_URL =
  import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbwv4_cnhLrDgpSYRtMCFbQ_ITNsICUdxQkiR8IfXjOqtf2CpGefRgX_81YQOElUvZI/exec';

export const API_TIMEOUT = 15000; // ms

/** Builds a full API URL with query parameters appended. */
export function buildUrl(route, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('route', route);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Max retry attempts for failed requests. */
export const MAX_RETRIES = 2;

/** Delay between retries in ms (exponential: attempt * RETRY_BASE_DELAY). */
export const RETRY_BASE_DELAY = 800;
