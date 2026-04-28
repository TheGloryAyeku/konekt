import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KonektMark } from "@/components/ui/konekt-mark";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm">
      {/* Logo centered on the card frame with 24px gap between mark and name */}
      <div className="flex flex-col items-center gap-6 pb-2 pt-8">
        <KonektMark size={44} />
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Claim your handle and get a link-in-bio page in seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
