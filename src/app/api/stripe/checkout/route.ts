import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing") || "monthly";

    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with Stripe
    // For now, redirect to dashboard with a message
    // In production, you would:
    // 1. Create a Stripe checkout session
    // 2. Redirect to Stripe checkout page
    // 3. Handle webhook for successful payment
    // 4. Update user's subscription in database

    console.log("Stripe checkout request:", {
      userId: session.user.id,
      email: session.user.email,
      plan,
      billing,
    });

    // Temporary: Redirect to dashboard with success message
    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("upgrade", "pending");
    dashboardUrl.searchParams.set("plan", plan);
    
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
