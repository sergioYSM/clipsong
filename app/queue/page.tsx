'use client';
import { useTitle } from '@/lib/useTitle';
import { QueueView } from '@/components/RightPanel';
export default function QueuePage() {
  useTitle('Cola');
  return <div className="px-2 py-4 md:px-4"><h1 className="mb-2 px-2 text-2xl font-extrabold">Cola</h1><QueueView standalone /></div>;
}
