// Stripe webhook handling, separated from the route so it can be tested
// against a real database. Every handler is idempotent: the event id is stored
// first, and a repeat delivery does nothing.
import type Stripe from 'stripe';
import { planForPrice } from './plans.ts';

export interface Db { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> }

const toTs = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);
const statuses = new Set(['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid']);

export async function handleStripeEvent(event: Stripe.Event, db: Db, env: Record<string, string | undefined>): Promise<'processed' | 'duplicate' | 'ignored'> {
  const fresh = await db.query('insert into stripe_events (id, type) values ($1, $2) on conflict (id) do nothing', [event.id, event.type]);
  if (!fresh.rowCount) return 'duplicate';

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      const customer = typeof s.customer === 'string' ? s.customer : s.customer?.id;
      if (!userId || !customer) return 'ignored';
      const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? null;
      const plan = (s.metadata?.plan as string) ?? 'free';
      await db.query(
        `insert into subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan, status)
         values ($1, $2, $3, $4, 'active')
         on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id,
           stripe_subscription_id = excluded.stripe_subscription_id, plan = excluded.plan, status = 'active', updated_at = now()`,
        [userId, customer, subId, ['creador', 'estudio'].includes(plan) ? plan : 'free']);
      return 'processed';
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const item = sub.items.data[0];
      const plan = planForPrice(item?.price.id, env);
      const periodEnd = (item as any)?.current_period_end ?? (sub as any).current_period_end;
      await db.query(
        `update subscriptions set stripe_subscription_id = $2, plan = $3, status = $4, cancel_at_period_end = $5,
           current_period_end = $6, updated_at = now() where stripe_customer_id = $1`,
        [sub.customer as string, sub.id, plan, statuses.has(sub.status) ? sub.status : 'incomplete', sub.cancel_at_period_end, toTs(periodEnd)]);
      return 'processed';
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.query(`update subscriptions set plan = 'free', status = 'canceled', cancel_at_period_end = false, updated_at = now() where stripe_customer_id = $1`, [sub.customer as string]);
      return 'processed';
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      await db.query(`update subscriptions set status = 'past_due', updated_at = now() where stripe_customer_id = $1`, [inv.customer as string]);
      return 'processed';
    }
    default:
      return 'ignored';
  }
}
