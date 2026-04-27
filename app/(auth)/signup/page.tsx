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

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm">
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
