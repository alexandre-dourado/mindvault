// src/services/notesService.js
import { apiGet, apiPost } from './apiClient.js';

/**
 * Fetches all notes, optionally filtered.
 * @param {{ project?: string, tag?: string, search?: string }} filters
 */
export async function fetchNotes(filters = {}) {
  return apiGet('notes', filters);
}

/**
 * Fetches a single note by ID with full content and relations.
 */
export async function fetchNoteById(id) {
  return apiGet(`notes/${id}`);
}

/**
 * Creates a new note.
 * @param {{ title: string, content: string, tags: string[], projects: string[] }} data
 */
export async function createNote(data) {
  return apiPost('notes', data);
}

/**
 * Updates an existing note.
 * @param {string} id
 * @param {{ title?: string, content?: string, tags?: string[], projects?: string[] }} data
 */
export async function updateNote(id, data) {
  return apiPost(`notes/${id}`, data);
}

/**
 * Triggers a manual sync from Drive.
 */
export async function triggerSync() {
  return apiPost('sync');
}
