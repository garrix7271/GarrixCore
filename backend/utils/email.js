// utils/email.js — sends transactional emails via Resend's API.
// Docs: https://resend.com/docs/api-reference/emails/send-email
//
// If RESEND_API_KEY isn't set, sendResetEmail falls back to logging the link
// to the console instead of throwing — useful for local dev without a key.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

async function sendResetEmail(to, resetLink) {
  if (!RESEND_API_KEY) {
    console.log('\n[DEV] RESEND_API_KEY not set — reset link for', to, '\n', resetLink, '\n');
    return { sent: false, reason: 'no_api_key' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Reset your GarrixCore password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16232B;">Reset your password</h2>
          <p style="color: #5B6A70; line-height: 1.6;">
            We received a request to reset your GarrixCore password. Click the button below to choose a new one. This link expires in 1 hour.
          </p>
          <a href="${resetLink}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #9333ea; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset password
          </a>
          <p style="color: #999; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Resend API error:', response.status, errorBody);
    return { sent: false, reason: 'api_error', status: response.status };
  }

  return { sent: true };
}

module.exports = { sendResetEmail };