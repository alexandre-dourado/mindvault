// src/components/shared/SearchBar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, Actions } from '../../store/store.jsx';
import { useSearchActions } from '../../store/actions.js';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchBar() {
  const { state, dispatch } = useStore();
  const { search } = useSearchActions();
  const [localQuery, setLocalQuery] = useState(state.filters.search || '');
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(localQuery, 350);

  // Trigger search when debounced value changes
  useEffect(() => {
    dispatch({ type: Actions.SET_FILTER, key: 'search', value: debouncedQuery });
    if (debouncedQuery.trim()) {
      search(debouncedQuery);
    } else {
      dispatch({ type: Actions.SET_SEARCH_RESULTS, payload: null });
    }
  }, [debouncedQuery]);

  // Keyboard shortcut: Cmd/Ctrl+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    dispatch({ type: Actions.CLEAR_FILTERS });
    inputRef.current?.focus();
  }, [dispatch]);

  return (
    <div className="search-bar">
      <span className="search-bar__icon">
        {state.loading.search ? (
          <span className="search-bar__spinner" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="search-bar__input"
        placeholder="Search notes… ⌘K"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        aria-label="Search notes"
      />
      {localQuery && (
        <button className="search-bar__clear" onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}
