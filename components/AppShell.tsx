'use client';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PlayerBar } from './PlayerBar';
import { RightPanel } from './RightPanel';
import { MobileNav } from './MobileNav';
import { Toast } from './Toast';
import { AudioEngine } from './AudioEngine';
import { AuthSync } from './AuthSync';
import { useUi } from '@/store/ui';
import { useEffect } from 'react';
import { useLibrary } from '@/store/library';

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUi((s) => s.sidebarCollapsed);
  // localStorage hydration is synchronous on the client; effects run after it.
  useEffect(() => {
    const done = () => useLibrary.setState({ hydrated: true });
    if (useLibrary.persist.hasHydrated()) done(); else return useLibrary.persist.onFinishHydration(done);
  }, []);
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-text focus:px-3 focus:py-2 focus:text-bg">Saltar al contenido</a>
      <div className="flex min-h-0 flex-1 gap-2 p-0 md:p-2">
        <div className={`hidden shrink-0 md:block ${collapsed ? 'w-[72px]' : 'w-sidebar'}`}><Sidebar collapsed={collapsed} /></div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface md:rounded-lg">
          <TopBar />
          <main id="main" tabIndex={-1} className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-8 focus:outline-none">{children}</main>
        </div>
        <RightPanel />
      </div>
      <PlayerBar />
      <MobileNav />
      <Toast />
      <AudioEngine />
      <AuthSync />
    </div>
  );
}
