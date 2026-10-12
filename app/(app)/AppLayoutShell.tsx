'use client';

import { useSidebar } from '@/components/SidebarContext';

const SIDEBAR_EXPANDED = '240px';
const SIDEBAR_COLLAPSED = '64px';

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const { isDesktop, isCollapsed } = useSidebar();

  const currentSidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <main
      className="main-content"
      style={{
        flex: 1,
        marginLeft: isDesktop ? currentSidebarWidth : 0,
        paddingTop: isDesktop ? 0 : '60px',
        minWidth: 0,
        transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="page-container" style={{ paddingTop: '1.25rem' }}>
        {children}
      </div>
    </main>
  );
}
