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

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
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
