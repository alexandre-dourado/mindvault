// core/consistency.gs
// Data validation and consistency repair functions

/**
 * Validates system integrity: detects broken links, missing fields, orphaned relations.
 * Returns a detailed report without making any changes.
 */
function validateSystem() {
  const start = Date.now();
  const report = { notes: [], projects: [], tags: [], relations: [], backlinks: [] };

  try {
    const notesData = getSheet(CONFIG.SHEETS.NOTES).getDataRange().getValues().slice(1);
    const noteHeaders = CONFIG.SHEET_HEADERS.NOTES;
    const noteIds = new Set(notesData.map(r => r[0]));

    // Validate notes
    for (const row of notesData) {
      const note = rowToObject(noteHeaders, row);
      const issues = [];
      if (!note.id) issues.push('missing id');
      if (!note.title) issues.push('missing title');
      if (!note.drive_id) issues.push('missing drive_id');
      if (!note.created) issues.push('missing created date');
      if (!note.updated) issues.push('missing updated date');
      if (note.created && !/^\d{4}-\d{2}-\d{2}/.test(note.created)) {
        issues.push(`invalid created date: ${note.created}`);
      }
      if (note.drive_id) {
        try { DriveApp.getFileById(note.drive_id); }
        catch (_) { issues.push(`Drive file not found: ${note.drive_id}`); }
      }
      if (issues.length > 0) report.notes.push({ id: note.id, title: note.title, issues });
    }

    // Validate NOTE_TAG relations
    const ntData = getSheet(CONFIG.SHEETS.NOTE_TAG).getDataRange().getValues().slice(1);
    const tagIds = new Set(getSheet(CONFIG.SHEETS.TAGS).getDataRange().getValues().slice(1).map(r => r[0]));
    for (const [noteId, tagId] of ntData) {
      if (!noteIds.has(noteId)) report.relations.push({ type: 'NOTE_TAG', issue: `orphaned note_id: ${noteId}` });
      if (!tagIds.has(tagId)) report.relations.push({ type: 'NOTE_TAG', issue: `orphaned tag_id: ${tagId}` });
    }

    // Validate NOTE_PROJECT relations
    const npData = getSheet(CONFIG.SHEETS.NOTE_PROJECT).getDataRange().getValues().slice(1);
    const projIds = new Set(getSheet(CONFIG.SHEETS.PROJECTS).getDataRange().getValues().slice(1).map(r => r[0]));
    for (const [noteId, projId] of npData) {
      if (!noteIds.has(noteId)) report.relations.push({ type: 'NOTE_PROJECT', issue: `orphaned note_id: ${noteId}` });
      if (!projIds.has(projId)) report.relations.push({ type: 'NOTE_PROJECT', issue: `orphaned proj_id: ${projId}` });
    }

    // Validate BACKLINKS
    const blData = getSheet(CONFIG.SHEETS.BACKLINKS).getDataRange().getValues().slice(1);
    for (const [srcId, tgtId] of blData) {
      if (!noteIds.has(srcId)) report.backlinks.push({ issue: `orphaned source: ${srcId}` });
      if (!noteIds.has(tgtId)) report.backlinks.push({ issue: `orphaned target: ${tgtId}` });
    }

    logMetrics('validate_system', Date.now() - start, 'success');
    return report;
  } catch (e) {
    logMetrics('validate_system', Date.now() - start, 'error', e.message);
    throw e;
  }
}

/**
 * Fixes known consistency issues:
 * - Removes orphaned relation rows
 * - Fixes date format mismatches
 * - Removes duplicate relation entries
 */
function fixConsistency() {
  const start = Date.now();
  const fixed = { relations: 0, dates: 0, duplicates: 0 };

  try {
    const noteIds = new Set(
      getSheet(CONFIG.SHEETS.NOTES).getDataRange().getValues().slice(1).map(r => r[0])
    );
    const tagIds = new Set(
      getSheet(CONFIG.SHEETS.TAGS).getDataRange().getValues().slice(1).map(r => r[0])
    );
    const projIds = new Set(
      getSheet(CONFIG.SHEETS.PROJECTS).getDataRange().getValues().slice(1).map(r => r[0])
    );

    fixed.relations += _removeOrphanedRows(CONFIG.SHEETS.NOTE_TAG, row =>
      noteIds.has(row[0]) && tagIds.has(row[1])
    );
    fixed.relations += _removeOrphanedRows(CONFIG.SHEETS.NOTE_PROJECT, row =>
      noteIds.has(row[0]) && projIds.has(row[1])
    );
    fixed.relations += _removeOrphanedRows(CONFIG.SHEETS.BACKLINKS, row =>
      noteIds.has(row[0]) && noteIds.has(row[1])
    );

    fixed.duplicates += _deduplicateSheet(CONFIG.SHEETS.NOTE_TAG);
    fixed.duplicates += _deduplicateSheet(CONFIG.SHEETS.NOTE_PROJECT);
    fixed.duplicates += _deduplicateSheet(CONFIG.SHEETS.BACKLINKS);

    // Fix note date formats
    const notesSheet = getSheet(CONFIG.SHEETS.NOTES);
    const notesData = notesSheet.getDataRange().getValues();
    const createdIdx = CONFIG.SHEET_HEADERS.NOTES.indexOf('created');
    const updatedIdx = CONFIG.SHEET_HEADERS.NOTES.indexOf('updated');

    for (let i = 1; i < notesData.length; i++) {
      const row = notesData[i];
      const created = _normalizeDate(row[createdIdx]);
      const updated = _normalizeDate(row[updatedIdx]) || created;

      if (created !== row[createdIdx] || updated !== row[updatedIdx]) {
        notesSheet.getRange(i + 1, createdIdx + 1).setValue(created);
        notesSheet.getRange(i + 1, updatedIdx + 1).setValue(updated);
        fixed.dates++;
      }
    }

    Cache.invalidateNotes();
    Cache.invalidateProjects();
    Cache.invalidateTags();

    logMetrics('fix_consistency', Date.now() - start, 'success');
    return fixed;
  } catch (e) {
    logMetrics('fix_consistency', Date.now() - start, 'error', e.message);
    throw e;
  }
}

/** Removes rows that don't pass the validity check. Returns count removed. */
function _removeOrphanedRows(sheetName, isValid) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  let removed = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (!isValid(data[i])) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  return removed;
}

/** Removes duplicate rows (identical all-column values). Returns count removed. */
function _deduplicateSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const seen = new Set();
  let removed = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const key = data[i].join('||');
    if (seen.has(key)) {
      sheet.deleteRow(i + 1);
      removed++;
    } else {
      seen.add(key);
    }
  }
  return removed;
}

/** Normalizes a date value to YYYY-MM-DD string. */
function _normalizeDate(value) {
  if (!value) return formatDate(new Date());
  if (value instanceof Date) return formatDate(value);
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatDate(parsed);
  return formatDate(new Date());
}
