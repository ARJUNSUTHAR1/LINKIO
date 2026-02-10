import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          plan: "free",
          status: "inactive",
          currentPeriodEnd: null,
          hasActiveSubscription: false,
        },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          plan: "free",
          status: "inactive",
          currentPeriodEnd: null,
          hasActiveSubscription: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      plan: user.plan || "free",
      status: user.subscriptionStatus || "inactive",
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      hasActiveSubscription: 
        user.subscriptionStatus === "active" || 
        user.subscriptionStatus === "trialing",
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { 
        plan: "free",
        status: "inactive",
        currentPeriodEnd: null,
        hasActiveSubscription: false,
      },
      { status: 200 }
    );
  }
}
