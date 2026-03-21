// api/controllers.gs
// Request handler functions called by routes.gs

function handleGetNotes(params) {
  try {
    const filters = {};
    if (params.project) filters.project = sanitizeString(params.project);
    if (params.tag) filters.tag = sanitizeString(params.tag);
    if (params.search) filters.search = sanitizeQuery(params.search);
    const notes = getNotes(Object.keys(filters).length ? filters : null);
    return successResponse(notes);
  } catch (e) {
    logError('controller.getNotes', e.message, e);
    return errorResponse(e.message);
  }
}

function handleGetNoteById(noteId) {
  try {
    if (!isValidId(noteId)) return errorResponse('Invalid note ID');
    const note = getNoteById(noteId);
    if (!note) return errorResponse('Note not found', { id: noteId });
    return successResponse(note);
  } catch (e) {
    logError('controller.getNoteById', e.message, e);
    return errorResponse(e.message);
  }
}

function handleCreateNote(body) {
  try {
    const note = createNote(body);
    return successResponse(note);
  } catch (e) {
    logError('controller.createNote', e.message, e);
    return errorResponse(e.message, { validation: e.message });
  }
}

function handleUpdateNote(noteId, body) {
  try {
    if (!isValidId(noteId)) return errorResponse('Invalid note ID');
    const note = updateNote(noteId, body);
    if (!note) return errorResponse('Note not found', { id: noteId });
    return successResponse(note);
  } catch (e) {
    logError('controller.updateNote', e.message, e);
    return errorResponse(e.message);
  }
}

function handleGetProjects(params) {
  try {
    return successResponse(getProjects());
  } catch (e) {
    logError('controller.getProjects', e.message, e);
    return errorResponse(e.message);
  }
}

function handleCreateProject(body) {
  try {
    const project = createProject(body);
    return successResponse(project);
  } catch (e) {
    logError('controller.createProject', e.message, e);
    return errorResponse(e.message, { validation: e.message });
  }
}

function handleGetTags() {
  try {
    return successResponse(getTags());
  } catch (e) {
    logError('controller.getTags', e.message, e);
    return errorResponse(e.message);
  }
}

function handleSearch(params) {
  try {
    if (!params.q) return errorResponse('Query parameter "q" is required');
    const results = searchNotes(params.q);
    return successResponse({ query: params.q, count: results.length, results });
  } catch (e) {
    logError('controller.search', e.message, e);
    return errorResponse(e.message);
  }
}

function handleSync() {
  try {
    const report = syncFromDrive();
    return successResponse(report);
  } catch (e) {
    logError('controller.sync', e.message, e);
    return errorResponse(e.message);
  }
}

function handleGetMetrics(params) {
  try {
    const metrics = getMetrics(params || {});
    return successResponse(metrics);
  } catch (e) {
    logError('controller.getMetrics', e.message, e);
    return errorResponse(e.message);
  }
}
