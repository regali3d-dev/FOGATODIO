import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Persistent Stripe Payment Links Storage (e.g. https://buy.stripe.com/...)
const linksFilePath = path.resolve(__dirname, 'stripe-links.json');

function getStoredLinks(): { blitz: string; custom_mannequins: string } {
  let saved: { blitz?: string; custom_mannequins?: string } = {};
  try {
    if (fs.existsSync(linksFilePath)) {
      const content = fs.readFileSync(linksFilePath, 'utf8');
      saved = JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading stripe-links.json:', e);
  }
  return {
    blitz:
      saved.blitz ||
      process.env.STRIPE_PAYMENT_URL_050 ||
      process.env.STRIPE_PAYMENT_LINK_050 ||
      process.env.STRIPE_PAYMENT_URL ||
      'https://buy.stripe.com/00wbJ39aie8lg7F7OBbII02',
    custom_mannequins:
      saved.custom_mannequins ||
      process.env.STRIPE_PAYMENT_URL_2EUR ||
      process.env.STRIPE_PAYMENT_LINK_2EUR ||
      'https://buy.stripe.com/aFa14p86e4xLbRp8SFbII01',
  };
}

function saveStoredLinks(links: { blitz?: string; custom_mannequins?: string }) {
  try {
    const current = getStoredLinks();
    const updated = {
      blitz: typeof links.blitz === 'string' && links.blitz.trim() ? links.blitz.trim() : current.blitz,
      custom_mannequins: typeof links.custom_mannequins === 'string' && links.custom_mannequins.trim() ? links.custom_mannequins.trim() : current.custom_mannequins,
    };
    fs.writeFileSync(linksFilePath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (e) {
    console.error('Error saving stripe-links.json:', e);
    return links;
  }
}

// Initialize Stripe configuration
const rawKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
// Detect secret key properly even if STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY were inverted
const secretCandidate = [process.env.STRIPE_SECRET_KEY, process.env.STRIPE_PUBLISHABLE_KEY]
  .find((k) => typeof k === 'string' && (k.startsWith('sk_') || k.startsWith('rk_'))) || '';
const stripe = secretCandidate ? new Stripe(secretCandidate) : null;

// Publishable key (from pk_ live key or fallback)
const publishableKey =
  [process.env.STRIPE_PUBLISHABLE_KEY, process.env.STRIPE_SECRET_KEY, process.env.VITE_STRIPE_PUBLISHABLE_KEY]
    .find((k) => typeof k === 'string' && k.startsWith('pk_')) ||
  'pk_live_51T7c4LQZe9HipnWgXKrbXrh7bu2IaRiwewhloYHcz31b9SAmRRPDsTXxVUiynzDeJemuPw7f42lD2jTai8eAsl9200c68KAvDS';

const DEFAULT_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1UO21bQZe9HipnWgRUbGG58Z';
const CUSTOM_PRICE_ID = process.env.STRIPE_CUSTOM_PRICE_ID || process.env.STRIPE_PRICE_2EUR || 'price_1UOCnEQZe9HipnWgmWR7SCTb';

// Stripe Checkout Session & Payment Page Route
app.post('/api/create-checkout-session', async (req: Request, res: Response) => {
  const { priceId = DEFAULT_PRICE_ID, tier = 'blitz' } = req.body || {};
  const origin = (req.headers.origin as string) || (req.headers.referer as string) || process.env.APP_URL || `http://localhost:${port}`;
  const cleanOrigin = origin.replace(/\/$/, '');

  const storedLinks = getStoredLinks();
  const directLink = tier === 'custom_mannequins' ? storedLinks.custom_mannequins : (storedLinks.blitz || storedLinks.custom_mannequins);

  // If a Stripe Payment Link (https://buy.stripe.com/...) is configured, use it directly!
  if (directLink && directLink.startsWith('http')) {
    return res.json({
      success: true,
      url: directLink,
      isPaymentLink: true,
      tier,
      priceId,
    });
  }

  // If Stripe secret key is set, create a real Stripe Checkout session
  if (stripe) {
    try {
      const line_items =
        tier === 'custom_mannequins'
          ? CUSTOM_PRICE_ID
            ? [{ price: CUSTOM_PRICE_ID, quantity: 1 }]
            : [
                {
                  price_data: {
                    currency: 'eur',
                    product_data: {
                      name: 'Sfogatoio 3D · Manichini Personalizzati (28 Bersagli)',
                      description: '1 minuto senza conseguenze con armata di 28 manichini personalizzati.',
                    },
                    unit_amount: 200, // €2.00
                  },
                  quantity: 1,
                },
              ]
          : [
              {
                price: priceId,
                quantity: 1,
              },
            ];

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: `${cleanOrigin}/?payment=success&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${cleanOrigin}/?payment=cancelled`,
      });

      return res.json({
        success: true,
        url: session.url,
        id: session.id,
        priceId,
        tier,
      });
    } catch (error: any) {
      console.error('Stripe Checkout Error:', error);
      return res.status(500).json({
        success: false,
        error: 'STRIPE_API_ERROR',
        message: error?.message || 'Errore durante la creazione del checkout Stripe',
        priceId,
        tier,
      });
    }
  }

  // Neither Secret Key nor Stripe Payment Link is configured yet
  return res.json({
    success: false,
    url: null,
    needsConfiguration: true,
    hasPublishableKeyOnly: rawKey.startsWith('pk_'),
    publishableKey,
    tier,
    priceId: tier === 'custom_mannequins' ? (CUSTOM_PRICE_ID || 'price_1UO21bQZe9HipnWgRUbGG58Z') : priceId,
    message: rawKey.startsWith('pk_')
      ? 'Rilevata chiave Pubblicabile (pk_live_...). Per collegare la pagina di pagamento Stripe, inserisci il link della pagina Stripe (https://buy.stripe.com/...) oppure la Chiave Segreta (sk_live_...).'
      : 'Collega la pagina di pagamento Stripe (https://buy.stripe.com/...) per iniziare.',
  });
});

// Endpoint to get and save direct Stripe Payment Links (https://buy.stripe.com/...)
app.get('/api/payment-links', (_req: Request, res: Response) => {
  const links = getStoredLinks();
  res.json({
    links,
    hasSecretKey: Boolean(stripe),
    hasPublishableKeyOnly: rawKey.startsWith('pk_'),
    publishableKey,
  });
});

app.post('/api/payment-links', (req: Request, res: Response) => {
  const { blitz, custom_mannequins } = req.body || {};
  const updated = saveStoredLinks({ blitz, custom_mannequins });
  res.json({
    success: true,
    links: updated,
  });
});

// Endpoint to check Stripe connection state and provide publishable key
app.get('/api/stripe-config', (_req: Request, res: Response) => {
  const links = getStoredLinks();
  res.json({
    hasSecretKey: Boolean(stripe),
    hasPaymentLinks: Boolean(links.blitz || links.custom_mannequins),
    links,
    publishableKey,
    priceId: DEFAULT_PRICE_ID,
    isPublishableKeyProvided: Boolean(publishableKey),
  });
});

app.get('/api/stripe-status', (_req: Request, res: Response) => {
  res.json({
    configured: Boolean(stripe),
    priceId: DEFAULT_PRICE_ID,
    publishableKey,
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Sfogatoio server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
