// src/store/actions.js
// Async action hooks — encapsulate API calls + dispatch sequences.

import { useCallback } from 'react';
import { useStore, Actions } from './store.jsx';
import { fetchNotes, fetchNoteById, createNote, updateNote, triggerSync } from '../services/notesService.js';
import { fetchProjects } from '../services/projectsService.js';
import { fetchTags, searchNotes } from '../services/searchService.js';

export function useNoteActions() {
  const { dispatch, setLoading, setError } = useStore();

  const loadNotes = useCallback(async (filters = {}) => {
    setLoading('notes', true);
    setError('notes', null);
    try {
      const notes = await fetchNotes(filters);
      dispatch({ type: Actions.SET_NOTES, payload: notes || [] });
    } catch (err) {
      setError('notes', err.message || 'Failed to load notes');
    } finally {
      setLoading('notes', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadNote = useCallback(async (id) => {
    setLoading('note', true);
    setError('note', null);
    dispatch({ type: Actions.SET_ACTIVE_NOTE, payload: null });
    try {
      const note = await fetchNoteById(id);
      dispatch({ type: Actions.SET_ACTIVE_NOTE, payload: note });
    } catch (err) {
      setError('note', err.message || 'Failed to load note');
    } finally {
      setLoading('note', false);
    }
  }, [dispatch, setLoading, setError]);

  const addNote = useCallback(async (data) => {
    setLoading('createNote', true);
    setError('createNote', null);
    try {
      const note = await createNote(data);
      dispatch({ type: Actions.ADD_NOTE, payload: note });
      dispatch({ type: Actions.SET_ACTIVE_NOTE, payload: note });
      return note;
    } catch (err) {
      setError('createNote', err.message || 'Failed to create note');
      throw err;
    } finally {
      setLoading('createNote', false);
    }
  }, [dispatch, setLoading, setError]);

  const editNote = useCallback(async (id, data) => {
    setLoading('updateNote', true);
    setError('updateNote', null);
    try {
      const note = await updateNote(id, data);
      dispatch({ type: Actions.UPDATE_NOTE_IN_LIST, payload: note });
      return note;
    } catch (err) {
      setError('updateNote', err.message || 'Failed to update note');
      throw err;
    } finally {
      setLoading('updateNote', false);
    }
  }, [dispatch, setLoading, setError]);

  const sync = useCallback(async () => {
    setLoading('sync', true);
    setError('sync', null);
    try {
      const result = await triggerSync();
      dispatch({ type: Actions.SET_LAST_SYNC, payload: new Date().toISOString() });
      // Reload notes after sync
      const notes = await fetchNotes();
      dispatch({ type: Actions.SET_NOTES, payload: notes || [] });
      return result;
    } catch (err) {
      setError('sync', err.message || 'Sync failed');
      throw err;
    } finally {
      setLoading('sync', false);
    }
  }, [dispatch, setLoading, setError]);

  return { loadNotes, loadNote, addNote, editNote, sync };
}

export function useProjectActions() {
  const { dispatch, setLoading, setError } = useStore();

  const loadProjects = useCallback(async () => {
    setLoading('projects', true);
    setError('projects', null);
    try {
      const projects = await fetchProjects();
      dispatch({ type: Actions.SET_PROJECTS, payload: projects || [] });
    } catch (err) {
      setError('projects', err.message || 'Failed to load projects');
    } finally {
      setLoading('projects', false);
    }
  }, [dispatch, setLoading, setError]);

  return { loadProjects };
}

export function useTagActions() {
  const { dispatch, setLoading, setError } = useStore();

  const loadTags = useCallback(async () => {
    setLoading('tags', true);
    setError('tags', null);
    try {
      const tags = await fetchTags();
      dispatch({ type: Actions.SET_TAGS, payload: tags || [] });
    } catch (err) {
      setError('tags', err.message || 'Failed to load tags');
    } finally {
      setLoading('tags', false);
    }
  }, [dispatch, setLoading, setError]);

  return { loadTags };
}

export function useSearchActions() {
  const { dispatch, setLoading, setError } = useStore();

  const search = useCallback(async (query) => {
    if (!query.trim()) {
      dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
      return;
    }
    setLoading('search', true);
    setError('search', null);
    try {
      const result = await searchNotes(query);
      dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: result });
    } catch (err) {
      setError('search', err.message || 'Search failed');
    } finally {
      setLoading('search', false);
    }
  }, [dispatch, setLoading, setError]);

  return { search };
}
