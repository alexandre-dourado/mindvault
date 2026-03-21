// src/components/layout/MainPanel.jsx
import React from 'react';
import { useStore, Actions } from '../../store/store.jsx';
import { NoteList } from '../notes/NoteList.jsx';

export function MainPanel() {
  const { state, dispatch } = useStore();

  return (
    <div className="main-panel">
      {/* Mobile top bar — shows when sidebar is closed */}
      <div className="main-panel__topbar">
        {!state.sidebarOpen && (
          <button
            className="main-panel__menu-btn"
            onClick={() => dispatch({ type: Actions.TOGGLE_SIDEBAR })}
            aria-label="Open sidebar"
          >
            ☰
          </button>
        )}
        <span className="main-panel__topbar-title">
          {state.filters.project
            ? `◈ ${state.filters.project}`
            : state.filters.tag
            ? `# ${state.filters.tag}`
            : state.filters.search
            ? `Search: "${state.filters.search}"`
            : 'All Notes'}
        </span>
      </div>

      <NoteList />
    </div>
  );
}
