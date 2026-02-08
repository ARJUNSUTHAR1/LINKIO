"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/debug")
      .then((res) => res.json())
      .then((data) => setDebugInfo(data))
      .catch((err) => console.error("Debug API error:", err));
  }, []);

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Authentication Debug Page</h1>

        {/* Client-side session check */}
        <div className="border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Client-Side Session (useSession)
          </h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  status === "authenticated"
                    ? "text-green-400"
                    : status === "unauthenticated"
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              >
                {status}
              </span>
            </p>
            <p>
              <strong>Has Session:</strong>{" "}
              {session ? "✅ Yes" : "❌ No"}
            </p>
            {session && (
              <div className="mt-4 p-4 bg-white/5 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Server-side debug info */}
        <div className="border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Server-Side Debug Info
          </h2>
          {debugInfo ? (
            <div className="space-y-2">
              <p>
                <strong>Has Session:</strong>{" "}
                {debugInfo.hasSession ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Has Token:</strong>{" "}
                {debugInfo.hasToken ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>NEXTAUTH_SECRET exists:</strong>{" "}
                {debugInfo.env?.hasNextAuthSecret ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>NEXTAUTH_URL exists:</strong>{" "}
                {debugInfo.env?.hasNextAuthUrl ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>NODE_ENV:</strong> {debugInfo.env?.nodeEnv}
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-yellow-400">Loading debug info...</p>
          )}
        </div>

        {/* Instructions */}
        <div className="border border-blue-500/50 bg-blue-500/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">What to Check:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Both client and server should show authentication status
            </li>
            <li>NEXTAUTH_SECRET must exist (check .env.local)</li>
            <li>After signing in, both should show "authenticated"</li>
            <li>If server shows token but client doesn't, there's a session issue</li>
            <li>Check browser console and terminal for error messages</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <a
            href="/auth/sign-in"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Go to Sign In
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            Go to Dashboard
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
