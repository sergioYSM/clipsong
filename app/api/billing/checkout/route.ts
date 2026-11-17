import { backendEnabled } from '@/lib/config';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe.server';
import { serverEnv } from '@/lib/env.server';
import { db } from '@/lib/db.server';
import { priceEnvName } from '@/lib/billing/plans';
import { rateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/lib/config';

const Body = z.object({ plan: z.enum(['creador', 'estudio']), interval: z.enum(['monthly', 'yearly']) });

export async function POST(req: Request) {
  if (!backendEnabled) return NextResponse.json({ error: 'Las cuentas aún no están activadas en este servidor.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Entra en tu cuenta primero.' }, { status: 401 });
  if (!rateLimit(`checkout:${user.id}`, 5, 60_000)) return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });
  const { plan, interval } = parsed.data;
  const env = serverEnv();

  // one Stripe customer per user, created once and stored
  const existing = await db().query('select stripe_customer_id, plan, status from subscriptions where user_id = $1', [user.id]);
  const row = existing.rows[0];
  if (row && row.plan !== 'free' && ['active', 'trialing', 'past_due'].includes(row.status))
    return NextResponse.json({ error: 'Ya tienes un plan. Cámbialo desde «Gestionar suscripción».' }, { status: 409 });
  let customer = row?.stripe_customer_id as string | undefined;
  if (!customer) {
    customer = (await stripe().customers.create({ email: user.email, metadata: { user_id: user.id } }, { idempotencyKey: `customer-${user.id}` })).id;
    await db().query(`insert into subscriptions (user_id, stripe_customer_id) values ($1, $2) on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id`, [user.id, customer]);
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price: env[priceEnvName(plan, interval)], quantity: 1 }],
    metadata: { plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto' },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/account?checkout=ok`,
    cancel_url: `${SITE_URL}/account?checkout=cancelled`,
  });
  return NextResponse.json({ url: session.url });
}
