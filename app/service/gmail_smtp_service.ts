import emailjs from "@emailjs/react-native";

// ─────────────────────────────────────────────────────────────────────────────
// ACTION REQUIRED — fill these in from your EmailJS dashboard:
//   1. Go to https://www.emailjs.com and create a free account
//   2. Add Gmail as an email service  →  copy your Service ID
//   3. Create an email template with these variables:
//        {{to_email}}  {{full_name}}  {{otp_code}}
//      Copy the Template ID
//   4. Account → API Keys → copy your Public Key
//   5. Account → Security → enable "Allow EmailJS API for non-browser applications"
// ─────────────────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_rv0o3qm";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_y9xss7b";  // e.g. "template_xyz456"
const EMAILJS_PUBLIC_KEY = "JpF7X2GKpX6ygEPrN";    // e.g. "abcDEFghiJKLmnoPQR"

// Initialize EmailJS once with your public key (required by React Native SDK)
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// In-memory store: email → { otp, expiresAt }
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export type EmailOtpSendResult = {
  requestId?: string;
  otpForDevFallback?: string;
};

/**
 * Generates a 6-digit OTP and sends it via EmailJS (Gmail SMTP).
 * No backend server required.
 */
export async function sendEmailOtpCode(params: {
  email: string;
  fullName: string;
}): Promise<EmailOtpSendResult> {
  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore[params.email.toLowerCase()] = { otp, expiresAt };

  try {
    // Compute expiry time string (15 minutes from now)
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    const timeStr = expiry.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        email: params.email,
        passcode: otp,
        time: timeStr,
      },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
    console.log("[EmailJS] Send success:", result.status, result.text);
  } catch (err: any) {
    const status = err?.status ?? err?.code ?? "unknown";
    const text = err?.text ?? err?.message ?? String(err);
    console.error(`[EmailJS] Error — status: ${status} | message: ${text}`);
    throw new Error(`EmailJS [${status}]: ${text}`);
  }

  return { requestId: params.email, otpForDevFallback: otp };
}

/**
 * Verifies the OTP the user entered against what was stored.
 */
export async function verifyEmailOtpCode(params: {
  email: string;
  code: string;
  requestId?: string;
  otpForDevFallback?: string;
}): Promise<boolean> {
  const key = params.email.toLowerCase();
  const record = otpStore[key];

  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    delete otpStore[key];
    return false;
  }
  if (record.otp !== params.code.trim()) return false;

  delete otpStore[key]; // one-time use
  return true;
}