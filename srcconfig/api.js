// src/config/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Replace the value below with your deployed Google Apps Script Web App URL.
// Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone
// ─────────────────────────────────────────────────────────────────────────────
export const API_URL = 'https://script.google.com/macros/s/AKfycbwrzHOiN5Bl--QF_UWlSekmv5x_iA75sb2RkkgnNoVHhDka7KfgPUpFZRlvU1N55dE/exec';

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
