import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const PLANS = {
  starter: { name: 'Starter', priceId: process.env.STRIPE_PRICE_STARTER || null, amount: 0 },
  professional: { name: 'Professional', priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder', amount: 4900 },
  enterprise: { name: 'Enterprise', priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_ent_placeholder', amount: 0 },
};

export function getPlans() { return PLANS; }

export async function createCheckoutSession({ planId, customerEmail, successUrl, cancelUrl }) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { url: successUrl + '?demo=true', demo: true };
  }
  const plan = PLANS[planId];
  if (!plan || !plan.priceId) throw new Error('Ungültiger Plan');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'sepa_debit'],
    customer_email: customerEmail,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'de',
    metadata: { planId },
  });
  return { url: session.url, sessionId: session.id };
}

export async function createPortalSession({ customerId, returnUrl }) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { url: returnUrl + '?demo=true', demo: true };
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export async function handleWebhook(body, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return { received: true };
  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // TODO: Update user subscription in database
      console.log('Subscription created:', session.customer_email, session.metadata.planId);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('Subscription changed:', subscription.id, subscription.status);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('Payment failed:', invoice.customer_email);
      break;
    }
  }
  return { received: true };
}
