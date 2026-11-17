'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLibrary } from '@/store/library';
import { useUi } from '@/store/ui';
import { backendEnabled, billingEnabled } from '@/lib/config';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface Sub { plan: 'free' | 'creador' | 'estudio'; status: string; cancel_at_period_end: boolean; current_period_end: string | null }
const planName = { free: 'Escuchar · gratis', creador: 'Creador', estudio: 'Estudio' };

async function post(url: string, body?: object) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? 'Algo ha fallado. Inténtalo de nuevo.');
  return j;
}

function Real() {
  const router = useRouter();
  const params = useSearchParams();
  const showToast = useUi((s) => s.showToast);
  const userName = useLibrary((s) => s.userName);
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [sub, setSub] = useState<Sub | null>(null);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser()!;
    sb.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) { const r = await sb.from('subscriptions').select('plan, status, cancel_at_period_end, current_period_end').maybeSingle(); setSub((r.data as Sub) ?? null); }
    });
    if (params.get('checkout') === 'ok') showToast('¡Listo! Tu plan se activa en unos segundos.');
  }, [params, showToast]);

  if (email === undefined) return <div className="skeleton h-32 rounded-lg" aria-busy="true" />;
  if (!email) return <p className="text-text-muted">No has entrado. <Link href="/login?next=/account" className="underline">Entrar</Link></p>;

  const go = (label: string, fn: () => Promise<{ url: string }>) => async () => {
    setBusy(label);
    try { location.href = (await fn()).url; } catch (e) { showToast((e as Error).message); setBusy(''); }
  };
  const signOut = async (everywhere: boolean) => {
    await fetch(`/auth/signout${everywhere ? '?scope=global' : ''}`, { method: 'POST' });
    await supabaseBrowser()!.auth.signOut({ scope: 'local' });
    router.push('/');
  };
  const del = async () => {
    setDeleting(true);
    const { error } = await supabaseBrowser()!.rpc('delete_my_account');
    if (error) { setDeleting(false); return showToast('No hemos podido borrar la cuenta. Escríbenos y lo hacemos a mano.'); }
    await supabaseBrowser()!.auth.signOut({ scope: 'local' });
    showToast('Tu cuenta y todos tus datos se han borrado.');
    router.push('/');
  };
  const plan = sub?.plan ?? 'free';
  const paid = plan !== 'free' && sub?.status !== 'canceled';
  const end = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <>
      <div className="mb-4 rounded-lg bg-surface-raised p-5">
        <p className="text-sm text-text-muted">Cuenta</p>
        <p className="font-bold">{userName}</p><p className="text-sm text-text-muted">{email}</p>
      </div>
      <div className="mb-4 rounded-lg bg-surface-raised p-5">
        <p className="text-sm text-text-muted">Plan</p>
        <p className="text-lg font-bold">{planName[plan]}</p>
        {sub?.status === 'past_due' && <p className="mt-1 text-sm text-warning" role="alert">El último pago no se pudo cobrar. Actualiza tu tarjeta para no perder el plan.</p>}
        {paid && sub?.cancel_at_period_end && end && <p className="mt-1 text-sm text-text-muted">Cancelado. Mantienes el plan hasta el {end}.</p>}
        {paid && !sub?.cancel_at_period_end && end && <p className="mt-1 text-sm text-text-muted">Se renueva el {end}. Te avisamos 7 días antes.</p>}
        {billingEnabled && (
          <div className="mt-4 flex flex-wrap gap-2">
            {!paid && (<>
              <button type="button" disabled={!!busy} onClick={go('cm', () => post('/api/billing/checkout', { plan: 'creador', interval: 'monthly' }))} className="rounded-full bg-accent px-5 py-2 font-bold text-accent-on hover:scale-105 disabled:opacity-60">Creador · 5 €/mes</button>
              <button type="button" disabled={!!busy} onClick={go('cy', () => post('/api/billing/checkout', { plan: 'creador', interval: 'yearly' }))} className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text disabled:opacity-60">Creador · 50 €/año</button>
              <button type="button" disabled={!!busy} onClick={go('em', () => post('/api/billing/checkout', { plan: 'estudio', interval: 'monthly' }))} className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text disabled:opacity-60">Estudio · 12 €/mes</button>
            </>)}
            {sub && <button type="button" disabled={!!busy} onClick={go('portal', () => post('/api/billing/portal'))} className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text disabled:opacity-60">{paid ? 'Gestionar o cancelar' : 'Facturas'}</button>}
          </div>
        )}
        {!billingEnabled && <p className="mt-2 text-sm text-text-muted">Los planes de pago aún no están activados.</p>}
      </div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/settings" className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text">Ajustes</Link>
        <button type="button" onClick={() => signOut(false)} className="rounded-full px-5 py-2 font-bold text-text-muted hover:text-text">Cerrar sesión</button>
        <button type="button" onClick={() => signOut(true)} className="rounded-full px-5 py-2 font-bold text-text-muted hover:text-text">Cerrar sesión en todos los dispositivos</button>
      </div>
      <section aria-labelledby="del-t" className="rounded-lg border border-danger/40 p-5">
        <h2 id="del-t" className="mb-1 font-bold">Borrar la cuenta</h2>
        <p className="mb-3 text-sm text-text-muted">Se borran tu cuenta, tus listas, tus canciones guardadas y tu historial. No se puede deshacer.{paid ? ' Cancela antes tu plan para que no se renueve.' : ''}</p>
        <label htmlFor="confirm" className="mb-1 block text-sm">Escribe <b>BORRAR</b> para confirmar</label>
        <div className="flex gap-2">
          <input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-40 rounded-sm border border-border-input bg-surface-raised px-3 py-2 focus:border-text focus:outline-none" />
          <button type="button" disabled={confirm !== 'BORRAR' || deleting} onClick={del} className="rounded-full bg-danger px-5 py-2 font-bold text-bg disabled:opacity-40">{deleting ? 'Borrando…' : 'Borrar mi cuenta'}</button>
        </div>
      </section>
    </>
  );
}

function Demo() {
  const { userName, signOut } = useLibrary();
  const router = useRouter();
  if (!userName) return <p className="text-text-muted">No has entrado. <Link href="/login" className="underline">Entrar</Link></p>;
  return (
    <>
      <div className="mb-4 rounded-lg bg-surface-raised p-5"><p className="text-sm text-text-muted">Plan</p><p className="text-lg font-bold">Escuchar · gratis</p>
        <p className="mt-2 text-sm text-text-muted">Versión de prueba sin cuentas reales ni pagos.</p></div>
      <div className="flex gap-3">
        <Link href="/settings" className="rounded-full border border-text-subtle px-5 py-2 font-bold hover:border-text">Ajustes</Link>
        <button type="button" onClick={() => { signOut(); router.push('/'); }} className="rounded-full px-5 py-2 font-bold text-text-muted hover:text-text">Cerrar sesión</button>
      </div>
    </>
  );
}

export default function Account() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Tu cuenta</h1>
      <Suspense>{backendEnabled ? <Real /> : <Demo />}</Suspense>
    </div>
  );
}
