import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="text-sm">Last updated: 27 April 2026</p>

      <p>
        {APP_NAME} is a link-in-bio service for creators. This page explains
        what we collect, why we collect it, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email, chosen username, display
          name, bio, profile photo URL, and theme settings.
        </li>
        <li>
          <strong>Page content:</strong> the links you add, their titles,
          ordering, schedules, and click counts.
        </li>
        <li>
          <strong>Analytics events:</strong> anonymous pageviews and link
          clicks, including the referring platform (e.g. Instagram, TikTok),
          device class, and approximate country derived from the request
          headers. We do not store IP addresses.
        </li>
        <li>
          <strong>Billing data:</strong> if you upgrade, Paystack handles your
          card details. We store the resulting subscription identifiers, plan,
          and renewal date — never the card number.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your public page and dashboard.</li>
        <li>To show you analytics about your audience.</li>
        <li>To process subscription payments and send receipts.</li>
        <li>
          To prevent abuse (rate limiting, bot filtering on the analytics
          ingest).
        </li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell your data. We share the minimum necessary data with
        service providers to operate the product:
      </p>
      <ul>
        <li>Supabase — database and authentication.</li>
        <li>Paystack — payment processing.</li>
        <li>Resend — transactional emails (receipts, password resets).</li>
        <li>Cloudflare — content delivery and image hosting.</li>
        <li>Vercel — application hosting.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>
          You can change your display name, bio, theme, and links at any time.
        </li>
        <li>You can disable any link without deleting it.</li>
        <li>You can request account deletion by contacting support.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email us at{" "}
        <a href="mailto:hello@konekt.ng">hello@konekt.ng</a>.
      </p>
    </>
  );
}
