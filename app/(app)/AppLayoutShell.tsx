'use client';

import { useState, useEffect } from 'react';

const SIDEBAR_WIDTH = '240px';

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <main className="main-content" style={{
      flex: 1,
      marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
      paddingTop: isDesktop ? 0 : '60px',
      minWidth: 0,
      transition: 'margin-left 0.2s ease',
    }}>
      <div className="page-container" style={{ paddingTop: '1.25rem' }}>
        {children}
      </div>
    </main>
  );
}
