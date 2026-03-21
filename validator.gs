// utils/validator.gs
// Input validation and sanitization utilities

/**
 * Validates and sanitizes a note creation/update payload.
 * @returns {{ valid: boolean, errors: string[], sanitized: Object }}
 */
function validateNoteInput(data) {
  const errors = [];
  if (!data) return { valid: false, errors: ['No data provided'], sanitized: {} };

  const sanitized = {};

  // Title: required, max 255 chars
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title is required');
  } else {
    sanitized.title = data.title.trim().substring(0, 255);
  }

  // Content: optional string
  sanitized.content = typeof data.content === 'string' ? data.content : '';

  // Tags: optional array or comma-separated string
  if (data.tags) {
    if (Array.isArray(data.tags)) {
      sanitized.tags = data.tags.map(t => sanitizeTag(t)).filter(Boolean);
    } else if (typeof data.tags === 'string') {
      sanitized.tags = data.tags.split(',').map(t => sanitizeTag(t)).filter(Boolean);
    }
  } else {
    sanitized.tags = [];
  }

  // Projects: optional array or string
  if (data.projects) {
    if (Array.isArray(data.projects)) {
      sanitized.projects = data.projects.map(p => String(p).trim()).filter(Boolean);
    } else if (typeof data.projects === 'string') {
      sanitized.projects = data.projects.split(',').map(p => p.trim()).filter(Boolean);
    }
  } else {
    sanitized.projects = [];
  }

  return { valid: errors.length === 0, errors, sanitized };
}

/**
 * Validates project creation/update payload.
 */
function validateProjectInput(data) {
  const errors = [];
  if (!data) return { valid: false, errors: ['No data provided'], sanitized: {} };

  const sanitized = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('name is required');
  } else {
    sanitized.name = data.name.trim().substring(0, 100);
  }

  sanitized.description = typeof data.description === 'string'
    ? data.description.trim().substring(0, 1000)
    : '';

  sanitized.status = CONFIG.PROJECT_STATUSES.includes(data.status)
    ? data.status
    : 'active';

  sanitized.priority = CONFIG.PROJECT_PRIORITIES.includes(data.priority)
    ? data.priority
    : 'medium';

  return { valid: errors.length === 0, errors, sanitized };
}

/**
 * Validates tag creation payload.
 */
function validateTagInput(data) {
  const errors = [];
  if (!data || !data.name) {
    return { valid: false, errors: ['name is required'], sanitized: {} };
  }

  const name = sanitizeTag(data.name);
  if (!name) errors.push('tag name is invalid');

  return { valid: errors.length === 0, errors, sanitized: { name } };
}

/**
 * Sanitizes a tag name: lowercase, alphanumeric + hyphens, max 50 chars.
 */
function sanitizeTag(tag) {
  if (typeof tag !== 'string') return '';
  return tag.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').substring(0, 50);
}

/**
 * Validates a search query string.
 * @returns {{ valid: boolean, sanitized: string }}
 */
function validateSearchQuery(q) {
  if (!q || typeof q !== 'string') return { valid: false, sanitized: '' };
  const sanitized = q.trim().substring(0, 200);
  return { valid: sanitized.length >= 1, sanitized };
}

/**
 * Checks if a string is a valid ISO date (YYYY-MM-DD).
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

/**
 * Sanitizes a string to prevent formula injection in Sheets.
 */
function sanitizeSheetValue(value) {
  if (typeof value !== 'string') return value;
  // Strip leading = + - @ which could be treated as formulas
  return value.replace(/^[=+\-@]/, "'$&");
}

/**
 * Validates that a note ID exists in the NOTES sheet.
 * Returns the row data or null.
 */
function findNoteById(id) {
  if (!id) return null;
  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

/**
 * Validates that a project ID exists in the PROJECTS sheet.
 */
function findProjectById(id) {
  if (!id) return null;
  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

/**
 * Validates that a tag ID exists in the TAGS sheet.
 */
function findTagById(id) {
  if (!id) return null;
  const sheet = getSheet(CONFIG.SHEETS.TAGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

/**
 * Finds a tag by name (case-insensitive).
 */
function findTagByName(name) {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  const sheet = getSheet(CONFIG.SHEETS.TAGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === normalized) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

/**
 * Finds a project by name (case-insensitive).
 */
function findProjectByName(name) {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === normalized) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}
