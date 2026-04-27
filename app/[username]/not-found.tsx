import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">This page does not exist</h1>
      <p className="text-muted-foreground">
        The username you&apos;re looking for isn&apos;t on Konekt — yet.
      </p>
      <Link href="/" className="underline">
        Back to home
      </Link>
    </main>
  );
}
