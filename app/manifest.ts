import type { MetadataRoute } from 'next';
// Colours are the design tokens' bg / accent values (the manifest cannot read CSS variables).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clipsong · Música que puedes usar',
    short_name: 'Clipsong',
    description: 'Cada canción te dice si puedes usarla en vídeos monetizados.',
    lang: 'es',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Buscar', url: '/search', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Me gustan', url: '/collection/tracks', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
