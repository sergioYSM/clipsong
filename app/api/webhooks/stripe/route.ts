import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe.server';
import { serverEnv } from '@/lib/env.server';
import { db } from '@/lib/db.server';
import { handleStripeEvent } from '@/lib/billing/webhook';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  const body = await req.text();   // raw body: the signature is over the exact bytes
  let event;
  try { event = stripe().webhooks.constructEvent(body, sig, serverEnv().STRIPE_WEBHOOK_SECRET); }
  catch { return NextResponse.json({ error: 'bad signature' }, { status: 400 }); }
  try {
    const result = await handleStripeEvent(event, db(), process.env);
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error('stripe webhook failed', event.id, event.type, (e as Error).message);   // no customer data in logs
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });              // Stripe retries
  }
}
