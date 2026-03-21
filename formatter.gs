// utils/formatter.gs
// Response formatting and data transformation helpers

/**
 * Standard API success response envelope.
 */
function successResponse(data) {
  return { success: true, data: data !== undefined ? data : null };
}

/**
 * Standard API error response envelope.
 */
function errorResponse(message, details) {
  const resp = { success: false, error: message || 'Unknown error' };
  if (details !== undefined) resp.details = details;
  return resp;
}

/**
 * Converts a sheet row array into a named object using header definitions.
 */
function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = row[i] !== undefined && row[i] !== null ? row[i] : '';
  });
  return obj;
}

/**
 * Converts a named object into an ordered row array based on headers.
 */
function objectToRow(headers, obj) {
  return headers.map(h => (obj[h] !== undefined && obj[h] !== null ? obj[h] : ''));
}

/**
 * Formats a Date object to ISO 8601 date string YYYY-MM-DD.
 */
function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Generates a compact unique ID (timestamp + random hex).
 */
function generateId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${ts}_${rand}`;
}

/**
 * Builds a JSON ContentService response for GAS Web App endpoints.
 */
function buildJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
