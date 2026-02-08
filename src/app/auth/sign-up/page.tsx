import { Icons, SignUpForm } from "@/components";
import Link from "next/link";

const SignUpPage = () => {
    return (
        <div className="flex flex-col items-start max-w-sm mx-auto min-h-screen py-4 md:py-8">
            <div className="flex items-center w-full py-6 border-b border-border/80">
                <Link href="/#home" className="flex items-center gap-x-2">
                    <Icons.logo className="w-6 h-6" />
                    <h1 className="text-lg font-medium">
                        LINKIO
                    </h1>
                </Link>
            </div>

            <SignUpForm />

            <div className="flex flex-col items-start w-full mt-6">
                <p className="text-sm text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-primary">
                        Terms of Service{" "}
                    </Link>
                    and{" "}
                    <Link href="/privacy" className="text-primary">
                        Privacy Policy
                    </Link>
                </p>
            </div>
            <div className="flex items-start mt-8 border-t border-border/80 py-6 w-full">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/sign-in" className="text-primary">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
};

export default SignUpPage
