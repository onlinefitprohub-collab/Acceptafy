import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { startScheduler } from "./services/blacklistScheduler";
import { startMonthlyResetScheduler } from "./services/monthlyResetScheduler";
import { startOnboardingEmailScheduler } from "./emailService";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Idempotent: creates Pro and Scale products in Stripe if they don't exist yet.
// Checked by metadata.tier so duplicates are never created even on repeated restarts.
async function ensureStripeProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    const existingTiers = new Map<string, string>(); // tier → productId
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
      if (product.metadata?.tier) {
        existingTiers.set(product.metadata.tier, product.id);
      }
    }

    const needed = [
      { name: 'Acceptafy Pro',   tier: 'pro',   monthlyUsd: 59,  yearlyUsd: 590  },
      { name: 'Acceptafy Scale', tier: 'scale', monthlyUsd: 149, yearlyUsd: 1490 },
    ];

    let seeded = 0;
    for (const { name, tier, monthlyUsd, yearlyUsd } of needed) {
      if (existingTiers.has(tier)) continue;

      const product = await stripe.products.create({ name, metadata: { tier } });
      await stripe.prices.create({
        product: product.id,
        unit_amount: monthlyUsd * 100,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      await stripe.prices.create({
        product: product.id,
        unit_amount: yearlyUsd * 100,
        currency: 'usd',
        recurring: { interval: 'year' },
      });
      console.log(`[Stripe] Seeded product: ${name} (${tier})`);
      seeded++;
    }

    if (seeded === 0) {
      console.log('[Stripe] Products already exist, skipping seed');
    } else {
      console.log(`[Stripe] Seeded ${seeded} missing product(s)`);
    }
  } catch (err) {
    console.error('[Stripe] Auto-seed failed (non-fatal):', err);
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('DATABASE_URL not found, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    // Ensure Pro and Scale products exist before syncing
    await ensureStripeProducts();

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
      })
      .catch((err: Error) => {
        console.error('Error syncing Stripe data:', err);
      });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

(async () => {
  await initStripe();

  app.post(
    '/api/stripe/webhook/:uuid',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
          return res.status(500).json({ error: 'Webhook processing error' });
        }

        const { uuid } = req.params;
        await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).json({ error: 'Webhook processing error' });
      }
    }
  );

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      startScheduler();
      startMonthlyResetScheduler();
      startOnboardingEmailScheduler();
    },
  );
})();
