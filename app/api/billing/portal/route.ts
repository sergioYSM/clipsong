import { backendEnabled } from '@/lib/config';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe.server';
import { db } from '@/lib/db.server';
import { rateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/lib/config';

// Stripe Customer Portal: change plan or cancel (at period end) in two clicks.
export async function POST() {
  if (!backendEnabled) return NextResponse.json({ error: 'Las cuentas aún no están activadas en este servidor.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entra en tu cuenta primero.' }, { status: 401 });
  if (!rateLimit(`portal:${user.id}`, 10, 60_000)) return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  const r = await db().query('select stripe_customer_id from subscriptions where user_id = $1', [user.id]);
  if (!r.rows[0]) return NextResponse.json({ error: 'Aún no tienes ninguna suscripción.' }, { status: 404 });
  const session = await stripe().billingPortal.sessions.create({ customer: r.rows[0].stripe_customer_id, return_url: `${SITE_URL}/account` });
  return NextResponse.json({ url: session.url });
}
