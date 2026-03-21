// services/tagService.gs
// Tag listing and management

/**
 * Returns all tags from TAGS sheet, with note counts.
 */
function getTags() {
  const cached = Cache.get(CONFIG.CACHE_KEYS.TAGS_LIST);
  if (cached) return cached;

  const sheet = getSheet(CONFIG.SHEETS.TAGS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Cache.set(CONFIG.CACHE_KEYS.TAGS_LIST, []);
    return [];
  }

  const noteTagData = getSheet(CONFIG.SHEETS.NOTE_TAG).getDataRange().getValues().slice(1);
  const tags = data.slice(1).map(row => {
    const tag = rowToObject(CONFIG.SHEET_HEADERS.TAGS, row);
    tag.noteCount = noteTagData.filter(r => r[1] === tag.id).length;
    return tag;
  });

  Cache.set(CONFIG.CACHE_KEYS.TAGS_LIST, tags);
  return tags;
}

/**
 * Creates a tag if it doesn't already exist. Returns the tag object.
 */
function createTag(name) {
  const cleanName = sanitizeString(name);
  if (!cleanName) throw new Error('Tag name is required');

  const sheet = getSheet(CONFIG.SHEETS.TAGS);
  const data = sheet.getDataRange().getValues().slice(1);
  const existing = data.find(r => r[1].toString().toLowerCase() === cleanName.toLowerCase());
  if (existing) return rowToObject(CONFIG.SHEET_HEADERS.TAGS, existing);

  const id = generateId();
  sheet.appendRow([id, cleanName]);
  Cache.invalidateTags();
  return { id, name: cleanName };
}

/**
 * Returns notes that have a specific tag ID.
 */
function getNotesByTag(tagId) {
  const ntData = getSheet(CONFIG.SHEETS.NOTE_TAG).getDataRange().getValues().slice(1);
  const noteIds = new Set(ntData.filter(r => r[1] === tagId).map(r => r[0]));
  const notesData = getSheet(CONFIG.SHEETS.NOTES).getDataRange().getValues().slice(1);
  return notesData
    .filter(r => noteIds.has(r[0]))
    .map(row => {
      const n = rowToObject(CONFIG.SHEET_HEADERS.NOTES, row);
      delete n.content_raw;
      return n;
    });
}
