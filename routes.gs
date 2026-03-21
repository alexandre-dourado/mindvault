// api/routes.gs
// GAS Web App entry points — doGet and doPost routing

/**
 * Handles all GET requests to the Web App URL.
 * Route format: ?route=notes&id=xxx or ?route=search&q=xxx
 */
function doGet(e) {
  const params = e.parameter || {};
  const route = (params.route || '').toLowerCase().trim();
  const pathParts = route.split('/').filter(Boolean);
  const resource = pathParts[0];
  const resourceId = pathParts[1] || params.id || null;

  let response;

  try {
    switch (resource) {
      case 'notes':
        response = resourceId
          ? handleGetNoteById(resourceId)
          : handleGetNotes(params);
        break;

      case 'projects':
        response = resourceId
          ? successResponse(getProjectById(resourceId))
          : handleGetProjects(params);
        break;

      case 'tags':
        response = handleGetTags();
        break;

      case 'search':
        response = handleSearch(params);
        break;

      case 'metrics':
        response = handleGetMetrics(params);
        break;

      case 'health':
        response = successResponse({
          status: 'ok',
          version: CONFIG.VERSION,
          timestamp: new Date().toISOString()
        });
        break;

      default:
        response = errorResponse(`Unknown route: ${resource || '(empty)'}`, {
          availableRoutes: ['notes', 'projects', 'tags', 'search', 'metrics', 'health']
        });
    }
  } catch (err) {
    logError('doGet', `Unhandled error for route: ${route}`, err);
    response = errorResponse('Internal server error', { message: err.message });
  }

  return buildJsonResponse(response);
}

/**
 * Handles all POST requests to the Web App URL.
 * Route format: ?route=notes (body as JSON)
 */
function doPost(e) {
  const params = e.parameter || {};
  const route = (params.route || '').toLowerCase().trim();
  const pathParts = route.split('/').filter(Boolean);
  const resource = pathParts[0];
  const resourceId = pathParts[1] || params.id || null;

  let body = {};
  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (_) {
    return buildJsonResponse(errorResponse('Invalid JSON body'));
  }

  let response;

  try {
    switch (resource) {
      case 'notes':
        response = resourceId
          ? handleUpdateNote(resourceId, body)
          : handleCreateNote(body);
        break;

      case 'projects':
        response = resourceId
          ? successResponse(updateProject(resourceId, body))
          : handleCreateProject(body);
        break;

      case 'tags':
        response = successResponse(createTag(body.name || ''));
        break;

      case 'sync':
        response = handleSync();
        break;

      case 'setup':
        response = setupConfig();
        break;

      case 'validate':
        response = successResponse(validateSystem());
        break;

      case 'fix':
        response = successResponse(fixConsistency());
        break;

      default:
        response = errorResponse(`Unknown route: ${resource || '(empty)'}`, {
          availableRoutes: ['notes', 'projects', 'tags', 'sync', 'setup', 'validate', 'fix']
        });
    }
  } catch (err) {
    logError('doPost', `Unhandled error for route: ${route}`, err);
    response = errorResponse('Internal server error', { message: err.message });
  }

  return buildJsonResponse(response);
}
