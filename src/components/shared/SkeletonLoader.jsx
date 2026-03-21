// src/components/shared/SkeletonLoader.jsx
import React from 'react';

/** Single skeleton line with configurable width. */
function SkeletonLine({ width = '100%', height = '1em', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: '4px', ...style }}
    />
  );
}

/** Skeleton for a note card in the list. */
export function NoteCardSkeleton() {
  return (
    <div className="note-card note-card--skeleton">
      <SkeletonLine width="70%" height="1.1em" />
      <div style={{ marginTop: '0.5rem' }}>
        <SkeletonLine width="100%" height="0.8em" />
        <SkeletonLine width="85%" height="0.8em" style={{ marginTop: '0.3rem' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
        <SkeletonLine width="50px" height="1.4em" style={{ borderRadius: '100px' }} />
        <SkeletonLine width="60px" height="1.4em" style={{ borderRadius: '100px' }} />
      </div>
    </div>
  );
}

/** Skeleton for the note viewer panel. */
export function NoteViewerSkeleton() {
  return (
    <div className="note-viewer__skeleton">
      <SkeletonLine width="60%" height="2rem" />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <SkeletonLine width="70px" height="1.5em" style={{ borderRadius: '100px' }} />
        <SkeletonLine width="80px" height="1.5em" style={{ borderRadius: '100px' }} />
      </div>
      <div style={{ marginTop: '2rem' }}>
        {[100, 85, 92, 60, 88, 75].map((w, i) => (
          <SkeletonLine key={i} width={`${w}%`} height="0.9em" style={{ marginBottom: '0.6rem' }} />
        ))}
      </div>
      <SkeletonLine width="40%" height="1.2em" style={{ marginTop: '2rem' }} />
      <div style={{ marginTop: '0.75rem' }}>
        {[95, 80].map((w, i) => (
          <SkeletonLine key={i} width={`${w}%`} height="0.9em" style={{ marginBottom: '0.6rem' }} />
        ))}
      </div>
    </div>
  );
}

/** Multiple note card skeletons for list loading. */
export function NoteListSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </>
  );
}

/** Sidebar section skeleton. */
export function SidebarSectionSkeleton({ lines = 4 }) {
  return (
    <div style={{ padding: '0.5rem 0' }}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine
          key={i}
          width={`${60 + Math.random() * 30}%`}
          height="0.85em"
          style={{ marginBottom: '0.6rem' }}
        />
      ))}
    </div>
  );
}

export default SkeletonLine;
