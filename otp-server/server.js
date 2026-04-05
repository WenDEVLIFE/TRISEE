const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 4000);
const otpTtlMs = Number(process.env.OTP_TTL_MS || 10 * 60 * 1000);

app.use(cors());
app.use(express.json());

const otpStore = new Map();

function generateSixDigitOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function makeRequestId() {
  return crypto.randomBytes(16).toString("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/otp/send", async (req, res) => {
  try {
    const to = normalizeEmail(req.body?.to);
    const fullName = String(req.body?.fullName || "").trim();

    if (!to || !to.includes("@")) {
      return res.status(400).json({ message: "Valid recipient email is required." });
    }

    if (!process.env.SMTP_FROM_EMAIL) {
      return res.status(500).json({ message: "SMTP_FROM_EMAIL is not configured." });
    }

    const otp = generateSixDigitOtp();
    const requestId = makeRequestId();

    otpStore.set(requestId, {
      email: to,
      code: otp,
      expiresAt: Date.now() + otpTtlMs,
      used: false,
    });

    const subject = "TRISEE Email Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF5E3A;">TRISEE Verification</h2>
        <p>Hello ${fullName || "there"},</p>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This code will expire in ${Math.floor(otpTtlMs / 60000)} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to,
      subject,
      html,
    });

    return res.status(200).json({ requestId });
  } catch (error) {
    console.error("[OTP Server] send error:", error);
    return res.status(500).json({ message: "Failed to send OTP email." });
  }
});

app.post("/api/otp/verify", (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    const requestId = String(req.body?.requestId || "").trim();

    if (!email || !code || !requestId) {
      return res.status(400).json({ verified: false, message: "email, code, requestId are required." });
    }

    const record = otpStore.get(requestId);

    if (!record) {
      return res.status(404).json({ verified: false, message: "OTP request not found." });
    }

    if (record.used) {
      return res.status(400).json({ verified: false, message: "OTP already used." });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(requestId);
      return res.status(400).json({ verified: false, message: "OTP expired." });
    }

    if (record.email !== email || record.code !== code) {
      return res.status(401).json({ verified: false, message: "Invalid OTP." });
    }

    record.used = true;
    otpStore.set(requestId, record);

    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("[OTP Server] verify error:", error);
    return res.status(500).json({ verified: false, message: "Failed to verify OTP." });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [requestId, record] of otpStore.entries()) {
    if (record.used || now > record.expiresAt) {
      otpStore.delete(requestId);
    }
  }
}, 60 * 1000);

app.listen(port, () => {
  console.log(`[OTP Server] running on http://localhost:${port}`);
});
