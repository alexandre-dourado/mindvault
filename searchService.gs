// services/searchService.gs
// Full-text search across notes, titles, tags, and project names

/**
 * Performs a full-text search across title, content_index, tags, and projects.
 * Results are ranked by match score.
 */
function searchNotes(query) {
  if (!query || query.trim().length === 0) return [];

  const cleanQuery = sanitizeQuery(query.toLowerCase());
  const cacheKey = `${CONFIG.CACHE_KEYS.SEARCH_PREFIX}${cleanQuery}`;

  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  const notesData = getSheet(CONFIG.SHEETS.NOTES).getDataRange().getValues().slice(1);
  const headers = CONFIG.SHEET_HEADERS.NOTES;

  const noteTagMap = _buildNoteTagMap();
  const noteProjMap = _buildNoteProjMap();

  const terms = cleanQuery.split(/\s+/).filter(Boolean);
  const results = [];

  for (const row of notesData) {
    const note = rowToObject(headers, row);
    const tagStr = (noteTagMap[note.id] || []).join(' ').toLowerCase();
    const projStr = (noteProjMap[note.id] || []).join(' ').toLowerCase();
    const haystack = [
      note.title.toLowerCase(),
      note.content_index.toLowerCase(),
      tagStr,
      projStr
    ].join(' ');

    let score = 0;
    for (const term of terms) {
      const matches = haystack.split(term).length - 1;
      score += matches;
      // Title matches are weighted higher
      if (note.title.toLowerCase().includes(term)) score += 3;
    }

    if (score > 0) {
      const { content_raw, content_index, ...rest } = note;
      results.push({
        ...rest,
        tags: noteTagMap[note.id] || [],
        projects: noteProjMap[note.id] || [],
        score
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const finalResults = results.map(({ score, ...r }) => r);

  Cache.set(cacheKey, finalResults);
  return finalResults;
}

function _buildNoteTagMap() {
  const ntData = getSheet(CONFIG.SHEETS.NOTE_TAG).getDataRange().getValues().slice(1);
  const tagData = getSheet(CONFIG.SHEETS.TAGS).getDataRange().getValues().slice(1);
  const tagMap = Object.fromEntries(tagData.map(r => [r[0], r[1]]));
  const result = {};
  for (const [noteId, tagId] of ntData) {
    if (!result[noteId]) result[noteId] = [];
    if (tagMap[tagId]) result[noteId].push(tagMap[tagId]);
  }
  return result;
}

function _buildNoteProjMap() {
  const npData = getSheet(CONFIG.SHEETS.NOTE_PROJECT).getDataRange().getValues().slice(1);
  const projData = getSheet(CONFIG.SHEETS.PROJECTS).getDataRange().getValues().slice(1);
  const projMap = Object.fromEntries(projData.map(r => [r[0], r[1]]));
  const result = {};
  for (const [noteId, projId] of npData) {
    if (!result[noteId]) result[noteId] = [];
    if (projMap[projId]) result[noteId].push(projMap[projId]);
  }
  return result;
}
