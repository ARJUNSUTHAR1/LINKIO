import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if already canceling or canceled
    if (user.subscriptionStatus === "canceled" || user.subscriptionStatus === "canceling") {
      return NextResponse.json(
        { error: "Subscription is already canceled or being canceled" },
        { status: 400 }
      );
    }

    // Cancel the subscription at period end (user keeps access until billing period ends)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update status to "canceling" to indicate scheduled cancellation
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "canceling",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period. You'll retain access until then.",
      cancelAt: new Date(subscription.cancel_at! * 1000),
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
