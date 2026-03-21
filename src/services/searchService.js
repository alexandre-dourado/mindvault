// src/services/searchService.js
import { apiGet } from './apiClient.js';

/** Full-text search across all notes. */
export async function searchNotes(query) {
  if (!query || query.trim().length === 0) return { query, count: 0, results: [] };
  return apiGet('search', { q: query.trim() });
}

/** Fetches all tags. */
export async function fetchTags() {
  return apiGet('tags');
}

/** Fetches system metrics. */
export async function fetchMetrics(params = {}) {
  return apiGet('metrics', params);
}
