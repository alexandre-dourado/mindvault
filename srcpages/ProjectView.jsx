// src/pages/ProjectView.jsx
// Convenience page: pre-sets project filter and renders the standard layout.
// Accessed via URL hash routing: /#/project/ProjectName
import React, { useEffect } from 'react';
import { useStore, Actions } from '../store/store.jsx';
import { Home } from './Home.jsx';

export function ProjectView({ projectName }) {
  const { dispatch } = useStore();

  useEffect(() => {
    if (projectName) {
      dispatch({ type: Actions.SET_FILTER, key: 'project', value: decodeURIComponent(projectName) });
      dispatch({ type: Actions.SET_FILTER, key: 'tag', value: null });
    }
    return () => {
      // Clear filter when unmounting
      dispatch({ type: Actions.SET_FILTER, key: 'project', value: null });
    };
  }, [projectName, dispatch]);

  return <Home />;
}
