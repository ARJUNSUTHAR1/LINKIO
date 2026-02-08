import { db } from "@/lib";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get("key");
    const password = searchParams.get("password");

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const link = await db.link.findFirst({
      where: {
        key: key,
      },
    });

    if (!link) {
      return NextResponse.redirect(new URL("/404", req.url));
    }

    if (link.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }

      const isPasswordValid = await compare(password, link.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid password", requiresPassword: true },
          { status: 401 }
        );
      }
    }

    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    let device = "Desktop";
    if (/mobile/i.test(userAgent)) device = "Mobile";
    if (/tablet/i.test(userAgent)) device = "Tablet";

    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    let os = "Unknown";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";

    await db.link.update({
      where: { id: link.id },
      data: {
        clicks: { increment: 1 },
        lastClicked: new Date(),
      },
    });

    await db.linkAnalytics.create({
      data: {
        linkId: link.id,
        device,
        browser,
        os,
        referer: referer || null,
      },
    });

    return NextResponse.redirect(link.url);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
