// src/components/layout/ViewerPanel.jsx
import React from 'react';
import { useStore, Actions } from '../../store/store.jsx';
import { NoteViewer } from '../notes/NoteViewer.jsx';

export function ViewerPanel() {
  const { state, dispatch } = useStore();

  return (
    <div className="viewer-panel">
      {/* Mobile back button */}
      <div className="viewer-panel__topbar">
        <button
          className="viewer-panel__back-btn"
          onClick={() => dispatch({ type: Actions.SET_ACTIVE_PANEL, payload: 'list' })}
          aria-label="Back to list"
        >
          ← Back
        </button>
        {state.activeNote && (
          <span className="viewer-panel__topbar-title">{state.activeNote.title}</span>
        )}
      </div>

      <NoteViewer />
    </div>
  );
}
