import type { Metadata } from 'next';
import { Suspense } from 'react';
import { albumMetadata } from '@/lib/share';
import AlbumClient from './AlbumClient';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }): Promise<Metadata> {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  return albumMetadata(id, t);
}
export default function Page() { return <Suspense><AlbumClient /></Suspense>; }
