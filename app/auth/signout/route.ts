import { backendEnabled } from '@/lib/config';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// POST only (a GET link could be triggered by an image tag). scope=global signs out every device.
export async function POST(req: Request) {
  if (!backendEnabled) return NextResponse.json({ error: 'Las cuentas aún no están activadas en este servidor.' }, { status: 503 });
  const everywhere = new URL(req.url).searchParams.get('scope') === 'global';
  const sb = await supabaseServer();
  await sb.auth.signOut({ scope: everywhere ? 'global' : 'local' });
  return NextResponse.json({ ok: true });
}
