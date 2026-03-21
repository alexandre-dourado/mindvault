// config/config.gs
// Central configuration for MindVault PKM System

const CONFIG = {
  SPREADSHEET_NAME: 'MindVault_DB',
  DRIVE_ROOT_FOLDER: 'MindVault',
  CACHE_TTL: 900, // 15 minutes in seconds

  FOLDERS: {
    NOTES: 'notes',
    AI: 'ai',
    HTML: 'html',
    DRAFTS: 'drafts',
    ASSETS: 'assets',
  },

  SHEETS: {
    NOTES: 'NOTES',
    PROJECTS: 'PROJECTS',
    TAGS: 'TAGS',
    NOTE_PROJECT: 'NOTE_PROJECT',
    NOTE_TAG: 'NOTE_TAG',
    BACKLINKS: 'BACKLINKS',
    METRICS: 'METRICS',
  },

  HEADERS: {
    NOTES: ['id', 'title', 'file_path', 'drive_id', 'content_raw', 'content_index', 'created', 'updated'],
    PROJECTS: ['id', 'name', 'description', 'status', 'priority', 'created'],
    TAGS: ['id', 'name'],
    NOTE_PROJECT: ['note_id', 'project_id'],
    NOTE_TAG: ['note_id', 'tag_id'],
    BACKLINKS: ['source_note_id', 'target_note_id'],
    METRICS: ['timestamp', 'action', 'duration_ms', 'status', 'error_message'],
  },

  PROJECT_STATUSES: ['active', 'paused', 'completed', 'archived'],
  PROJECT_PRIORITIES: ['low', 'medium', 'high', 'critical'],

  SYNC_EXTENSIONS: ['.md', '.txt', '.html'],
  BACKLINK_REGEX: /\[\[([^\]]+)\]\]/g,

  CACHE_KEYS: {
    NOTES_LIST: 'notes_list',
    PROJECTS_LIST: 'projects_list',
    TAGS_LIST: 'tags_list',
    SEARCH_PREFIX: 'search_',
    NOTE_PREFIX: 'note_',
  },
};

/**
 * Returns the active spreadsheet, searching by name if needed.
 * Throws if not found — caller must run setupConfig() first.
 */
function getSpreadsheet() {
  const scriptProps = PropertiesService.getScriptProperties();
  const ssId = scriptProps.getProperty('SPREADSHEET_ID');

  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // ID stale, fall through to name search
    }
  }

  const files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
  if (files.hasNext()) {
    const ss = SpreadsheetApp.open(files.next());
    scriptProps.setProperty('SPREADSHEET_ID', ss.getId());
    return ss;
  }

  throw new Error('MindVault spreadsheet not found. Run setupConfig() first.');
}

/**
 * Returns a sheet by name from the active spreadsheet.
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
  return sheet;
}

/**
 * Retrieves or caches the Drive folder IDs in script properties.
 */
function getFolderIds() {
  const scriptProps = PropertiesService.getScriptProperties();
  const cached = scriptProps.getProperty('FOLDER_IDS');
  if (cached) return JSON.parse(cached);

  const root = getRootFolder();
  const ids = { root: root.getId() };

  Object.values(CONFIG.FOLDERS).forEach(name => {
    const iter = root.getFoldersByName(name);
    if (iter.hasNext()) ids[name] = iter.next().getId();
  });

  scriptProps.setProperty('FOLDER_IDS', JSON.stringify(ids));
  return ids;
}

/**
 * Returns the MindVault root Drive folder.
 */
function getRootFolder() {
  const scriptProps = PropertiesService.getScriptProperties();
  const rootId = scriptProps.getProperty('ROOT_FOLDER_ID');

  if (rootId) {
    try {
      return DriveApp.getFolderById(rootId);
    } catch (e) { /* fall through */ }
  }

  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_ROOT_FOLDER);
  if (folders.hasNext()) {
    const folder = folders.next();
    scriptProps.setProperty('ROOT_FOLDER_ID', folder.getId());
    return folder;
  }

  throw new Error('MindVault root folder not found. Run setupConfig() first.');
}
