// services/driveService.gs
// Google Drive file operations for MindVault notes

/**
 * Creates a new Markdown file in the /notes folder.
 * Returns { fileId, filePath }.
 */
function createNoteFile(title, content) {
  try {
    const folder = getSubFolder(CONFIG.FOLDERS.NOTES);
    const filename = `${slugify(title)}_${Date.now()}.md`;
    const file = folder.createFile(filename, content, MimeType.PLAIN_TEXT);
    const filePath = `${CONFIG.FOLDERS.ROOT}/${CONFIG.FOLDERS.NOTES}/${filename}`;
    return { fileId: file.getId(), filePath };
  } catch (e) {
    logError('driveService.createNoteFile', 'Failed to create file', e);
    throw e;
  }
}

/**
 * Reads and returns the string content of a Drive file by ID.
 */
function readNoteFile(driveId) {
  try {
    const file = DriveApp.getFileById(driveId);
    return file.getBlob().getDataAsString();
  } catch (e) {
    logError('driveService.readNoteFile', `Failed to read file ${driveId}`, e);
    throw e;
  }
}

/**
 * Overwrites the content of an existing Drive file by ID.
 */
function updateNoteFile(driveId, content) {
  try {
    const file = DriveApp.getFileById(driveId);
    file.setContent(content);
    return true;
  } catch (e) {
    logError('driveService.updateNoteFile', `Failed to update file ${driveId}`, e);
    throw e;
  }
}

/**
 * Moves a Drive file to trash by ID.
 */
function deleteNoteFile(driveId) {
  try {
    const file = DriveApp.getFileById(driveId);
    file.setTrashed(true);
    return true;
  } catch (e) {
    logError('driveService.deleteNoteFile', `Failed to delete file ${driveId}`, e);
    throw e;
  }
}

/**
 * Lists all .md, .txt, and .html files in the /notes Drive folder.
 * Returns array of { id, name, dateUpdated, dateCreated }.
 */
function listNotesFromDrive() {
  try {
    const folder = getSubFolder(CONFIG.FOLDERS.NOTES);
    const files = [];
    const exts = ['.md', '.txt', '.html'];

    const it = folder.getFiles();
    while (it.hasNext()) {
      const file = it.next();
      const name = file.getName();
      if (exts.some(ext => name.toLowerCase().endsWith(ext))) {
        files.push({
          id: file.getId(),
          name,
          dateUpdated: file.getLastUpdated(),
          dateCreated: file.getDateCreated()
        });
      }
    }
    return files;
  } catch (e) {
    logError('driveService.listNotesFromDrive', 'Failed to list Drive files', e);
    throw e;
  }
}

/**
 * Returns file metadata by Drive ID without reading full content.
 */
function getFileMetadata(driveId) {
  try {
    const file = DriveApp.getFileById(driveId);
    return {
      id: file.getId(),
      name: file.getName(),
      dateUpdated: file.getLastUpdated(),
      dateCreated: file.getDateCreated(),
      size: file.getSize()
    };
  } catch (e) {
    logError('driveService.getFileMetadata', `Failed to get metadata for ${driveId}`, e);
    throw e;
  }
}
