import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db as prisma } from "@/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // If webhook secret is not configured, skip webhook handling
    // (Payment verification is handled by /api/stripe/verify-payment instead)
    if (!webhookSecret) {
      console.log("⚠️  Webhook secret not configured. Webhooks disabled (using payment verification instead)");
      return NextResponse.json({ 
        message: "Webhooks not configured. Using payment verification endpoint instead." 
      });
    }

    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update user's subscription in database
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              plan: plan,
              subscriptionStatus: subscription.status,
              subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          console.log("✅ Subscription created and saved:", {
            userId,
            plan,
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status in database
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripePriceId: subscription.items.data[0].price.id,
          },
        });

        console.log("✅ Subscription updated:", subscription.id, subscription.status);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Revert user to free plan
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });

        console.log("✅ Subscription canceled, user reverted to free plan:", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Update subscription status
        if (invoice.subscription) {
          await prisma.user.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              subscriptionStatus: "past_due",
            },
          });
        }

        console.log("⚠️ Payment failed:", invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
