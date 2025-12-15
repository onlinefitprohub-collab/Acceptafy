import { getStripeSync } from './stripeClient';
import { storage } from './storage';
import { sendPaymentFailedEmail } from './services/email';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil' as any,
    });
  }
  return stripeClient;
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // Parse the event to handle custom logic before syncing
    try {
      const stripe = getStripe();
      if (stripe) {
        const endpointSecret = await sync.getWebhookSecret(uuid);
        const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
        
        // Handle specific events
        await WebhookHandlers.handleEvent(event);
      }
    } catch (err) {
      console.error('Error parsing webhook event:', err);
    }
    
    // Always process with the sync library for database updates
    await sync.processWebhook(payload, signature, uuid);
  }

  static async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_failed':
        await WebhookHandlers.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        // Other events are handled by the sync library
        break;
    }
  }

  static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;
      if (!customerId) {
        console.log('Payment failed but no customer ID found');
        return;
      }

      // Find user by Stripe customer ID
      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user || !user.email) {
        console.log(`Payment failed for customer ${customerId} but no user found`);
        return;
      }

      // Format the amount due
      const amountDue = invoice.amount_due 
        ? `$${(invoice.amount_due / 100).toFixed(2)}`
        : 'your subscription amount';

      // Send payment failed email (non-blocking)
      sendPaymentFailedEmail(user.email, amountDue).catch(err => {
        console.error('Failed to send payment failed email:', err);
      });

      console.log(`Payment failed notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error handling payment failed event:', error);
    }
  }

  static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      if (!customerId) return;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) return;

      // Update user subscription status
      await storage.updateUser(user.id, {
        subscriptionStatus: subscription.status,
      });

      console.log(`Updated subscription status for user ${user.id} to ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription updated event:', error);
    }
  }
}
