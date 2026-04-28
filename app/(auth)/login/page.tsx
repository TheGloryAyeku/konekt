import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KonektMark } from "@/components/ui/konekt-mark";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      {/* Logo centered on the card frame with 24px gap between mark and name */}
      <div className="flex flex-col items-center gap-6 pb-2 pt-8">
        <KonektMark size={44} />
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Log in to manage your links and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* LoginForm reads `?next=` via useSearchParams, which forces CSR
            bailout — wrap it in a Suspense boundary so the shell can still
            prerender. */}
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-foreground">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
