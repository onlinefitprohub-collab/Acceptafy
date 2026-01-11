import Stripe from 'stripe';
import { PRICING } from '@shared/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as any,
});

async function setupStripeProducts() {
  console.log('Setting up Stripe products and prices...\n');

  const products: { tier: string; name: string; monthly: number; yearly: number }[] = [
    { tier: 'pro', name: 'Acceptafy Pro', monthly: PRICING.pro.monthly, yearly: PRICING.pro.yearly },
    { tier: 'scale', name: 'Acceptafy Scale', monthly: PRICING.scale.monthly, yearly: PRICING.scale.yearly },
  ];

  for (const { tier, name, monthly, yearly } of products) {
    console.log(`Creating product: ${name}...`);
    
    const existingProducts = await stripe.products.list({ limit: 100 });
    let product = existingProducts.data.find(p => p.metadata?.tier === tier);
    
    if (!product) {
      product = await stripe.products.create({
        name,
        description: `${name} subscription plan`,
        metadata: { tier },
      });
      console.log(`  Created product: ${product.id}`);
    } else {
      console.log(`  Product already exists: ${product.id}`);
    }

    const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
    
    const monthlyPrice = existingPrices.data.find(
      p => p.recurring?.interval === 'month' && p.unit_amount === monthly * 100
    );
    if (!monthlyPrice) {
      const newMonthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: monthly * 100,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { tier, billing_period: 'monthly' },
      });
      console.log(`  Created monthly price: $${monthly}/mo (${newMonthlyPrice.id})`);
    } else {
      console.log(`  Monthly price already exists: ${monthlyPrice.id}`);
    }

    const yearlyPrice = existingPrices.data.find(
      p => p.recurring?.interval === 'year' && p.unit_amount === yearly * 100
    );
    if (!yearlyPrice) {
      const newYearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: yearly * 100,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { tier, billing_period: 'yearly' },
      });
      console.log(`  Created yearly price: $${yearly}/yr (${newYearlyPrice.id})`);
    } else {
      console.log(`  Yearly price already exists: ${yearlyPrice.id}`);
    }
  }

  console.log('\nCreating retention coupon...');
  const coupons = await stripe.coupons.list({ limit: 100 });
  let retentionCoupon = coupons.data.find(c => c.name === 'Stay With Us - 50% Off');
  
  if (!retentionCoupon) {
    retentionCoupon = await stripe.coupons.create({
      name: 'Stay With Us - 50% Off',
      percent_off: 50,
      duration: 'once',
      metadata: { type: 'retention' },
    });
    console.log(`  Created retention coupon: ${retentionCoupon.id}`);
  } else {
    console.log(`  Retention coupon already exists: ${retentionCoupon.id}`);
  }

  console.log('\n✅ Stripe setup complete!');
}

setupStripeProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
