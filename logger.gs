// utils/logger.gs
// Logging utilities and metrics recording

/**
 * Logs an action to the METRICS sheet and optionally to console.
 * @param {string} action - Action name (e.g., 'sync', 'create_note')
 * @param {number} duration - Duration in milliseconds
 * @param {string} status - 'success' | 'error' | 'warning'
 * @param {string} [errorMessage] - Error details if applicable
 */
function logMetrics(action, duration, status, errorMessage) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.METRICS);
    const timestamp = new Date().toISOString();
    sheet.appendRow([
      timestamp,
      action,
      duration || 0,
      status || 'success',
      errorMessage || '',
    ]);
  } catch (e) {
    // Last-resort: don't let logging failures surface to callers
    console.error('logMetrics failed:', e.message);
  }
}

/**
 * Wraps a function call with automatic timing and metrics logging.
 * Returns the result or throws after logging.
 */
function withMetrics(action, fn) {
  const start = Date.now();
  try {
    const result = fn();
    logMetrics(action, Date.now() - start, 'success');
    return result;
  } catch (e) {
    logMetrics(action, Date.now() - start, 'error', e.message);
    throw e;
  }
}

/**
 * Logs an informational message to the console.
 */
function logInfo(message, context) {
  console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
}

/**
 * Logs a warning message.
 */
function logWarn(message, context) {
  console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
}

/**
 * Logs an error with stack trace.
 */
function logError(message, error) {
  console.error(`[ERROR] ${message}`, error ? error.stack || error.message : '');
}
