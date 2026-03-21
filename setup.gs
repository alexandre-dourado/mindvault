// core/setup.gs
// One-time system initialization — creates Sheets, Drive folders, and triggers

/**
 * Main setup function. Run once from the Apps Script editor.
 * Creates the spreadsheet structure, Drive folders, and sync trigger.
 */
function setupConfig() {
  const start = Date.now();
  try {
    const ss = _setupSpreadsheet();
    _setupSheets(ss);
    const rootFolderId = _setupDriveFolders();

    PropertiesService.getScriptProperties().setProperties({
      SPREADSHEET_ID: ss.getId(),
      DRIVE_ROOT_FOLDER_ID: rootFolderId
    });

    installSyncTrigger();

    logInfo('setup', 'MindVault setup complete', {
      spreadsheetId: ss.getId(),
      rootFolderId
    });
    logMetrics('setup', Date.now() - start, 'success');

    return successResponse({
      spreadsheetId: ss.getId(),
      rootFolderId,
      message: 'MindVault initialized successfully'
    });
  } catch (e) {
    logError('setup', 'Setup failed', e);
    logMetrics('setup', Date.now() - start, 'error', e.message);
    throw e;
  }
}

/**
 * Returns the active spreadsheet, or creates a new one named "MindVault".
 */
function _setupSpreadsheet() {
  const existingId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (existingId) {
    try { return SpreadsheetApp.openById(existingId); } catch (_) { /* fall through */ }
  }
  return SpreadsheetApp.create('MindVault');
}

/**
 * Creates all required sheets with headers if they don't already exist.
 */
function _setupSheets(ss) {
  for (const [sheetName, headers] of Object.entries(CONFIG.SHEET_HEADERS)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4A90D9')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }

  // Remove the default "Sheet1" if present
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getNumSheets() > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

/**
 * Creates the MindVault folder structure in Google Drive.
 * Returns the root folder ID.
 */
function _setupDriveFolders() {
  let rootFolder;
  const rootIt = DriveApp.getFoldersByName(CONFIG.FOLDERS.ROOT);
  if (rootIt.hasNext()) {
    rootFolder = rootIt.next();
  } else {
    rootFolder = DriveApp.createFolder(CONFIG.FOLDERS.ROOT);
  }

  const subFolders = [
    CONFIG.FOLDERS.NOTES,
    CONFIG.FOLDERS.AI,
    CONFIG.FOLDERS.HTML,
    CONFIG.FOLDERS.DRAFTS,
    CONFIG.FOLDERS.ASSETS
  ];

  for (const name of subFolders) {
    const it = rootFolder.getFoldersByName(name);
    if (!it.hasNext()) rootFolder.createFolder(name);
  }

  return rootFolder.getId();
}
