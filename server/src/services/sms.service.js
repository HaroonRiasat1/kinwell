import { env } from '../config/env.js';

// Text-message delivery. Connect a provider by setting TWILIO_ACCOUNT_SID,
// TWILIO_AUTH_TOKEN and TWILIO_FROM; until then nothing is sent and callers fall
// back to family-issued codes.
export const smsEnabled = () => Boolean(env.twilio.sid && env.twilio.token && env.twilio.from);

export async function sendSms(to, body) {
  if (!smsEnabled()) return { delivered: false };
  const { sid, token, from } = env.twilio;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) {
    console.error('[sms] send failed', res.status, await res.text().catch(() => ''));
    return { delivered: false };
  }
  return { delivered: true };
}
