"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, PLANS } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircleIcon, Crown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

type Tab = "monthly" | "yearly";

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
}

const PricingCards = () => {
    const { data: session, status, update: updateSession } = useSession();
    const isAuthenticated = status === "authenticated";

    const MotionTabTrigger = motion(TabsTrigger);

    const [activeTab, setActiveTab] = useState<Tab>("monthly");
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubscription();
        } else {
            setLoadingSubscription(false);
            setSubscription(null);
        }
    }, [isAuthenticated]);

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

    const getPlanHierarchy = (planName: string): number => {
        const hierarchy: { [key: string]: number } = {
            free: 0,
            pro: 1,
            business: 2,
        };
        return hierarchy[planName.toLowerCase()] || 0;
    };

    const shouldShowPlan = (planName: string): boolean => {
        if (!isAuthenticated || !subscription) return true;
        
        const userPlan = subscription.plan?.toLowerCase() || "free";
        const userPlanLevel = getPlanHierarchy(userPlan);
        const planLevel = getPlanHierarchy(planName.toLowerCase());

        // Hide free plan if user has a paid subscription
        if (planName.toLowerCase() === "free" && userPlanLevel > 0 && subscription.hasActiveSubscription) {
            return false;
        }

        // Show current plan and higher plans only (no downgrades)
        return planLevel >= userPlanLevel;
    };

    const getPlanButton = (planName: string, billing: "monthly" | "yearly") => {
        if (!isAuthenticated) {
            // Not logged in - all buttons go to sign-up
            return {
                text: planName === "Free" ? "Start for free" : "Get started",
                href: `/auth/sign-up?plan=${planName.toLowerCase()}`,
                disabled: false,
            };
        }

        // Check if user has this plan
        const userPlan = subscription?.plan?.toLowerCase() || "free";
        const currentPlan = planName.toLowerCase();

        // If user already has this exact plan and it's active
        if (userPlan === currentPlan && subscription?.hasActiveSubscription) {
            return {
                text: "Current Plan",
                href: "/dashboard/settings",
                disabled: true,
            };
        }

        // Free plan button for free users
        if (planName === "Free") {
            return {
                text: "Go to Dashboard",
                href: "/dashboard",
                disabled: false,
            };
        }

        // Pro and Business - go to Stripe
        const isUpgrade = getPlanHierarchy(currentPlan) > getPlanHierarchy(userPlan);
        
        return {
            text: isUpgrade ? "Upgrade Plan" : "Get started",
            href: `/api/stripe/checkout?plan=${planName.toLowerCase()}&billing=${billing}`,
            disabled: false,
        };
    };

    const isCurrentPlan = (planName: string) => {
        if (!subscription) return false;
        const userPlan = subscription.plan?.toLowerCase() || "free";
        return userPlan === planName.toLowerCase() && subscription.hasActiveSubscription;
    };

    return (
        <Tabs defaultValue="monthly" className="w-full flex flex-col items-center justify-center">
            <TabsList>
                <MotionTabTrigger
                    value="monthly"
                    onClick={() => setActiveTab("monthly")}
                    className="relative"
                >
                    {activeTab === "monthly" && (
                        <motion.div
                            layoutId="active-tab-indicator"
                            transition={{
                                type: "spring",
                                bounce: 0.5,
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-background shadow-sm rounded-md z-10"
                        />
                    )}
                    <span className="z-20">
                        Monthly
                    </span>
                </MotionTabTrigger>
                <MotionTabTrigger
                    value="yearly"
                    onClick={() => setActiveTab("yearly")}
                    className="relative"
                >
                    {activeTab === "yearly" && (
                        <motion.div
                            layoutId="active-tab-indicator"
                            transition={{
                                type: "spring",
                                bounce: 0.5,
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-background shadow-sm rounded-md z-10"
                        />
                    )}
                    <span className="z-20">
                        Yearly
                    </span>
                </MotionTabTrigger>
            </TabsList>

            <TabsContent value="monthly" className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full md:gap-8 flex-wrap max-w-5xl mx-auto pt-6">
                {PLANS.filter(plan => shouldShowPlan(plan.name)).map((plan) => {
                    const isCurrent = isCurrentPlan(plan.name);
                    const buttonData = getPlanButton(plan.name, "monthly");
                    
                    return (
                    <Card
                        key={plan.name}
                        className={cn(
                            "flex flex-col w-full border-border rounded-xl relative",
                            plan.name === "Pro" && "border-2 border-blue-500",
                            isCurrent && "border-2 border-primary"
                        )}
                    >
                        {isCurrent && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                                <Crown className="w-3 h-3 mr-1" />
                                Current Plan
                            </Badge>
                        )}
                        <CardHeader className={cn(
                            "border-b border-border",
                            plan.name === "Pro" ? "bg-blue-500/[0.07]" : "bg-foreground/[0.03]"
                        )}>
                            <CardTitle className={cn(plan.name !== "Pro" && "text-muted-foreground", "text-lg font-medium")}>
                                {plan.name}
                            </CardTitle>
                            <CardDescription>
                                {plan.info}
                            </CardDescription>
                            <h5 className="text-3xl font-semibold">
                                ${plan.price.monthly}
                                <span className="text-base text-muted-foreground font-normal">
                                    {plan.name !== "Free" ? "/month" : ""}
                                </span>
                            </h5>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <CheckCircleIcon className="text-blue-500 w-4 h-4" />
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <p className={cn(feature.tooltip && "border-b !border-dashed border-border cursor-pointer")}>
                                                    {feature.text}
                                                </p>
                                            </TooltipTrigger>
                                            {feature.tooltip && (
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="w-full mt-auto">
                            {buttonData.disabled ? (
                                <button
                                    disabled
                                    className={buttonVariants({ 
                                        className: cn(
                                            "w-full cursor-not-allowed opacity-60",
                                            isCurrent && "bg-primary"
                                        )
                                    })}
                                >
                                    {buttonData.text}
                                </button>
                            ) : (
                                <Link
                                    href={buttonData.href}
                                    style={{ width: "100%" }}
                                    className={buttonVariants({ 
                                        className: plan.name === "Pro" && "bg-blue-500 hover:bg-blue-500/80 text-white" 
                                    })}
                                >
                                    {buttonData.text}
                                </Link>
                            )}
                        </CardFooter>
                    </Card>
                    );
                })}
            </TabsContent>
            <TabsContent value="yearly" className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full md:gap-8 flex-wrap max-w-5xl mx-auto pt-6">
                {PLANS.filter(plan => shouldShowPlan(plan.name)).map((plan) => {
                    const isCurrent = isCurrentPlan(plan.name);
                    const buttonData = getPlanButton(plan.name, "yearly");
                    
                    return (
                    <Card
                        key={plan.name}
                        className={cn(
                            "flex flex-col w-full border-border rounded-xl relative",
                            plan.name === "Pro" && "border-2 border-blue-500",
                            isCurrent && "border-2 border-primary"
                        )}
                    >
                        {isCurrent && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                                <Crown className="w-3 h-3 mr-1" />
                                Current Plan
                            </Badge>
                        )}
                        <CardHeader className={cn(
                            "border-b border-border",
                            plan.name === "Pro" ? "bg-blue-500/[0.07]" : "bg-foreground/[0.03]"
                        )}>
                            <CardTitle className={cn(plan.name !== "Pro" && "text-muted-foreground", "text-lg font-medium")}>
                                {plan.name}
                            </CardTitle>
                            <CardDescription>
                                {plan.info}
                            </CardDescription>
                            <h5 className="text-3xl font-semibold flex items-end">
                                ${plan.price.yearly}
                                <div className="text-base text-muted-foreground font-normal">
                                    {plan.name !== "Free" ? "/year" : ""}
                                </div>
                                {plan.name !== "Free" && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
                                        className="px-2 py-0.5 ml-2 rounded-md bg-blue-500 text-foreground text-sm font-medium"
                                    >
                                        -12%
                                    </motion.span>
                                )}
                            </h5>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <CheckCircleIcon className="text-blue-500 w-4 h-4" />
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <p className={cn(feature.tooltip && "border-b !border-dashed border-border cursor-pointer")}>
                                                    {feature.text}
                                                </p>
                                            </TooltipTrigger>
                                            {feature.tooltip && (
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="w-full pt- mt-auto">
                            {buttonData.disabled ? (
                                <button
                                    disabled
                                    className={buttonVariants({ 
                                        className: cn(
                                            "w-full cursor-not-allowed opacity-60",
                                            isCurrent && "bg-primary"
                                        )
                                    })}
                                >
                                    {buttonData.text}
                                </button>
                            ) : (
                                <Link
                                    href={buttonData.href}
                                    style={{ width: "100%" }}
                                    className={buttonVariants({ 
                                        className: plan.name === "Pro" && "bg-blue-500 hover:bg-blue-500/80 text-white" 
                                    })}
                                >
                                    {buttonData.text}
                                </Link>
                            )}
                        </CardFooter>
                    </Card>
                    );
                })}
            </TabsContent>
        </Tabs>
    )
};

export default PricingCards
