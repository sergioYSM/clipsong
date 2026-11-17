'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLibrary } from '@/store/library';

// Demo sign-in: stores a display name locally. /replica-backend replaces it
// with Supabase Auth (magic link + Google).
export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const signIn = useLibrary((s) => s.signIn);
  const router = useRouter();
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-2 text-2xl font-extrabold">Música que puedes usar. Empieza gratis.</h1>
      <p className="mb-6 text-text-muted">Versión de prueba: tu cuenta se guarda solo en este navegador.</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Escribe un correo válido, por ejemplo nombre@correo.com.'); signIn(name || email.split('@')[0]); router.push('/'); }}>
        <label htmlFor="name" className="mb-1 block text-sm font-bold">Cómo te llamamos</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mb-4 w-full rounded-sm border border-border-input bg-surface-raised px-3 py-3 focus:border-text focus:outline-none" />
        <label htmlFor="email" className="mb-1 block text-sm font-bold">Correo electrónico</label>
        <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} autoComplete="email" aria-invalid={!!err} aria-describedby={err ? 'email-err' : undefined} className="mb-2 w-full rounded-sm border border-border-input bg-surface-raised px-3 py-3 focus:border-text focus:outline-none" />
        {err && <p id="email-err" role="alert" className="mb-2 text-sm text-danger">{err}</p>}
        <button type="submit" className="mt-4 w-full rounded-full bg-accent py-3 font-bold text-accent-on hover:scale-[1.02]">Crear cuenta</button>
      </form>
    </div>
  );
}
