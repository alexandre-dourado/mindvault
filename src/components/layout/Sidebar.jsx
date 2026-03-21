// src/components/layout/Sidebar.jsx
import React, { useCallback, useState } from 'react';
import { useStore, Actions } from '../../store/store.jsx';
import { useNoteActions } from '../../store/actions.js';
import { SearchBar } from '../shared/SearchBar.jsx';
import { SidebarSectionSkeleton } from '../shared/SkeletonLoader.jsx';
import { NewNoteModal } from '../notes/NewNoteModal.jsx';

function SyncStatus({ lastSync, loading, error, onSync }) {
  let label = 'Never synced';
  if (lastSync) {
    const d = new Date(lastSync);
    label = `Synced ${d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return (
    <div className="sync-status">
      <span className="sync-status__label">{error ? '⚠ Sync failed' : label}</span>
      <button
        className={`sync-status__btn ${loading ? 'sync-status__btn--spinning' : ''}`}
        onClick={onSync}
        disabled={loading}
        title="Sync from Drive"
        aria-label="Sync from Drive"
      >
        ↺
      </button>
    </div>
  );
}

export function Sidebar() {
  const { state, dispatch } = useStore();
  const { sync } = useNoteActions();
  const [showNewNote, setShowNewNote] = useState(false);

  const {
    projects, tags, filters, favorites, notes,
    loading, errors, darkMode, sidebarOpen,
    projectsExpanded, tagsExpanded, lastSync,
  } = state;

  const handleProjectClick = useCallback((name) => {
    const isActive = filters.project === name;
    dispatch({ type: Actions.SET_FILTER, key: 'project', value: isActive ? null : name });
    dispatch({ type: Actions.SET_FILTER, key: 'tag', value: null });
    dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
    // On mobile, switch to list panel
    if (window.innerWidth < 1024) {
      dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'list' });
    }
  }, [filters.project, dispatch]);

  const handleTagClick = useCallback((name) => {
    const isActive = filters.tag === name;
    dispatch({ type: Actions.SET_FILTER, key: 'tag', value: isActive ? null : name });
    dispatch({ type: Actions.SET_FILTER, key: 'project', value: null });
    dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
    if (window.innerWidth < 1024) {
      dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'list' });
    }
  }, [filters.tag, dispatch]);

  const handleAllNotes = useCallback(() => {
    dispatch({ type: Actions.CLEAR_FILTERS });
    if (window.innerWidth < 1024) {
      dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'list' });
    }
  }, [dispatch]);

  const favNotes = favorites
    .map((id) => notes.find((n) => n.id === id))
    .filter(Boolean);

  if (!sidebarOpen) return null;

  return (
    <>
      <aside className="sidebar">
        {/* Branding */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">◎</div>
          <span className="sidebar__name">MindVault</span>
          <button
            className="sidebar__close-btn"
            onClick={() => dispatch({ type: Actions.TOGGLE_SIDEBAR })}
            aria-label="Close sidebar"
          >
            ←
          </button>
        </div>

        {/* New Note + Search */}
        <div className="sidebar__actions">
          <button
            className="btn btn--primary btn--full"
            onClick={() => setShowNewNote(true)}
          >
            + New Note
          </button>
        </div>

        <SearchBar />

        <nav className="sidebar__nav">
          {/* All Notes */}
          <button
            className={`sidebar__nav-item ${!filters.project && !filters.tag && !filters.search ? 'sidebar__nav-item--active' : ''}`}
            onClick={handleAllNotes}
          >
            <span className="sidebar__nav-icon">▤</span>
            All Notes
            <span className="sidebar__nav-count">{notes.length}</span>
          </button>

          {/* Favorites */}
          {favNotes.length > 0 && (
            <div className="sidebar__section">
              <div className="sidebar__section-header">
                <span className="sidebar__section-title">Favorites</span>
              </div>
              <div className="sidebar__section-items">
                {favNotes.map((note) => (
                  <button
                    key={note.id}
                    className="sidebar__nav-item sidebar__nav-item--sub"
                    onClick={() => {
                      dispatch({ type: Actions.SET_ACTIVE_NOTE, payload: note });
                      dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'viewer' });
                    }}
                  >
                    <span className="sidebar__nav-icon">★</span>
                    <span className="sidebar__nav-text">{note.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="sidebar__section">
            <button
              className="sidebar__section-header sidebar__section-header--btn"
              onClick={() => dispatch({ type: Actions.TOGGLE_PROJECTS_EXPANDED })}
              aria-expanded={projectsExpanded}
            >
              <span className="sidebar__section-title">Projects</span>
              <span className={`sidebar__chevron ${projectsExpanded ? 'sidebar__chevron--open' : ''}`}>›</span>
            </button>
            {projectsExpanded && (
              <div className="sidebar__section-items">
                {loading.projects ? (
                  <SidebarSectionSkeleton lines={3} />
                ) : projects.length === 0 ? (
                  <span className="sidebar__empty">No projects yet</span>
                ) : (
                  projects.map((proj) => (
                    <button
                      key={proj.id}
                      className={`sidebar__nav-item sidebar__nav-item--sub ${filters.project === proj.name ? 'sidebar__nav-item--active' : ''}`}
                      onClick={() => handleProjectClick(proj.name)}
                    >
                      <span
                        className="sidebar__project-dot"
                        data-status={proj.status}
                      />
                      <span className="sidebar__nav-text">{proj.name}</span>
                      {proj.noteCount > 0 && (
                        <span className="sidebar__nav-count">{proj.noteCount}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="sidebar__section">
            <button
              className="sidebar__section-header sidebar__section-header--btn"
              onClick={() => dispatch({ type: Actions.TOGGLE_TAGS_EXPANDED })}
              aria-expanded={tagsExpanded}
            >
              <span className="sidebar__section-title">Tags</span>
              <span className={`sidebar__chevron ${tagsExpanded ? 'sidebar__chevron--open' : ''}`}>›</span>
            </button>
            {tagsExpanded && (
              <div className="sidebar__tags-cloud">
                {loading.tags ? (
                  <SidebarSectionSkeleton lines={2} />
                ) : tags.length === 0 ? (
                  <span className="sidebar__empty">No tags yet</span>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={`tag tag--sidebar ${filters.tag === tag.name ? 'tag--active' : ''}`}
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                      {tag.noteCount > 0 && (
                        <span className="tag__count">{tag.noteCount}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <SyncStatus
            lastSync={lastSync}
            loading={loading.sync}
            error={errors.sync}
            onSync={sync}
          />
          <button
            className="sidebar__theme-toggle"
            onClick={() => dispatch({ type: Actions.TOGGLE_DARK_MODE })}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀' : '☾'}
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {showNewNote && <NewNoteModal onClose={() => setShowNewNote(false)} />}
    </>
  );
}
