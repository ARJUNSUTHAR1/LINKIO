import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db as prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Verify the session belongs to this user
    if (
      checkoutSession.metadata?.userId !== session.user.id &&
      checkoutSession.client_reference_id !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized access to this session" },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const plan = checkoutSession.metadata?.plan || "free";
    const subscriptionId = checkoutSession.subscription as string;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Get full subscription details
    const subscription =
      typeof checkoutSession.subscription === "string"
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : (checkoutSession.subscription as any);

    // Update user's subscription in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        plan: plan,
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
      },
    });

    console.log("✅ Payment verified and subscription updated:", {
      userId: session.user.id,
      plan: updatedUser.plan,
      status: updatedUser.subscriptionStatus,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: updatedUser.plan,
        status: updatedUser.subscriptionStatus,
        currentPeriodEnd: updatedUser.subscriptionCurrentPeriodEnd,
      },
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
