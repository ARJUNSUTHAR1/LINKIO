import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "127.0.0.1";
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  // Debug logging
  const cookies = req.cookies.getAll();
  const sessionCookie = cookies.find(c => c.name.includes('next-auth'));
  
  console.log("=====================================");
  console.log("Middleware Debug:");
  console.log("Path:", url);
  console.log("Has Token:", !!token);
  console.log("Has NEXTAUTH_SECRET:", !!process.env.NEXTAUTH_SECRET);
  console.log("Session Cookie:", sessionCookie ? sessionCookie.name : "NOT FOUND");
  console.log("All Cookies:", cookies.map(c => c.name).join(", "));
  if (token) {
    console.log("Token Email:", token.email);
  }
  console.log("=====================================");

  if (!token && url.startsWith("/dashboard")) {
    console.log("Redirecting to sign-in - no token");
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  if (token && (url === "/auth/sign-in" || url === "/auth/sign-up")) {
    console.log("Redirecting to dashboard - has token");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
  ],
};
