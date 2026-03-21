// src/components/notes/NoteCard.jsx
import React, { useCallback } from 'react';
import { useStore, Actions } from '../../store/store.jsx';
import { useNoteActions } from '../../store/actions.js';

/** Formats an ISO date string to a human-readable relative or absolute label. */
function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}

/** Truncates a string to a max length, appending ellipsis. */
function truncate(str, max = 120) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max).trimEnd() + '…';
}

export function NoteCard({ note, isActive = false }) {
  const { state, dispatch } = useStore();
  const { loadNote } = useNoteActions();

  const isFavorite = state.favorites.includes(note.id);

  const handleClick = useCallback(() => {
    loadNote(note.id);
    dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'viewer' });
  }, [note.id, loadNote, dispatch]);

  const handleFavorite = useCallback((e) => {
    e.stopPropagation();
    dispatch({ type: Actions.TOGGLE_FAVORITE, payload: note.id });
  }, [note.id, dispatch]);

  const handleTagClick = useCallback((e, tag) => {
    e.stopPropagation();
    dispatch({ type: Actions.SET_FILTER, key: 'tag', value: tag });
    dispatch({ type: Actions.SET_FILTER, key: 'project', value: null });
    dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
  }, [dispatch]);

  const excerpt = truncate(note.content_index || '');
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const dateLabel = formatRelativeDate(note.updated || note.created);

  return (
    <article
      className={`note-card ${isActive ? 'note-card--active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-selected={isActive}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="note-card__header">
        <h3 className="note-card__title">{note.title || 'Untitled'}</h3>
        <button
          className={`note-card__fav ${isFavorite ? 'note-card__fav--active' : ''}`}
          onClick={handleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {excerpt && (
        <p className="note-card__excerpt">{excerpt}</p>
      )}

      <div className="note-card__footer">
        <div className="note-card__tags">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="tag"
              onClick={(e) => handleTagClick(e, tag)}
              role="button"
              tabIndex={0}
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="tag tag--more">+{tags.length - 3}</span>
          )}
        </div>
        <time className="note-card__date" dateTime={note.updated}>
          {dateLabel}
        </time>
      </div>
    </article>
  );
}
