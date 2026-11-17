// Webhook tests: real signature verification (offline) + a real database.
// Usage: DATABASE_URL=... node --test lib/billing/webhook.test.ts
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import Stripe from 'stripe';
import { handleStripeEvent } from './webhook.ts';

const secret = 'whsec_test_local_only';
const stripe = new Stripe('sk_test_dummy_never_used_for_network');
const env = { STRIPE_PRICE_CREADOR_MONTHLY: 'price_cm', STRIPE_PRICE_CREADOR_YEARLY: 'price_cy', STRIPE_PRICE_ESTUDIO_MONTHLY: 'price_em', STRIPE_PRICE_ESTUDIO_YEARLY: 'price_ey' };
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
let user = '';

function signed(payload: object) {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return stripe.webhooks.constructEvent(body, header, secret);   // the same call the route makes
}
const ev = (id: string, type: string, object: object) => ({ id, object: 'event', type, data: { object }, created: 1, livemode: false, api_version: '2025-08-27', pending_webhooks: 0, request: null });
const sub = async () => (await c.query('select plan, status, cancel_at_period_end, current_period_end from subscriptions where user_id = $1', [user])).rows[0];

before(async () => {
  await c.connect();
  await c.query(`delete from auth.users where email = 'pay@billing.invalid'`);
  user = (await c.query(`insert into auth.users (email) values ('pay@billing.invalid') returning id`)).rows[0].id;
  await c.query(`delete from stripe_events where id like 'evt_t_%'`);
});
after(async () => { await c.query(`delete from auth.users where id = $1`, [user]); await c.query(`delete from stripe_events where id like 'evt_t_%'`); await c.end(); });

test('a tampered payload fails signature verification', () => {
  const body = JSON.stringify(ev('evt_t_x', 'invoice.payment_failed', { customer: 'cus_t' }));
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  assert.throws(() => stripe.webhooks.constructEvent(body.replace('cus_t', 'cus_evil'), header, secret));
  assert.throws(() => stripe.webhooks.constructEvent(body, header, 'whsec_wrong'));
});

test('checkout completed creates the subscription; a repeat delivery is a no-op', async () => {
  const e = signed(ev('evt_t_1', 'checkout.session.completed', { object: 'checkout.session', client_reference_id: user, customer: 'cus_t', subscription: 'sub_t', metadata: { plan: 'creador' } }));
  assert.equal(await handleStripeEvent(e, c, env), 'processed');
  assert.equal((await sub()).plan, 'creador');
  await c.query(`update subscriptions set plan = 'estudio' where user_id = $1`, [user]);  // simulate a later change
  assert.equal(await handleStripeEvent(e, c, env), 'duplicate');
  assert.equal((await sub()).plan, 'estudio', 'the retried event did not overwrite newer state');
});

test('subscription updated: plan from the price id, cancel at period end, period end stored', async () => {
  const e = signed(ev('evt_t_2', 'customer.subscription.updated', { object: 'subscription', id: 'sub_t', customer: 'cus_t', status: 'active', cancel_at_period_end: true,
    items: { data: [{ price: { id: 'price_ey' }, current_period_end: 1893456000 }] } }));
  assert.equal(await handleStripeEvent(e, c, env), 'processed');
  const s = await sub();
  assert.equal(s.plan, 'estudio'); assert.equal(s.cancel_at_period_end, true);
  assert.equal(new Date(s.current_period_end).toISOString(), '2030-01-01T00:00:00.000Z');
});

test('payment failed marks past_due; subscription deleted returns to free', async () => {
  await handleStripeEvent(signed(ev('evt_t_3', 'invoice.payment_failed', { object: 'invoice', customer: 'cus_t' })), c, env);
  assert.equal((await sub()).status, 'past_due');
  await handleStripeEvent(signed(ev('evt_t_4', 'customer.subscription.deleted', { object: 'subscription', id: 'sub_t', customer: 'cus_t' })), c, env);
  const s = await sub();
  assert.equal(s.plan, 'free'); assert.equal(s.status, 'canceled');
});

test('unknown price id never grants a paid plan', async () => {
  await handleStripeEvent(signed(ev('evt_t_5', 'customer.subscription.updated', { object: 'subscription', id: 'sub_t', customer: 'cus_t', status: 'active', cancel_at_period_end: false, items: { data: [{ price: { id: 'price_someone_else' } }] } })), c, env);
  assert.equal((await sub()).plan, 'free');
});

test('events without a user are ignored, not crashing', async () => {
  assert.equal(await handleStripeEvent(signed(ev('evt_t_6', 'checkout.session.completed', { object: 'checkout.session', customer: 'cus_x' })), c, env), 'ignored');
  assert.equal(await handleStripeEvent(signed(ev('evt_t_7', 'charge.refunded', { object: 'charge' })), c, env), 'ignored');
});
