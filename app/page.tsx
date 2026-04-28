import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe2,
  Link2,
  Mail,
  Palette,
  Play,
  ShoppingBag,
  Wallet,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { KonektMark } from "@/components/ui/konekt-mark";
import {
  APP_NAME,
  FREE_PLAN_LINK_LIMIT,
  FREE_PLAN_ANALYTICS_DAYS,
  PRO_PLAN_ANALYTICS_DAYS,
} from "@/lib/constants";

const features = [
  {
    icon: Palette,
    title: "Design your bio page in minutes",
    body: "Upload your photo, write a short bio, pick a colour. Looks sharp on every screen, no designer required.",
    tag: "Free",
  },
  {
    icon: Link2,
    title: "Reorder and toggle links instantly",
    body: `Drag to reorder. Hide a link without deleting it. ${FREE_PLAN_LINK_LIMIT} links on Free, unlimited on Pro.`,
    tag: "Free",
  },
  {
    icon: BarChart3,
    title: "See exactly what your audience clicks",
    body: "Per link clicks, page views, top referrers (Instagram, TikTok, X), and mobile vs desktop, updated live.",
    tag: "Free",
  },
  {
    icon: Wallet,
    title: "Pay in Naira, your way",
    body: "Debit card, bank transfer, or USSD. No dollar card. No conversion math. All prices in NGN.",
    tag: "Free",
  },
  {
    icon: Globe2,
    title: "Connect your own domain",
    body: "Point link.yourname.com at your page with a CNAME. Step by step setup guide included.",
    tag: "Pro",
  },
  {
    icon: Clock,
    title: "Schedule links to go live automatically",
    body: "Set a start time and expiry on any link. Built for drops, promos, and brand deal windows.",
    tag: "Pro",
  },
];

const steps = [
  {
    number: "01",
    title: "Claim your handle",
    body: "Pick your konekt.ng URL. Thirty seconds, no credit card.",
  },
  {
    number: "02",
    title: "Add your links",
    body: "Drop in your YouTube, Selar store, Substack, WhatsApp, anything with a URL.",
  },
  {
    number: "03",
    title: "Share one link everywhere",
    body: "Put konekt.ng/yourname in your bio. One tap takes your audience anywhere you want them to go.",
  },
];

const freePlanPerks = [
  `${FREE_PLAN_LINK_LIMIT} active links`,
  `${FREE_PLAN_ANALYTICS_DAYS} day analytics history`,
  "Profile photo, bio, and theme colour",
  "konekt.ng/yourname URL",
  "Mobile first, fast on 3G",
];

const proPlanPerks = [
  "Everything in Free",
  "Unlimited links",
  `${PRO_PLAN_ANALYTICS_DAYS} day analytics history`,
  "Custom domain support",
  "Link scheduling",
  "Priority support",
];

const trustStats = [
  { icon: Zap, label: "Loads in under 2s on 3G" },
  { icon: BarChart3, label: "Real time click analytics" },
  { icon: Wallet, label: "Pay in Naira, no dollar card" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      {/* Spacer to push content below the fixed nav (nav ≈ py-3 + h-9 button = ~60px) */}
      <div className="h-[61px] shrink-0" />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            {/* Hero text */}
            <div className="flex flex-col items-start gap-6 text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary" />
                Built for Nigerian creators
              </span>
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]">
                One link for{" "}
                <span className="text-primary">everything</span> you create.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                {APP_NAME} is the link in bio tool priced in Naira, built for
                3G, with analytics that show how your audience really finds you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                  Claim your handle
                  <ArrowRight />
                </Link>
                <Link
                  href="#how-it-works"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  See how it works
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Live in 30 seconds
                </span>
              </div>
            </div>

            {/* Hero device mock */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[320px] rounded-[40px] border border-border bg-accent p-3 shadow-2xl">
                <div className="rounded-[32px] bg-[var(--konekt-light)] p-6">
                  <div className="flex flex-col items-center gap-2 pb-5">
                    <div className="h-16 w-16 rounded-full bg-primary ring-4 ring-white" />
                    <p className="text-sm font-semibold text-accent">
                      @adaeze
                    </p>
                    <p className="text-center text-xs text-accent/70">
                      Creator. Storyteller. Lagos.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <MockLink
                      icon={<Play className="h-4 w-4" />}
                      label="Latest on YouTube"
                    />
                    <MockLink
                      icon={<ShoppingBag className="h-4 w-4" />}
                      label="Shop my Selar store"
                      highlight
                    />
                    <MockLink
                      icon={<Mail className="h-4 w-4" />}
                      label="Newsletter, every Friday"
                    />
                    <MockLink
                      icon={<ArrowUpRight className="h-4 w-4" />}
                      label="Book a brand deal"
                    />
                  </div>
                  <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-accent/60">
                    <span className="font-medium">konekt.ng/adaeze</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="border-y border-border bg-background">
            <div className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-5 sm:grid-cols-3">
              {trustStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <stat.icon className="h-4 w-4 text-primary" />
                  {stat.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Features
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything your bio link should do.
              </h2>
              <p className="mt-3 text-muted-foreground">
                All the tools you need to send your audience where you want.
                Whether you are a creator, a brand, or a side hustler.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className="group relative overflow-hidden border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <f.icon className="h-5 w-5" />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          f.tag === "Pro"
                            ? "bg-accent text-accent-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {f.tag}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-semibold leading-snug">
                        {f.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {f.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                How it works
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Live in three steps.
              </h2>
              <p className="mt-3 text-muted-foreground">
                From sign up to a shareable page in under two minutes.
              </p>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
              {steps.map((step, i) => (
                <>
                  <div
                    key={step.number}
                    className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-6"
                  >
                    <span className="font-mono text-sm font-semibold text-primary">
                      {step.number}
                    </span>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex items-center justify-center sm:py-6">
                      <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" />
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Pricing
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Simple pricing, in Naira.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Start free. Upgrade when you are ready to scale.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
              {/* Free */}
              <Card className="border border-border bg-card">
                <CardContent className="flex flex-col gap-6 p-8">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Free
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">
                        ₦0
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / forever
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Everything you need to launch your bio link.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {freePlanPerks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Get started free
                  </Link>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="relative border-2 border-primary bg-card shadow-sm">
                <CardContent className="flex flex-col gap-6 p-8">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">Pro</p>
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        Most popular
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">
                        ₦2,500
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / month
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Billed in NGN via Paystack. Cancel anytime.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {proPlanPerks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup?plan=pro_monthly"
                    className={buttonVariants({})}
                  >
                    Upgrade to Pro
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="rounded-3xl bg-accent px-8 py-16 text-center text-accent-foreground sm:px-16">
              <div className="flex flex-col items-center gap-6">
                <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  Your audience is one link away.
                </h2>
                <p className="max-w-lg text-accent-foreground/70">
                  Join Nigerian creators using {APP_NAME} to turn one bio link
                  into a hub for content, sales, and everything in between.
                </p>
                {/* Frame button — outer ring adds a premium "double border" effect */}
                <div className="relative inline-flex">
                  <div className="pointer-events-none absolute -inset-[3px] rounded-[14px] border-2 border-white/30" />
                  <Link
                    href="/signup"
                    className={buttonVariants({ size: "lg", variant: "secondary" })}
                  >
                    Claim your handle for free
                    <ArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <KonektMark size={20} />
            © {new Date().getFullYear()} {APP_NAME}. Built in Nigeria.
          </span>
          <nav className="flex gap-5">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function MockLink({
  icon,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium shadow-sm ${
        highlight
          ? "bg-primary text-primary-foreground"
          : "bg-white text-accent"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md ${
          highlight ? "bg-white/20" : "bg-accent/5"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
    </div>
  );
}
