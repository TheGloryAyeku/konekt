import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of service</h1>
      <p className="text-sm">Last updated: 27 April 2026</p>

      <p>
        Welcome to {APP_NAME}. By using the service, you agree to the terms
        below. They are written to be readable, not to scare you.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 13 or older to create an account.</li>
        <li>
          You are responsible for keeping your password safe and for everything
          that happens under your account.
        </li>
        <li>
          Pick a username that does not impersonate someone else or violate
          their trademark.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to use {APP_NAME} to:</p>
      <ul>
        <li>Distribute illegal content, malware, or phishing pages.</li>
        <li>Harass, threaten, or dox other people.</li>
        <li>
          Spam or run automated traffic against the platform or other people&apos;s
          links.
        </li>
        <li>Resell {APP_NAME} as a white-label product without permission.</li>
      </ul>
      <p>
        We can suspend or remove pages that violate these rules. We will tell
        you why when we do.
      </p>

      <h2>Plans and billing</h2>
      <ul>
        <li>The free plan is free, with the limits described in the app.</li>
        <li>
          Pro is billed in NGN via Paystack. Charges renew automatically until
          you cancel.
        </li>
        <li>
          You can cancel at any time from the Billing page. Your Pro features
          stay active until the end of the billing period.
        </li>
        <li>
          We do not offer refunds for partial months unless required by law.
        </li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own everything you post — your photo, bio, and links. You give us
        permission to display that content on your public page so the product
        can work.
      </p>

      <h2>Service availability</h2>
      <p>
        We aim to keep {APP_NAME} fast and reliable, but we do not promise
        uninterrupted service. We are not liable for losses caused by downtime
        or analytics gaps.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the product evolves. If we make
        significant changes, we will notify you by email or through the
        dashboard.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@konekt.ng">hello@konekt.ng</a>.
      </p>
    </>
  );
}
