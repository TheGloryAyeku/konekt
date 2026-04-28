"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { addDomain, deleteDomain, verifyDomain } from "./actions";

type Domain = {
  id: string;
  domain: string;
  verified: boolean;
  verification_token: string;
  created_at: string;
};

export function DomainManager({ domains }: { domains: Domain[] }) {
  const [pending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await addDomain({}, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      form.reset();
      toast.success(res.success ?? "Domain added");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a domain</CardTitle>
          <CardDescription>
            Enter the domain you want pointed at your page, then add the CNAME
            at your registrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="domain" className="sr-only">
                Domain
              </Label>
              <Input
                id="domain"
                name="domain"
                placeholder="link.yourname.com"
                required
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add domain"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="font-medium">No domains yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add a subdomain like link.yourname.com and we will guide you
              through the CNAME setup.
            </p>
          </CardContent>
        </Card>
      ) : (
        domains.map((d) => <DomainRow key={d.id} domain={d} />)
      )}
    </div>
  );
}

function DomainRow({ domain }: { domain: Domain }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onVerify() {
    startTransition(async () => {
      const res = await verifyDomain(domain.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Verified");
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteDomain(domain.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Removed");
    });
  }

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select and copy manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{domain.domain}</CardTitle>
            {domain.verified ? (
              <Badge variant="default">Verified</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!domain.verified ? (
              <Button size="sm" onClick={onVerify} disabled={pending}>
                {pending ? "Checking…" : "Verify"}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={pending}
              aria-label="Remove domain"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!domain.verified ? (
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Add the following DNS records at your registrar (e.g. Cloudflare,
            Namecheap, Google Domains). Verification can take a few minutes
            after the records propagate.
          </p>
          <div className="grid gap-2 text-sm">
            <DnsRecord
              type="CNAME"
              host={domain.domain}
              value="cname.konekt.ng"
              onCopy={() => copyValue("cname.konekt.ng")}
              copied={copied}
            />
            <DnsRecord
              type="TXT"
              host={`_konekt.${domain.domain}`}
              value={domain.verification_token}
              onCopy={() => copyValue(domain.verification_token)}
              copied={copied}
            />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

function DnsRecord({
  type,
  host,
  value,
  onCopy,
  copied,
}: {
  type: string;
  host: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
      <Badge variant="secondary" className="justify-self-start">
        {type}
      </Badge>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-mono text-xs text-muted-foreground">
          {host}
        </span>
        <span className="truncate font-mono text-xs">{value}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label="Copy value"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
