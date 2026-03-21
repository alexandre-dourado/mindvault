// services/syncService.gs
// Drive → Sheets sync engine

/**
 * Main sync entry point — called by time-driven trigger or manually via API.
 * Detects new/updated files and syncs them into the Sheets data model.
 */
function syncFromDrive() {
  const start = Date.now();
  const report = { created: 0, updated: 0, errors: [], skipped: 0 };

  try {
    const driveFiles = listNotesFromDrive();
    const notesSheet = getSheet(CONFIG.SHEETS.NOTES);
    const existingNotes = notesSheet.getDataRange().getValues().slice(1);
    const driveIdIdx = CONFIG.SHEET_HEADERS.NOTES.indexOf('drive_id');
    const updatedIdx = CONFIG.SHEET_HEADERS.NOTES.indexOf('updated');

    // Build lookup: driveId → { rowIndex, updatedDate }
    const driveIdMap = {};
    existingNotes.forEach((row, i) => {
      driveIdMap[row[driveIdIdx]] = { rowIndex: i + 2, updatedDate: new Date(row[updatedIdx]) };
    });

    for (const file of driveFiles) {
      try {
        const existing = driveIdMap[file.id];
        if (!existing) {
          _ingestNewDriveFile(file);
          report.created++;
        } else if (file.dateUpdated > existing.updatedDate) {
          _reingestUpdatedFile(file, existing.rowIndex);
          report.updated++;
        } else {
          report.skipped++;
        }
      } catch (fileErr) {
        report.errors.push({ file: file.name, error: fileErr.message });
        logMetrics('sync_file_error', 0, 'error', `${file.name}: ${fileErr.message}`);
      }
    }

    Cache.invalidateNotes();
    logMetrics('sync_from_drive', Date.now() - start, 'success');
    return report;
  } catch (e) {
    logMetrics('sync_from_drive', Date.now() - start, 'error', e.message);
    throw e;
  }
}

/**
 * Ingests a brand-new Drive file into the data model.
 */
function _ingestNewDriveFile(file) {
  const raw = readNoteFile(file.id);
  const { frontmatter, content } = parseMarkdown(raw);

  const id = generateId();
  const title = frontmatter.title || file.name.replace(/\.(md|txt|html)$/i, '');
  const tags = _parseFrontmatterList(frontmatter.tags);
  const projects = _parseFrontmatterList(frontmatter.projects);
  const created = frontmatter.created || formatDate(file.dateCreated);
  const updated = frontmatter.updated || formatDate(file.dateUpdated);
  const contentIndex = buildContentIndex(content);
  const filePath = `${CONFIG.FOLDERS.ROOT}/${CONFIG.FOLDERS.NOTES}/${file.name}`;

  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  sheet.appendRow(objectToRow(CONFIG.SHEET_HEADERS.NOTES, {
    id, title, file_path: filePath, drive_id: file.id,
    content_raw: raw, content_index: contentIndex,
    created, updated
  }));

  _upsertNoteTags(id, tags);
  _upsertNoteProjects(id, projects);
  _updateBacklinks(id, extractBacklinks(content));
}

/**
 * Re-ingests a Drive file that has been updated since last sync.
 */
function _reingestUpdatedFile(file, sheetRowIndex) {
  const raw = readNoteFile(file.id);
  const { frontmatter, content } = parseMarkdown(raw);
  const contentIndex = buildContentIndex(content);
  const updated = frontmatter.updated || formatDate(file.dateUpdated);

  const sheet = getSheet(CONFIG.SHEETS.NOTES);
  const row = sheet.getRange(sheetRowIndex, 1, 1, CONFIG.SHEET_HEADERS.NOTES.length).getValues()[0];
  const existing = rowToObject(CONFIG.SHEET_HEADERS.NOTES, row);

  const title = frontmatter.title || existing.title;
  const tags = _parseFrontmatterList(frontmatter.tags);
  const projects = _parseFrontmatterList(frontmatter.projects);

  const updatedRow = objectToRow(CONFIG.SHEET_HEADERS.NOTES, {
    ...existing, title, content_raw: raw, content_index: contentIndex, updated
  });
  sheet.getRange(sheetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

  _clearNoteRelations(existing.id);
  _upsertNoteTags(existing.id, tags);
  _upsertNoteProjects(existing.id, projects);
  _updateBacklinks(existing.id, extractBacklinks(content));
}

/**
 * Parses a frontmatter field value into an array of strings.
 */
function _parseFrontmatterList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(sanitizeString).filter(Boolean);
  return String(value).split(',').map(sanitizeString).filter(Boolean);
}

/**
 * Installs the 10-minute time-driven trigger for sync.
 * Safe to call multiple times — avoids duplicates.
 */
function installSyncTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const alreadyExists = triggers.some(t =>
    t.getHandlerFunction() === 'syncFromDrive' &&
    t.getTriggerSource() === ScriptApp.TriggerSource.CLOCK
  );
  if (alreadyExists) return;
  ScriptApp.newTrigger('syncFromDrive')
    .timeBased()
    .everyMinutes(CONFIG.SYNC_INTERVAL_MINUTES)
    .create();
}
