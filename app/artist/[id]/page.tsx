import type { Metadata } from 'next';
import { artistMetadata } from '@/lib/share';
import ArtistClient from './ArtistClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return artistMetadata((await params).id);
}
export default function Page() { return <ArtistClient />; }
