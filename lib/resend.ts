import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Konekt <hello@konekt.ng>";

export async function sendReceiptEmail(params: {
  to: string;
  plan: string;
  amountNaira: number;
  reference: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Receipt for your Konekt ${params.plan} subscription`,
    html: `
      <p>Thanks for subscribing to Konekt ${params.plan}.</p>
      <p><strong>Amount:</strong> ₦${params.amountNaira.toLocaleString("en-NG")}</p>
      <p><strong>Reference:</strong> ${params.reference}</p>
      <p>You can manage your subscription from your dashboard.</p>
    `,
  });
}

export async function sendPaymentFailedEmail(params: {
  to: string;
  reason: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: "Your Konekt payment did not go through",
    html: `
      <p>We tried to charge your card but the transaction failed.</p>
      <p><strong>Reason:</strong> ${params.reason}</p>
      <p>Please retry from your dashboard billing page.</p>
    `,
  });
}
