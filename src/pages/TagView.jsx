// src/pages/TagView.jsx
// Convenience page: pre-sets tag filter and renders the standard layout.
// Accessed via URL hash routing: /#/tag/tagname
import React, { useEffect } from 'react';
import { useStore, Actions } from '../store/store.jsx';
import { Home } from './Home.jsx';

export function TagView({ tagName }) {
  const { dispatch } = useStore();

  useEffect(() => {
    if (tagName) {
      dispatch({ type: Actions.SET_FILTER, key: 'tag', value: decodeURIComponent(tagName) });
      dispatch({ type: Actions.SET_FILTER, key: 'project', value: null });
    }
    return () => {
      dispatch({ type: Actions.SET_FILTER, key: 'tag', value: null });
    };
  }, [tagName, dispatch]);

  return <Home />;
}
