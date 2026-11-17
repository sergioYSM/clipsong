import 'server-only';
import Stripe from 'stripe';
import { serverEnv } from './env.server';
let s: Stripe | null = null;
export function stripe(): Stripe { return (s ??= new Stripe(serverEnv().STRIPE_SECRET_KEY)); }
