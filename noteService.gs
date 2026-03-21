// services/noteService.gs
// CRUD operations for notes — orchestrates Drive + Sheets

/**
 * Returns all notes from NOTES sheet, optionally filtered.
 * Filters: { project, tag, search }
 */
function getNotes(filters) {
  const cacheKey = CONFIG.CACHE_KEYS.NOTES_LIST;
  let notes = Cache.get(cacheKey);

  if (!notes) {
    const sheet = getSheet(CONFIG.SHEETS.NOTES);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) { notes = []; }
    else {
      const headers = CONFIG.SHEET_HEADERS.NOTES;
      notes = data.slice(1).map(row => rowToObject(headers, row));
    }
    Cache.set(cacheKey, notes);
  }

  if (!filters) return notes;

  let result = notes;

  // Filter by project
  if (filters.project) {
    const npSheet = getSheet(CONFIG.SHEETS.NOTE_PROJECT);
    const npData = npSheet.getDataRange().getValues().slice(1);
    const projSheet = getSheet(CONFIG.SHEETS.PROJECTS);
    const projData = projSheet.getDataRange().getValues().slice(1);
    const proj = projData.find(r => r[1].toString().toLowerCase() === filters.project.toLowerCase());
    if (!proj) return [];
    const projectId = proj[0];
    const noteIds = new Set(npData.filter(r => r[1] === projectId).map(r => r[0]));
    result = result.filter(n => noteIds.has(n.id));
  }

  // Filter by tag
  if (filters.tag) {
    const ntSheet = getSheet(CONFIG.SHEETS.NOTE_TAG);
    const ntData = ntSheet.getDataRange().getValues().slice(1);
    const tagSheet = getSheet(CONFIG.SHEETS.TAGS);
    const tagData = tagSheet.getDataRange().getValues().slice(1);
    const tag = tagData.find(r => r[1].toString().toLowerCase() === filters.tag.toLowerCase());
    if (!tag) return [];
    const tagId = tag[0];
    const noteIds = new Set(ntData.filter(r => r[1] === tagId).map(r => r[0]));
    result = result.filter(n => noteIds.has(n.id));
  }

  // Filter by search term
  if (filters.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(n =>
      n.title.toLowerCase().includes(term) ||
      n.content_index.toLowerCase().includes(term)
    );
  }

  // Strip heavy fields from list view
  return result.map(n => {
    const { content_raw, ...rest } = n;
    return rest;
  });
}

/**
 * Returns a single note by ID, including full content and relations.
 */
function getNoteById(noteId) {
  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  const data = sheet.getDataRange().getValues();
  const headers = CONFIG.SHEET_HEADERS.NOTES;

  const row = data.slice(1).find(r => r[0] === noteId);
  if (!row) return null;

  const note = rowToObject(headers, row);
  note.tags = getNoteTagNames(noteId);
  note.projects = getNoteProjectNames(noteId);
  note.backlinks = getBacklinksForNote(noteId);

  return note;
}

/**
 * Creates a new note: writes to Drive, updates all relevant sheets.
 */
function createNote(data) {
  const validation = validateNotePayload(data);
  if (!validation.valid) throw new Error(validation.errors.join('; '));

  const id = generateId();
  const now = formatDate(new Date());
  const title = sanitizeString(data.title);
  const content = data.content || '';
  const tags = Array.isArray(data.tags) ? data.tags.map(sanitizeString) : [];
  const projects = Array.isArray(data.projects) ? data.projects.map(sanitizeString) : [];

  const frontmatter = {
    title,
    tags: tags.join(', '),
    projects: projects.join(', '),
    created: now,
    updated: now
  };
  const markdown = serializeMarkdown(frontmatter, content);
  const { fileId, filePath } = createNoteFile(title, markdown);
  const contentIndex = buildContentIndex(content);

  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  sheet.appendRow(objectToRow(CONFIG.SHEET_HEADERS.NOTES, {
    id, title, file_path: filePath, drive_id: fileId,
    content_raw: markdown, content_index: contentIndex,
    created: now, updated: now
  }));

  _upsertNoteTags(id, tags);
  _upsertNoteProjects(id, projects);
  _updateBacklinks(id, extractBacklinks(content));

  Cache.invalidateNotes();
  return getNoteById(id);
}

/**
 * Updates an existing note by ID.
 */
function updateNote(noteId, data) {
  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  const allData = sheet.getDataRange().getValues();
  const headers = CONFIG.SHEET_HEADERS.NOTES;

  const rowIndex = allData.findIndex((r, i) => i > 0 && r[0] === noteId);
  if (rowIndex === -1) return null;

  const existing = rowToObject(headers, allData[rowIndex]);
  const now = formatDate(new Date());

  const title = data.title ? sanitizeString(data.title) : existing.title;
  const content = data.content !== undefined ? data.content : existing.content_raw;
  const tags = Array.isArray(data.tags) ? data.tags.map(sanitizeString) : getNoteTagNames(noteId);
  const projects = Array.isArray(data.projects) ? data.projects.map(sanitizeString) : getNoteProjectNames(noteId);

  const { frontmatter: existingFm } = parseMarkdown(existing.content_raw);
  const frontmatter = { ...existingFm, title, tags: tags.join(', '), projects: projects.join(', '), updated: now };
  const markdown = serializeMarkdown(frontmatter, content);

  updateNoteFile(existing.drive_id, markdown);

  const contentIndex = buildContentIndex(content);
  const updatedRow = objectToRow(headers, { ...existing, title, content_raw: markdown, content_index: contentIndex, updated: now });
  sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);

  _clearNoteRelations(noteId);
  _upsertNoteTags(noteId, tags);
  _upsertNoteProjects(noteId, projects);
  _updateBacklinks(noteId, extractBacklinks(content));

  Cache.invalidateNotes();
  return getNoteById(noteId);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function getNoteTagNames(noteId) {
  const ntSheet = getSheet(CONFIG.SHEETS.NOTE_TAG);
  const ntData = ntSheet.getDataRange().getValues().slice(1);
  const tagSheet = getSheet(CONFIG.SHEETS.TAGS);
  const tagData = tagSheet.getDataRange().getValues().slice(1);
  const tagMap = Object.fromEntries(tagData.map(r => [r[0], r[1]]));
  return ntData.filter(r => r[0] === noteId).map(r => tagMap[r[1]] || '').filter(Boolean);
}

function getNoteProjectNames(noteId) {
  const npSheet = getSheet(CONFIG.SHEETS.NOTE_PROJECT);
  const npData = npSheet.getDataRange().getValues().slice(1);
  const projSheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const projData = projSheet.getDataRange().getValues().slice(1);
  const projMap = Object.fromEntries(projData.map(r => [r[0], r[1]]));
  return npData.filter(r => r[0] === noteId).map(r => projMap[r[1]] || '').filter(Boolean);
}

function getBacklinksForNote(noteId) {
  const blSheet = getSheet(CONFIG.SHEETS.BACKLINKS);
  const blData = blSheet.getDataRange().getValues().slice(1);
  return blData.filter(r => r[1] === noteId).map(r => r[0]);
}

function _getOrCreateTag(name) {
  const sheet = getSheet(CONFIG.SHEETS.TAGS);
  const data = sheet.getDataRange().getValues();
  const existing = data.slice(1).find(r => r[1].toString().toLowerCase() === name.toLowerCase());
  if (existing) return existing[0];
  const id = generateId();
  sheet.appendRow([id, name]);
  Cache.invalidateTags();
  return id;
}

function _getOrCreateProject(name) {
  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  const existing = data.slice(1).find(r => r[1].toString().toLowerCase() === name.toLowerCase());
  if (existing) return existing[0];
  const id = generateId();
  const now = formatDate(new Date());
  sheet.appendRow(objectToRow(CONFIG.SHEET_HEADERS.PROJECTS, {
    id, name, description: '', status: 'active', priority: 'medium', created: now
  }));
  Cache.invalidateProjects();
  return id;
}

function _upsertNoteTags(noteId, tagNames) {
  const ntSheet = getSheet(CONFIG.SHEETS.NOTE_TAG);
  for (const name of tagNames) {
    if (!name) continue;
    const tagId = _getOrCreateTag(name);
    ntSheet.appendRow([noteId, tagId]);
  }
}

function _upsertNoteProjects(noteId, projectNames) {
  const npSheet = getSheet(CONFIG.SHEETS.NOTE_PROJECT);
  for (const name of projectNames) {
    if (!name) continue;
    const projId = _getOrCreateProject(name);
    npSheet.appendRow([noteId, projId]);
  }
}

function _clearNoteRelations(noteId) {
  _deleteRowsWhere(CONFIG.SHEETS.NOTE_TAG, row => row[0] === noteId);
  _deleteRowsWhere(CONFIG.SHEETS.NOTE_PROJECT, row => row[0] === noteId);
  _deleteRowsWhere(CONFIG.SHEETS.BACKLINKS, row => row[0] === noteId);
}

function _updateBacklinks(sourceNoteId, linkedTitles) {
  if (!linkedTitles || linkedTitles.length === 0) return;
  const blSheet = getSheet(CONFIG.SHEETS.BACKLINKS);
  const notesData = getSheet(CONFIG.SHEETS.NOTES).getDataRange().getValues().slice(1);
  for (const title of linkedTitles) {
    const target = notesData.find(r => r[1].toString().toLowerCase() === title.toLowerCase());
    if (target) blSheet.appendRow([sourceNoteId, target[0]]);
  }
}

function _deleteRowsWhere(sheetName, predicate) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (predicate(data[i])) sheet.deleteRow(i + 1);
  }
}
