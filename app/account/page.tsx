'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLibrary } from '@/store/library';

export default function Account() {
  const { userName, signOut } = useLibrary();
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Tu cuenta</h1>
      {!userName ? <p className="text-text-muted">No has entrado. <Link href="/login" className="underline">Entrar</Link></p> : (
        <>
          <div className="mb-4 rounded-lg bg-surface-raised p-5">
            <p className="text-sm text-text-muted">Plan</p><p className="text-lg font-bold">Escuchar · gratis</p>
            <p className="mt-2 text-sm text-text-muted">Los planes Creador y Estudio llegarán con los pagos (pendiente: /replica-backend).</p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings" className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text">Ajustes</Link>
            <button type="button" onClick={() => { signOut(); router.push('/'); }} className="rounded-full px-5 py-2 font-bold text-text-muted hover:text-text">Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  );
}
