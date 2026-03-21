// src/components/notes/NewNoteModal.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../store/store.jsx';
import { useNoteActions } from '../../store/actions.js';
import { InlineError } from '../shared/ErrorBoundary.jsx';

export function NewNoteModal({ onClose }) {
  const { state } = useStore();
  const { addNote } = useNoteActions();
  const [form, setForm] = useState({
    title: '',
    content: '',
    tags: '',
    projects: '',
  });
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    // Close on Escape
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await addNote({
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        projects: form.projects.split(',').map((p) => p.trim()).filter(Boolean),
      });
      onClose();
    } catch {
      // Error is shown via state.errors.createNote
    }
  }, [form, addNote, onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New note">
        <div className="modal__header">
          <h2 className="modal__title">New Note</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="note-title">Title *</label>
            <input
              ref={titleRef}
              id="note-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="Note title…"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              name="content"
              className="form-input form-textarea"
              placeholder="Write in Markdown… supports [[backlinks]]"
              value={form.content}
              onChange={handleChange}
              rows={8}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="note-tags">Tags</label>
              <input
                id="note-tags"
                name="tags"
                type="text"
                className="form-input"
                placeholder="tag1, tag2, tag3"
                value={form.tags}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="note-projects">Projects</label>
              <input
                id="note-projects"
                name="projects"
                type="text"
                className="form-input"
                placeholder="project1, project2"
                value={form.projects}
                onChange={handleChange}
              />
            </div>
          </div>

          {state.errors.createNote && (
            <InlineError message={state.errors.createNote} compact />
          )}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!form.title.trim() || state.loading.createNote}
            >
              {state.loading.createNote ? 'Creating…' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
