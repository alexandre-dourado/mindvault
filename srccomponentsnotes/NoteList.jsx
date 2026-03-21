// src/components/notes/NoteList.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../../store/store.jsx';
import { NoteCard } from './NoteCard.jsx';
import { NoteListSkeleton } from '../shared/SkeletonLoader.jsx';
import { InlineError } from '../shared/ErrorBoundary.jsx';
import { useNoteActions } from '../../store/actions.js';

const PAGE_SIZE = 20;

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="note-list__empty">
      <div className="note-list__empty-icon">◌</div>
      {hasFilters ? (
        <>
          <p className="note-list__empty-title">No notes match these filters</p>
          <button className="btn btn--ghost btn--sm" onClick={onClear}>
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="note-list__empty-title">Your vault is empty</p>
          <p className="note-list__empty-sub">
            Add notes to your MindVault Drive folder and sync to get started
          </p>
        </>
      )}
    </div>
  );
}

export function NoteList() {
  const { state, dispatch } = useStore();
  const { loadNotes } = useNoteActions();
  const [page, setPage] = useState(1);

  const { notes, searchResults, filters, loading, errors, activeNote } = state;

  // Determine which list to show: search results override filtered notes
  const displayNotes = useMemo(() => {
    if (searchResults) return searchResults.results || [];

    let list = [...notes];

    // Tag filter
    if (filters.tag) {
      list = list.filter((n) =>
        Array.isArray(n.tags)
          ? n.tags.some((t) => t.toLowerCase() === filters.tag.toLowerCase())
          : false
      );
    }

    // Project filter
    if (filters.project) {
      list = list.filter((n) =>
        Array.isArray(n.projects)
          ? n.projects.some((p) => p.toLowerCase() === filters.project.toLowerCase())
          : false
      );
    }

    // Sort by updated desc
    list.sort((a, b) => {
      const da = new Date(a.updated || a.created || 0);
      const db = new Date(b.updated || b.created || 0);
      return db - da;
    });

    return list;
  }, [notes, searchResults, filters]);

  // Pagination — slice the display list
  const paginatedNotes = useMemo(() => {
    return displayNotes.slice(0, page * PAGE_SIZE);
  }, [displayNotes, page]);

  const hasMore = paginatedNotes.length < displayNotes.length;
  const hasFilters = !!(filters.tag || filters.project || filters.search);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
    setPage(1);
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  // Header label
  const headerLabel = useMemo(() => {
    if (searchResults) {
      return `${searchResults.count ?? displayNotes.length} result${displayNotes.length !== 1 ? 's' : ''} for "${filters.search}"`;
    }
    if (filters.tag) return `Tag: ${filters.tag}`;
    if (filters.project) return `Project: ${filters.project}`;
    return `All Notes (${displayNotes.length})`;
  }, [searchResults, filters, displayNotes.length]);

  if (loading.notes) {
    return (
      <div className="note-list">
        <div className="note-list__header">
          <span className="note-list__header-label skeleton" style={{ width: '120px', height: '1em', display: 'inline-block' }} />
        </div>
        <NoteListSkeleton count={6} />
      </div>
    );
  }

  if (errors.notes) {
    return (
      <div className="note-list">
        <InlineError
          message={errors.notes}
          onRetry={() => loadNotes(filters)}
        />
      </div>
    );
  }

  return (
    <div className="note-list">
      <div className="note-list__header">
        <span className="note-list__header-label">{headerLabel}</span>
        {hasFilters && (
          <button className="note-list__clear-btn" onClick={handleClearFilters} title="Clear filters">
            ×
          </button>
        )}
      </div>

      {paginatedNotes.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
      ) : (
        <>
          <div className="note-list__items">
            {paginatedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={activeNote?.id === note.id}
              />
            ))}
          </div>

          {hasMore && (
            <div className="note-list__load-more">
              <button className="btn btn--ghost btn--sm" onClick={handleLoadMore}>
                Load more ({displayNotes.length - paginatedNotes.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
