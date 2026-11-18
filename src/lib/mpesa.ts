import 'server-only'

// Safaricom Daraja "M-Pesa Express" (STK push): the customer gets a payment prompt on their phone and enters
// their M-Pesa PIN there. We never see the PIN. Needs these environment variables (see .env.example):
//   MPESA_ENV            sandbox | production
//   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET   from the Daraja app
//   MPESA_SHORTCODE, MPESA_PASSKEY              the paybill/till and its Lipa na M-Pesa passkey
//   MPESA_CALLBACK_URL   public https address of /api/mpesa/callback
//   MPESA_CALLBACK_SECRET  a long random string, appended to the callback URL so only Safaricom's call is trusted

const env = () => ({
  base: process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
  key: process.env.MPESA_CONSUMER_KEY,
  secret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  callback: process.env.MPESA_CALLBACK_URL,
  callbackSecret: process.env.MPESA_CALLBACK_SECRET,
})

export function mpesaConfigured() {
  const e = env()
  return Boolean(e.key && e.secret && e.shortcode && e.passkey && e.callback && e.callbackSecret)
}

async function accessToken() {
  const e = env()
  const res = await fetch(`${e.base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${Buffer.from(`${e.key}:${e.secret}`).toString('base64')}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Could not reach M-Pesa. Try again in a moment')
  return ((await res.json()) as { access_token: string }).access_token
}

// Daraja wants the time as YYYYMMDDHHmmss in Nairobi time.
function timestamp() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00'
  return `${g('year')}${g('month')}${g('day')}${g('hour')}${g('minute')}${g('second')}`
}

/** Sends the payment prompt. Returns Safaricom's CheckoutRequestID, which the callback uses to find the order. */
export async function stkPush({ phone, amount, orderId }: { phone: string; amount: number; orderId: number }) {
  const e = env()
  const ts = timestamp()
  const msisdn = phone.replace(/\D/g, '')
  if (!/^254[17]\d{8}$/.test(msisdn)) throw new Error('The phone number on your account is not a valid Kenyan mobile number')
  const res = await fetch(`${e.base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: e.shortcode,
      Password: Buffer.from(`${e.shortcode}${e.passkey}${ts}`).toString('base64'),
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: msisdn,
      PartyB: e.shortcode,
      PhoneNumber: msisdn,
      CallBackURL: `${e.callback}?token=${encodeURIComponent(e.callbackSecret!)}`,
      AccountReference: `BIG-${orderId}`,
      TransactionDesc: `Order ${orderId}`,
    }),
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => ({}))) as { ResponseCode?: string; CheckoutRequestID?: string; errorMessage?: string; ResponseDescription?: string }
  if (!res.ok || body.ResponseCode !== '0' || !body.CheckoutRequestID) {
    throw new Error(body.errorMessage || body.ResponseDescription || 'M-Pesa did not accept the request')
  }
  return body.CheckoutRequestID
}

export function callbackTokenOk(token: string | null) {
  const secret = env().callbackSecret
  if (!secret || !token || token.length !== secret.length) return false
  let diff = 0
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}
