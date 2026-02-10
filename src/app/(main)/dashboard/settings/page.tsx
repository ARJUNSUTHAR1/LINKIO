"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LoaderIcon, User, Mail, Lock, Bell, Crown, CreditCard, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
}

const SettingsPage = () => {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsNotifications, setAnalyticsNotifications] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

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
      setLoadingSubscription(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        update();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.")) {
      return;
    }

    setCancelingSubscription(true);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchSubscription(); // Refresh subscription data
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setCancelingSubscription(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about your account
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly analytics reports for your links
              </p>
            </div>
            <Switch
              checked={analyticsNotifications}
              onCheckedChange={setAnalyticsNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Subscription & Billing</CardTitle>
          </div>
          <CardDescription>Manage your subscription plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingSubscription ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg capitalize">{subscription?.plan || "Free"} Plan</h4>
                    {subscription?.hasActiveSubscription && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                    {subscription?.status === "canceling" && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">Canceling</Badge>
                    )}
                    {subscription?.status === "canceled" && (
                      <Badge variant="destructive">Canceled</Badge>
                    )}
                    {subscription?.status === "past_due" && (
                      <Badge variant="destructive">Payment Failed</Badge>
                    )}
                  </div>
                  {subscription?.currentPeriodEnd && subscription?.hasActiveSubscription && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.status === "canceled" || subscription.status === "canceling"
                        ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      }
                    </p>
                  )}
                  {subscription?.plan === "free" && (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to unlock more features
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscription?.plan === "free" ? (
                    <Link href="/pricing">
                      <Button>
                        Upgrade Plan
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {subscription?.hasActiveSubscription && subscription?.status !== "canceled" && subscription?.status !== "canceling" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleCancelSubscription}
                            disabled={cancelingSubscription}
                          >
                            {cancelingSubscription ? (
                              <>
                                <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                                Canceling...
                              </>
                            ) : (
                              "Cancel Plan"
                            )}
                          </Button>
                          <Link href="/api/stripe/portal">
                            <Button variant="outline" className="gap-2">
                              Manage Billing
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </>
                      )}
                      {subscription?.status === "canceling" && (
                        <div className="text-sm text-muted-foreground">
                          Your subscription will be canceled at the end of the billing period. You'll retain access until then.
                        </div>
                      )}
                      {subscription?.status === "canceled" && (
                        <Link href="/pricing">
                          <Button>
                            Reactivate Plan
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              {subscription?.plan !== "free" && subscription?.hasActiveSubscription && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• You can manage your payment methods, download invoices, and update billing details in the billing portal.</p>
                  <p>• Canceling your subscription will keep your access active until the end of the current billing period.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={() => toast.error("This feature is not available yet")}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
