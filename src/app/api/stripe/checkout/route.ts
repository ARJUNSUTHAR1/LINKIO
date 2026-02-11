import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get("plan")?.toLowerCase();
    const billing = searchParams.get("billing") || "monthly";

    if (!plan || (plan !== "pro" && plan !== "business")) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Get the plan configuration
    const planConfig = STRIPE_PLANS[plan as "pro" | "business"];
    const billingConfig = billing === "yearly" ? planConfig.yearly : planConfig.monthly;
    
    let lineItems;

    // Check if we have pre-configured Price IDs
    if (billingConfig.priceId) {
      // Use pre-configured Price ID from Stripe Dashboard
      lineItems = [
        {
          price: billingConfig.priceId,
          quantity: 1,
        },
      ];
    } else {
      // Create price on-the-fly (useful for testing without setting up products in Stripe)
      console.log(`Creating dynamic price for ${plan} ${billing}`);
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: billingConfig.price,
            recurring: {
              interval: (billing === "yearly" ? "year" : "month") as "month" | "year",
            },
          },
          quantity: 1,
        },
      ];
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email!,
      client_reference_id: session.user.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${req.nextUrl.origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan: plan,
        billing: billing,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan: plan,
          billing: billing,
        },
      },
    });

    // Redirect to Stripe checkout
    return NextResponse.redirect(checkoutSession.url!);
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
