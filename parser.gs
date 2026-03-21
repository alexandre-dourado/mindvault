// utils/parser.gs
// Markdown and YAML frontmatter parsing utilities

/**
 * Parses a markdown file string into structured data.
 * Extracts YAML frontmatter and content body.
 * @param {string} raw - Raw file content
 * @returns {{ frontmatter: Object, body: string, contentIndex: string }}
 */
function parseMarkdown(raw) {
  const result = {
    frontmatter: {},
    body: '',
    contentIndex: '',
  };

  if (!raw || typeof raw !== 'string') return result;

  // Detect YAML frontmatter block between --- delimiters
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (fmMatch) {
    result.frontmatter = parseYamlFrontmatter(fmMatch[1]);
    result.body = fmMatch[2].trim();
  } else {
    result.body = raw.trim();
  }

  // Build searchable index: strip markdown syntax, lowercase
  result.contentIndex = buildContentIndex(result.body);
  return result;
}

/**
 * Parses simple YAML frontmatter (key: value pairs only, no nested objects).
 * Supports comma-separated lists for tags and projects fields.
 */
function parseYamlFrontmatter(yaml) {
  const result = {};
  if (!yaml) return result;

  const lines = yaml.split(/\r?\n/);
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;

    const key = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();

    if (!key) return;

    // Parse comma-separated list fields
    if (key === 'tags' || key === 'projects') {
      result[key] = value
        ? value.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Builds a stripped, lowercase string for full-text indexing.
 */
function buildContentIndex(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/#{1,6}\s+/g, ' ')       // Remove heading markers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Replace links with text
    .replace(/\[\[([^\]]+)\]\]/g, '$1')        // Replace backlinks with text
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')       // Remove code
    .replace(/>\s+/g, ' ')                     // Remove blockquotes
    .replace(/[-*+]\s+/g, ' ')                 // Remove list markers
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extracts all [[backlink]] references from markdown content.
 * @param {string} content
 * @returns {string[]} Array of linked note names
 */
function extractBacklinks(content) {
  const links = [];
  if (!content) return links;

  let match;
  const regex = new RegExp(CONFIG.BACKLINK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)]; // Deduplicate
}

/**
 * Serializes note data back into a markdown string with YAML frontmatter.
 */
function serializeMarkdown(title, tags, projects, createdDate, updatedDate, body) {
  const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');
  const projectsStr = Array.isArray(projects) ? projects.join(', ') : (projects || '');

  const frontmatter = [
    '---',
    `title: ${title || ''}`,
    `tags: ${tagsStr}`,
    `projects: ${projectsStr}`,
    `created: ${createdDate || formatDate(new Date())}`,
    `updated: ${updatedDate || formatDate(new Date())}`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${body || ''}`;
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generates a short unique ID using timestamp + random suffix.
 */
function generateId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}
