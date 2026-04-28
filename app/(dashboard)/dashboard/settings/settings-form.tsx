"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset, updateAccount } from "./actions";

export function SettingsForm({
  email,
  username,
  displayName,
}: {
  email: string;
  username: string;
  displayName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [resetPending, startReset] = useTransition();
  const [usernameValue, setUsernameValue] = useState(username);
  const [displayNameValue, setDisplayNameValue] = useState(displayName);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateAccount({}, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Account updated");
    });
  }

  function onResetPassword() {
    startReset(async () => {
      const res = await sendPasswordReset({}, new FormData());
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Email sent");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Your handle and display name. Email is shown but cannot be changed
            here yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled readOnly />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
                <span className="px-3 text-sm text-muted-foreground">
                  konekt.ng/
                </span>
                <Input
                  id="username"
                  name="username"
                  required
                  value={usernameValue}
                  onChange={(e) =>
                    setUsernameValue(e.target.value.toLowerCase())
                  }
                  className="border-0 pl-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores. 3–30 characters.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={displayNameValue}
                onChange={(e) => setDisplayNameValue(e.target.value)}
                placeholder="Your name as shown to visitors"
                maxLength={60}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            We will email you a secure link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={onResetPassword}
            disabled={resetPending}
          >
            {resetPending ? "Sending email…" : "Send password reset email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
