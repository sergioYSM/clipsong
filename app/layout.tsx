import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  description: 'Cada canción te dice si puedes usarla en vídeos monetizados.',
  icons: { icon: '/icon.svg' },
  openGraph: { title: 'Clipsong', description: 'Música que puedes usar en tus vídeos.' },
};
export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* One <title>, owned by the app (lib/useTitle); Next's streamed metadata title would overwrite it */}
      <body><title>Clipsong · Música que puedes usar</title><AppShell>{children}</AppShell></body>
    </html>
  );
}
