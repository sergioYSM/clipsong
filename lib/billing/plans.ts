export type Plan = 'free' | 'creador' | 'estudio';
export type Interval = 'monthly' | 'yearly';

export type PriceEnv = 'STRIPE_PRICE_CREADOR_MONTHLY' | 'STRIPE_PRICE_CREADOR_YEARLY' | 'STRIPE_PRICE_ESTUDIO_MONTHLY' | 'STRIPE_PRICE_ESTUDIO_YEARLY';
export function priceEnvName(plan: Exclude<Plan, 'free'>, interval: Interval): PriceEnv {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}` as PriceEnv;
}

/** Map a Stripe price id back to our plan, using the env the server was given. */
export function planForPrice(priceId: string | undefined, env: Record<string, string | undefined>): Plan {
  if (!priceId) return 'free';
  for (const plan of ['creador', 'estudio'] as const)
    for (const iv of ['monthly', 'yearly'] as const)
      if (env[priceEnvName(plan, iv)] === priceId) return plan;
  return 'free';
}
