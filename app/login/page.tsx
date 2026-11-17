'use client';
import { useTitle } from '@/lib/useTitle';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLibrary } from '@/store/library';
import { backendEnabled, SITE_URL } from '@/lib/config';
import { supabaseBrowser } from '@/lib/supabase/browser';

const input = 'w-full rounded-sm border border-border-input bg-surface-raised px-3 py-3 focus:border-text focus:outline-none';
const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

function RealLogin() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState(params.get('error') === 'link' ? 'El enlace ha caducado o ya se usó. Pide uno nuevo.' : '');
  const next = params.get('next') ?? '/';
  const redirect = `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) return setErr('Escribe un correo válido, por ejemplo nombre@correo.com.');
    setState('sending'); setErr('');
    const { error } = await supabaseBrowser()!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) { setState('idle'); setErr(error.status === 429 ? 'Has pedido muchos enlaces seguidos. Espera un minuto.' : 'No hemos podido enviar el enlace. Inténtalo de nuevo.'); }
    else setState('sent');
  };

  if (state === 'sent') return (
    <div className="rounded-lg bg-surface-raised p-6">
      <h2 className="mb-2 text-lg font-bold">Revisa tu correo</h2>
      <p className="text-text-muted">Te hemos enviado un enlace a <b className="text-text">{email}</b>. Ábrelo en este dispositivo para entrar. Caduca en una hora.</p>
      <button type="button" onClick={() => setState('idle')} className="mt-4 text-sm font-bold underline">Usar otro correo</button>
    </div>
  );
  return (
    <>
      <button type="button" onClick={() => supabaseBrowser()!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect } })}
        className="mb-4 w-full rounded-full border border-text-subtle py-3 font-bold hover:border-text">Continuar con Google</button>
      <div className="mb-4 flex items-center gap-3 text-sm text-text-subtle"><span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" /></div>
      <form noValidate onSubmit={send}>
        <label htmlFor="email" className="mb-1 block text-sm font-bold">Correo electrónico</label>
        <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} autoComplete="email" aria-invalid={!!err} aria-describedby={err ? 'email-err' : undefined} className={`${input} mb-2`} />
        {err && <p id="email-err" role="alert" className="mb-2 text-sm text-danger">{err}</p>}
        <button type="submit" disabled={state === 'sending'} className="mt-4 w-full rounded-full bg-accent py-3 font-bold text-accent-on hover:scale-[1.02] disabled:opacity-60">{state === 'sending' ? 'Enviando…' : 'Enviarme un enlace para entrar'}</button>
        <p className="mt-3 text-sm text-text-muted">Sin contraseñas. Si no tienes cuenta, se crea al entrar.</p>
      </form>
    </>
  );
}

function DemoLogin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const signIn = useLibrary((s) => s.signIn);
  const router = useRouter();
  return (
    <>
      <p className="mb-6 text-text-muted">Versión de prueba: tu cuenta se guarda solo en este navegador.</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (!validEmail(email)) return setErr('Escribe un correo válido, por ejemplo nombre@correo.com.'); signIn(name || email.split('@')[0]); router.push('/'); }}>
        <label htmlFor="name" className="mb-1 block text-sm font-bold">Cómo te llamamos</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`${input} mb-4`} />
        <label htmlFor="email" className="mb-1 block text-sm font-bold">Correo electrónico</label>
        <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} autoComplete="email" aria-invalid={!!err} aria-describedby={err ? 'email-err' : undefined} className={`${input} mb-2`} />
        {err && <p id="email-err" role="alert" className="mb-2 text-sm text-danger">{err}</p>}
        <button type="submit" className="mt-4 w-full rounded-full bg-accent py-3 font-bold text-accent-on hover:scale-[1.02]">Crear cuenta</button>
      </form>
    </>
  );
}

export default function Login() {
  useTitle('Entrar');
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-extrabold">Música que puedes usar. Empieza gratis.</h1>
      <Suspense>{backendEnabled ? <RealLogin /> : <DemoLogin />}</Suspense>
    </div>
  );
}
