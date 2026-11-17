import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold">Esta página no existe</h1>
      <p className="text-text-muted">Puede que el enlace esté mal o que lo hayan borrado.</p>
      <Link href="/" className="rounded-full bg-text px-6 py-3 font-bold text-bg hover:scale-105">Volver al inicio</Link>
    </div>
  );
}
