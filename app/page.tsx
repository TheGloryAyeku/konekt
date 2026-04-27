import Link from "next/link";
import { ArrowRight, BarChart3, Globe2, Palette, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: Palette,
    title: "Design your bio page",
    body: "Upload a photo, pick a colour, drop your links. No designer needed.",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    body: "See which link is winning, where the traffic comes from, and on what device.",
  },
  {
    icon: Wallet,
    title: "Paid in Naira",
    body: "Pay with your debit card, bank transfer or USSD. No dollar card, no stress.",
  },
  {
    icon: Globe2,
    title: "Custom domain",
    body: "Bring your own domain so the link in your bio matches your brand.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ size: "sm" })}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <span className="rounded-full border border-border bg-accent px-3 py-1 text-xs text-accent-foreground">
            Built for Nigerian creators
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            One link for everything you make.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {APP_NAME} is the link-in-bio tool designed for Nigerian creators.
            Fast on 3G, priced in Naira, with analytics that actually reflect
            how your audience finds you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg" })}
            >
              Claim your handle <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              See what you get
            </Link>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => (
            <Card key={f.title} className="border border-border bg-card">
              <CardContent className="flex flex-col gap-3 p-6">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <nav className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
