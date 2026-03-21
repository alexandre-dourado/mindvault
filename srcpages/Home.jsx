// src/pages/Home.jsx
import React from 'react';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { MainPanel } from '../components/layout/MainPanel.jsx';
import { ViewerPanel } from '../components/layout/ViewerPanel.jsx';
import { useStore } from '../store/store.jsx';

export function Home() {
  const { state } = useStore();

  return (
    <div className={`app-layout ${state.sidebarOpen ? 'app-layout--sidebar-open' : ''}`}>
      <Sidebar />
      {/* On mobile, show either list or viewer based on activePanel */}
      <div className={`app-layout__center ${state.activePanel === 'viewer' ? 'app-layout__center--viewer-active' : ''}`}>
        <MainPanel />
        <ViewerPanel />
      </div>
    </div>
  );
}
