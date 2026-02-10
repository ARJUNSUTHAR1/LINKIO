"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, ExternalLink, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
}

const BillingSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const sessionId = searchParams.get("session_id");
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndFetch();
    } else {
      router.push("/dashboard");
    }
  }, [sessionId]);

  const verifyPaymentAndFetch = async () => {
    try {
      setVerifying(true);
      
      // Step 1: Verify payment and update database
      const verifyResponse = await fetch("/api/stripe/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!verifyResponse.ok) {
        console.error("Payment verification failed");
        router.push("/pricing?error=verification_failed");
        return;
      }

      // Step 2: Update the session to reflect new plan
      await updateSession();
      
      // Small delay to ensure session is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Fetch fresh subscription data
      await fetchSubscription();
    } catch (error) {
      console.error("Failed to verify payment:", error);
      router.push("/pricing?error=unknown");
    } finally {
      setVerifying(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/user/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.")) {
      return;
    }

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        fetchSubscription();
        alert("Subscription will be canceled at the end of the billing period");
      } else {
        alert("Failed to cancel subscription");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  if (loading || verifying) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderIcon className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {verifying ? "Verifying your payment..." : "Loading your subscription..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold">Payment Successful! 🎉</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for subscribing to LINKIO. Your account has been upgraded.
          </p>
        </div>

        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl capitalize">
                  {subscription?.plan || "Premium"} Plan
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-sm">
                {subscription?.status || "Active"}
              </Badge>
            </div>
            <CardDescription>
              Your subscription is now active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Billing Cycle</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.currentPeriodEnd
                      ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { 
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}`
                      : "Monthly subscription"
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Payment Status</p>
                  <p className="text-sm text-muted-foreground">
                    Successfully processed
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Start creating unlimited short links</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Access advanced analytics and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Generate QR codes for all your links</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Priority customer support</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/links" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Create Your First Link
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t space-y-3">
              <h4 className="font-medium text-sm">Manage Your Subscription</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/api/stripe/portal" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <CreditCard className="w-4 h-4" />
                    Manage Billing
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                {subscription?.status !== "canceled" && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact our support team at support@linkio.app</p>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccessPage;
