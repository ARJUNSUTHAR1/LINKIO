import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Rate limiting for sign-in attempts
        const clientIp = req?.headers?.["x-forwarded-for"]?.split(",")[0] || 
                         req?.headers?.["x-real-ip"] || 
                         "127.0.0.1";
        
        const result = await rateLimit(`auth:signin:${clientIp}:${credentials.email}`, rateLimitConfigs.auth);
        
        if (!result.success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string;
        session.user.plan = token.plan as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
      }

      return session;
    },
    async jwt({ token, user }) {
      // If this is the first sign in (user object exists)
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Always fetch the latest user data from database to get subscription updates
      // This ensures the session always has the most current plan info
      if (token.email) {
        const dbUser = await db.user.findFirst({
          where: {
            email: token.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            plan: true,
            subscriptionStatus: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.plan = dbUser.plan;
          token.subscriptionStatus = dbUser.subscriptionStatus;
        }
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
