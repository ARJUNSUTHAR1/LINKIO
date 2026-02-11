import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover" as any,
  typescript: true,
});

export const STRIPE_PLANS = {
  pro: {
    name: "Pro Plan",
    description: "Perfect for small businesses",
    monthly: {
      price: 900, // $9.00 in cents
      priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    },
    yearly: {
      price: 9504, // $95.04 in cents (12 months - 12% discount)
      priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
  },
  business: {
    name: "Business Plan",
    description: "For large organizations",
    monthly: {
      price: 4900, // $49.00 in cents
      priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    },
    yearly: {
      price: 51744, // $517.44 in cents (12 months - 12% discount)
      priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    },
  },
};
