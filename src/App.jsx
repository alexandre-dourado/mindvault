// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useStore } from './store/store.jsx';
import { useNoteActions, useProjectActions, useTagActions } from './store/actions.js';
import { Home } from './pages/Home.jsx';
import { ProjectView } from './pages/ProjectView.jsx';
import { TagView } from './pages/TagView.jsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx';

/** Minimal hash-based router — parses window.location.hash */
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

function Router() {
  const route = useHashRoute();

  const projectMatch = route.match(/^\/project\/(.+)$/);
  if (projectMatch) return <ProjectView projectName={projectMatch[1]} />;

  const tagMatch = route.match(/^\/tag\/(.+)$/);
  if (tagMatch) return <TagView tagName={tagMatch[1]} />;

  return <Home />;
}

export default function App() {
  const { state } = useStore();
  const { loadNotes } = useNoteActions();
  const { loadProjects } = useProjectActions();
  const { loadTags } = useTagActions();

  // Apply dark/light mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }, [state.darkMode]);

  // Bootstrap data on mount
  useEffect(() => {
    loadNotes();
    loadProjects();
    loadTags();
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SW] Registered, scope:', reg.scope))
        .catch((err) => console.warn('[SW] Registration failed:', err));
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
