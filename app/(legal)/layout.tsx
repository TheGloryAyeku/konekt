import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-semibold tracking-tight text-foreground"
          >
            {APP_NAME}
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <article className="prose prose-neutral max-w-none text-foreground prose-headings:tracking-tight prose-h1:text-3xl prose-h1:font-semibold prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-p:text-muted-foreground prose-li:text-muted-foreground">
          {children}
        </article>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-3xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. Built in Nigeria.
        </div>
      </footer>
    </div>
  );
}
