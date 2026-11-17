'use client';
// Mobile library tab (the sidebar is hidden under 768px).
import { Sidebar } from '@/components/Sidebar';
export default function Collection() {
  return <div className="h-[calc(100dvh-var(--topbar-h)-var(--player-h)-64px)] p-2 md:h-[70vh]"><Sidebar /></div>;
}
