// src/store/store.jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  // Data
  notes: [],
  projects: [],
  tags: [],
  activeNote: null,
  searchResults: null,

  // Filters
  filters: {
    project: null,
    tag: null,
    search: '',
  },

  // UI
  darkMode: localStorage.getItem('mv-dark-mode') !== 'false', // default dark
  sidebarOpen: window.innerWidth >= 1024,
  activePanel: 'list', // 'list' | 'viewer' (for mobile)
  projectsExpanded: true,
  tagsExpanded: true,
  favorites: JSON.parse(localStorage.getItem('mv-favorites') || '[]'),

  // Loading states
  loading: {
    notes: false,
    note: false,
    projects: false,
    tags: false,
    search: false,
    sync: false,
    createNote: false,
    updateNote: false,
  },

  // Error states (per operation)
  errors: {
    notes: null,
    note: null,
    projects: null,
    tags: null,
    search: null,
    sync: null,
    createNote: null,
    updateNote: null,
  },

  // Sync status
  lastSync: localStorage.getItem('mv-last-sync') || null,
};

// ─── Action Types ─────────────────────────────────────────────────────────────
export const Actions = {
  // Data
  SET_NOTES: 'SET_NOTES',
  SET_ACTIVE_NOTE: 'SET_ACTIVE_NOTE',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_TAGS: 'SET_TAGS',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE_IN_LIST: 'UPDATE_NOTE_IN_LIST',

  // Filters
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // UI
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',
  TOGGLE_PROJECTS_EXPANDED: 'TOGGLE_PROJECTS_EXPANDED',
  TOGGLE_TAGS_EXPANDED: 'TOGGLE_TAGS_EXPANDED',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',

  // Loading
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Sync
  SET_LAST_SYNC: 'SET_LAST_SYNC',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case Actions.SET_NOTES:
      return { ...state, notes: action.payload };

    case Actions.SET_ACTIVE_NOTE:
      return { ...state, activeNote: action.payload };

    case Actions.SET_PROJECTS:
      return { ...state, projects: action.payload };

    case Actions.SET_TAGS:
      return { ...state, tags: action.payload };

    case Actions.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload };

    case Actions.ADD_NOTE:
      return { ...state, notes: [action.payload, ...state.notes] };

    case Actions.UPDATE_NOTE_IN_LIST:
      return {
        ...state,
        notes: state.notes.map((n) => n.id === action.payload.id ? { ...n, ...action.payload } : n),
        activeNote: state.activeNote?.id === action.payload.id ? { ...state.activeNote, ...action.payload } : state.activeNote,
      };

    case Actions.SET_FILTER:
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };

    case Actions.CLEAR_FILTERS:
      return { ...state, filters: { project: null, tag: null, search: '' }, searchResults: null };

    case Actions.TOGGLE_DARK_MODE: {
      const darkMode = !state.darkMode;
      localStorage.setItem('mv-dark-mode', darkMode);
      return { ...state, darkMode };
    }

    case Actions.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case Actions.SET_ACTIVE_PANEL:
      return { ...state, activePanel: action.payload };

    case Actions.TOGGLE_PROJECTS_EXPANDED:
      return { ...state, projectsExpanded: !state.projectsExpanded };

    case Actions.TOGGLE_TAGS_EXPANDED:
      return { ...state, tagsExpanded: !state.tagsExpanded };

    case Actions.TOGGLE_FAVORITE: {
      const id = action.payload;
      const favs = state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id];
      localStorage.setItem('mv-favorites', JSON.stringify(favs));
      return { ...state, favorites: favs };
    }

    case Actions.SET_LOADING:
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };

    case Actions.SET_ERROR:
      return { ...state, errors: { ...state.errors, [action.key]: action.value } };

    case Actions.CLEAR_ERROR:
      return { ...state, errors: { ...state.errors, [action.key]: null } };

    case Actions.SET_LAST_SYNC: {
      localStorage.setItem('mv-last-sync', action.payload);
      return { ...state, lastSync: action.payload };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Convenience action creators
  const setLoading = useCallback((key, value) =>
    dispatch({ type: Actions.SET_LOADING, key, value }), []);

  const setError = useCallback((key, value) =>
    dispatch({ type: Actions.SET_ERROR, key, value }), []);

  const clearError = useCallback((key) =>
    dispatch({ type: Actions.CLEAR_ERROR, key }), []);

  return (
    <StoreContext.Provider value={{ state, dispatch, setLoading, setError, clearError }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
