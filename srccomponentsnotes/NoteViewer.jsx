// src/components/notes/NoteViewer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { useStore, Actions } from '../../store/store.jsx';
import { useNoteActions } from '../../store/actions.js';
import { NoteViewerSkeleton } from '../shared/SkeletonLoader.jsx';
import { InlineError } from '../shared/ErrorBoundary.jsx';

// Configure marked with safe defaults
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer: open external links in new tab, style [[backlinks]]
const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
  const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${text}</a>`;
};

marked.use({ renderer });

/** Converts [[note title]] syntax into styled backlink spans before passing to marked. */
function preprocessBacklinks(content) {
  if (!content) return '';
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title) =>
    `<span class="backlink-ref" data-title="${title}">[[${title}]]</span>`
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function NoteViewer() {
  const { state, dispatch } = useStore();
  const { loadNote } = useNoteActions();
  const contentRef = useRef(null);
  const { activeNote, loading, errors } = state;

  // Wire up backlink-ref clicks inside rendered HTML
  useEffect(() => {
    if (!contentRef.current) return;
    const spans = contentRef.current.querySelectorAll('.backlink-ref');
    const handleClick = (e) => {
      const title = e.currentTarget.dataset.title;
      if (!title) return;
      // Find note by title
      const match = state.notes.find(
        (n) => n.title?.toLowerCase() === title.toLowerCase()
      );
      if (match) loadNote(match.id);
    };
    spans.forEach((s) => s.addEventListener('click', handleClick));
    return () => spans.forEach((s) => s.removeEventListener('click', handleClick));
  }, [activeNote, state.notes, loadNote]);

  const handleTagClick = useCallback((tag) => {
    dispatch({ type: Actions.SET_FILTER, key: 'tag', value: tag });
    dispatch({ type: Actions.SET_FILTER, key: 'project', value: null });
    dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
  }, [dispatch]);

  const handleProjectClick = useCallback((project) => {
    dispatch({ type: Actions.SET_FILTER, key: 'project', value: project });
    dispatch({ type: Actions.SET_FILTER, key: 'tag', value: null });
    dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
  }, [dispatch]);

  const handleBacklinkClick = useCallback((noteId) => {
    loadNote(noteId);
  }, [loadNote]);

  const handleFavorite = useCallback(() => {
    if (activeNote) dispatch({ type: Actions.TOGGLE_FAVORITE, payload: activeNote.id });
  }, [activeNote, dispatch]);

  if (loading.note) return (
    <div className="note-viewer">
      <NoteViewerSkeleton />
    </div>
  );

  if (errors.note) return (
    <div className="note-viewer note-viewer--empty">
      <InlineError message={errors.note} onRetry={() => activeNote && loadNote(activeNote.id)} />
    </div>
  );

  if (!activeNote) return (
    <div className="note-viewer note-viewer--empty">
      <div className="note-viewer__empty-state">
        <div className="note-viewer__empty-icon">◎</div>
        <p className="note-viewer__empty-title">No note selected</p>
        <p className="note-viewer__empty-sub">Choose a note from the list to read it here</p>
      </div>
    </div>
  );

  const isFavorite = state.favorites.includes(activeNote.id);
  const tags = Array.isArray(activeNote.tags) ? activeNote.tags : [];
  const projects = Array.isArray(activeNote.projects) ? activeNote.projects : [];
  const backlinkIds = Array.isArray(activeNote.backlinks) ? activeNote.backlinks : [];

  // Find backlink note titles from the notes list
  const backlinkNotes = backlinkIds
    .map((id) => state.notes.find((n) => n.id === id))
    .filter(Boolean);

  const rawContent = activeNote.content_raw || '';
  // Strip frontmatter before rendering
  const contentOnly = rawContent.replace(/^---[\s\S]*?---\n?/, '').trim();
  const htmlContent = marked.parse(preprocessBacklinks(contentOnly));

  return (
    <div className="note-viewer">
      <div className="note-viewer__header">
        <h1 className="note-viewer__title">{activeNote.title || 'Untitled'}</h1>
        <button
          className={`note-viewer__fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Metadata row */}
      <div className="note-viewer__meta">
        <div className="note-viewer__meta-row">
          <span className="note-viewer__meta-label">Created</span>
          <time className="note-viewer__meta-value">{formatDate(activeNote.created)}</time>
        </div>
        {activeNote.updated && activeNote.updated !== activeNote.created && (
          <div className="note-viewer__meta-row">
            <span className="note-viewer__meta-label">Updated</span>
            <time className="note-viewer__meta-value">{formatDate(activeNote.updated)}</time>
          </div>
        )}
        {projects.length > 0 && (
          <div className="note-viewer__meta-row">
            <span className="note-viewer__meta-label">Projects</span>
            <div className="note-viewer__meta-value note-viewer__projects">
              {projects.map((p) => (
                <button
                  key={p}
                  className="project-chip"
                  onClick={() => handleProjectClick(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div className="note-viewer__meta-row">
            <span className="note-viewer__meta-label">Tags</span>
            <div className="note-viewer__meta-value note-viewer__tags">
              {tags.map((t) => (
                <span
                  key={t}
                  className="tag tag--viewer"
                  onClick={() => handleTagClick(t)}
                  role="button"
                  tabIndex={0}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr className="note-viewer__divider" />

      {/* Rendered Markdown content */}
      <div
        ref={contentRef}
        className="note-viewer__content prose"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Backlinks section */}
      {backlinkNotes.length > 0 && (
        <div className="note-viewer__backlinks">
          <h4 className="note-viewer__backlinks-title">
            <span className="note-viewer__backlinks-icon">↩</span>
            {backlinkNotes.length} Backlink{backlinkNotes.length !== 1 ? 's' : ''}
          </h4>
          <div className="note-viewer__backlinks-list">
            {backlinkNotes.map((n) => (
              <button
                key={n.id}
                className="backlink-card"
                onClick={() => handleBacklinkClick(n.id)}
              >
                <span className="backlink-card__title">{n.title}</span>
                <span className="backlink-card__date">
                  {new Date(n.updated || n.created).toLocaleDateString('en', {
                    month: 'short', day: 'numeric'
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
