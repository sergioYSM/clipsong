import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Clipsong · Música que puedes usar',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  description: 'Cada canción te dice si puedes usarla en vídeos monetizados.',
  icons: { icon: '/icon.svg' },
  openGraph: { title: 'Clipsong', description: 'Música que puedes usar en tus vídeos.' },
};
export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
