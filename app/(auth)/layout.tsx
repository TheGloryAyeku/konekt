import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-transparent">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
