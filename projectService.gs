// services/projectService.gs
// CRUD operations for projects

/**
 * Returns all projects from PROJECTS sheet.
 */
function getProjects() {
  const cached = Cache.get(CONFIG.CACHE_KEYS.PROJECTS_LIST);
  if (cached) return cached;

  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Cache.set(CONFIG.CACHE_KEYS.PROJECTS_LIST, []);
    return [];
  }
  const projects = data.slice(1).map(row => rowToObject(CONFIG.SHEET_HEADERS.PROJECTS, row));
  Cache.set(CONFIG.CACHE_KEYS.PROJECTS_LIST, projects);
  return projects;
}

/**
 * Returns a single project by ID, with its note count.
 */
function getProjectById(projectId) {
  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  const row = data.slice(1).find(r => r[0] === projectId);
  if (!row) return null;
  const project = rowToObject(CONFIG.SHEET_HEADERS.PROJECTS, row);

  const npData = getSheet(CONFIG.SHEETS.NOTE_PROJECT).getDataRange().getValues().slice(1);
  project.noteCount = npData.filter(r => r[1] === projectId).length;
  return project;
}

/**
 * Creates a new project.
 */
function createProject(data) {
  const validation = validateProjectPayload(data);
  if (!validation.valid) throw new Error(validation.errors.join('; '));

  const id = generateId();
  const now = formatDate(new Date());
  const project = {
    id,
    name: sanitizeString(data.name),
    description: sanitizeString(data.description || ''),
    status: data.status || 'active',
    priority: data.priority || 'medium',
    created: now
  };

  getSheet(CONFIG.SHEETS.PROJECTS).appendRow(
    objectToRow(CONFIG.SHEET_HEADERS.PROJECTS, project)
  );
  Cache.invalidateProjects();
  return project;
}

/**
 * Updates an existing project by ID.
 */
function updateProject(projectId, data) {
  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const allData = sheet.getDataRange().getValues();
  const headers = CONFIG.SHEET_HEADERS.PROJECTS;

  const rowIndex = allData.findIndex((r, i) => i > 0 && r[0] === projectId);
  if (rowIndex === -1) return null;

  const existing = rowToObject(headers, allData[rowIndex]);
  const updated = {
    ...existing,
    name: data.name ? sanitizeString(data.name) : existing.name,
    description: data.description !== undefined ? sanitizeString(data.description) : existing.description,
    status: data.status || existing.status,
    priority: data.priority || existing.priority
  };

  const validation = validateProjectPayload(updated);
  if (!validation.valid) throw new Error(validation.errors.join('; '));

  sheet.getRange(rowIndex + 1, 1, 1, headers.length)
    .setValues([objectToRow(headers, updated)]);

  Cache.invalidateProjects();
  return updated;
}
