// core/metrics.gs
// Metrics retrieval and aggregation

/**
 * Returns metrics data with optional filters.
 * @param {Object} filters - { action, status, limit, since }
 */
function getMetrics(filters) {
  const sheet = getSheet(CONFIG.SHEETS.METRICS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { entries: [], summary: {} };

  const headers = CONFIG.SHEET_HEADERS.METRICS;
  let entries = data.slice(1).map(row => rowToObject(headers, row));

  if (filters) {
    if (filters.action) entries = entries.filter(e => e.action === filters.action);
    if (filters.status) entries = entries.filter(e => e.status === filters.status);
    if (filters.since) {
      const since = new Date(filters.since);
      entries = entries.filter(e => new Date(e.timestamp) >= since);
    }
  }

  const limit = (filters && filters.limit) ? Math.min(parseInt(filters.limit), 1000) : 500;
  entries = entries.slice(-limit);

  return { entries, summary: _buildMetricsSummary(entries) };
}

function _buildMetricsSummary(entries) {
  if (!entries.length) return {};

  const byAction = {};
  let totalErrors = 0;
  let totalDuration = 0;

  for (const e of entries) {
    if (!byAction[e.action]) {
      byAction[e.action] = { count: 0, errors: 0, totalDuration: 0, avgDuration: 0 };
    }
    byAction[e.action].count++;
    byAction[e.action].totalDuration += Number(e.duration_ms) || 0;
    totalDuration += Number(e.duration_ms) || 0;
    if (e.status === 'error') {
      byAction[e.action].errors++;
      totalErrors++;
    }
  }

  for (const action of Object.keys(byAction)) {
    const a = byAction[action];
    a.avgDuration = a.count > 0 ? Math.round(a.totalDuration / a.count) : 0;
  }

  return {
    totalEntries: entries.length,
    totalErrors,
    errorRate: entries.length > 0 ? (totalErrors / entries.length * 100).toFixed(1) + '%' : '0%',
    avgDurationMs: entries.length > 0 ? Math.round(totalDuration / entries.length) : 0,
    byAction
  };
}
