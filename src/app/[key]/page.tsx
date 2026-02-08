"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderIcon, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LinkRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const key = params.key as string;

  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!key) {
      toast.error("Invalid link");
      router.push("/");
      return;
    }
    checkLink();
  }, [key]);

  const checkLink = async () => {
    if (!key) return;
    
    try {
      const response = await fetch(`/api/links/redirect?key=${encodeURIComponent(key)}`);
      
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();

      if (data.requiresPassword) {
        setRequiresPassword(true);
        setIsLoading(false);
      } else if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Link not found");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error) {
      console.error("Error checking link:", error);
      toast.error("An error occurred. Redirecting to home...");
      setTimeout(() => router.push("/"), 1500);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter a password");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(`/api/links/redirect?key=${key}&password=${encodeURIComponent(password)}`);
      
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();

      if (data.error) {
        toast.error(data.error === "Invalid password" ? "Incorrect password" : data.error);
      } else if (response.ok) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading && !requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderIcon className="w-8 h-8 animate-spin" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              <CardTitle>Password Protected Link</CardTitle>
            </div>
            <CardDescription>
              This link is password protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isVerifying}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
