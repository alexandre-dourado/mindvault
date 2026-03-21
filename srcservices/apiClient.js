// src/services/apiClient.js
// Core fetch wrapper with timeout, retry, and structured error handling.

import { API_URL, API_TIMEOUT, MAX_RETRIES, RETRY_BASE_DELAY, buildUrl } from '../config/api.js';

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Sleep helper for retry delays. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Core fetch with timeout support.
 */
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new ApiError('Request timed out', 408);
    throw err;
  }
}

/**
 * GET request with retry logic.
 */
export async function apiGet(route, params = {}, retries = MAX_RETRIES) {
  const url = buildUrl(route, params);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      const json = await res.json();
      if (!json.success) throw new ApiError(json.error || 'Request failed', res.status, json.details);
      return json.data;
    } catch (err) {
      if (attempt === retries) throw err;
      if (err instanceof ApiError && err.status < 500) throw err; // Don't retry client errors
      await sleep(RETRY_BASE_DELAY * (attempt + 1));
    }
  }
}

/**
 * POST request with retry logic.
 */
export async function apiPost(route, body = {}, params = {}, retries = MAX_RETRIES) {
  const url = buildUrl(route, params);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new ApiError(json.error || 'Request failed', res.status, json.details);
      return json.data;
    } catch (err) {
      if (attempt === retries) throw err;
      if (err instanceof ApiError && err.status < 500) throw err;
      await sleep(RETRY_BASE_DELAY * (attempt + 1));
    }
  }
}

export { ApiError };
