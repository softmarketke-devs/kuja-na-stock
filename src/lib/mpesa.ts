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

// What the customer is told. The real reason goes to the server log (see logFailure), because customers cannot act on it.
const TRY_AGAIN = 'M-Pesa could not start the payment just now. Please try again in a minute, or choose pay on delivery.'

/** Writes the real M-Pesa answer to the server log, so the owner can see why a payment would not start. */
function logFailure(step: string, status: number, body: string) {
  const asPage = body.trimStart().startsWith('<')
  const hint =
    asPage ? 'Safaricom returned a web page (its protection layer blocked this server). Try again later; if it keeps happening, ask Safaricom to allow your server.'
    : /404\.001\.03|Invalid Access Token/i.test(body) ? 'The Daraja app was refused: switch on the "M-Pesa Express" (STK Push) product for this app in the Daraja portal, and make sure the key/secret belong to that app.'
    : /400\.002\.02|Bad Request - Invalid/i.test(body) ? 'Safaricom rejected a field. Check the shortcode, passkey and callback address.'
    : ''
  console.error(`[mpesa] ${step} failed (HTTP ${status}). ${hint} Response: ${asPage ? '(web page)' : body.slice(0, 300)}`)
}

async function accessToken() {
  const e = env()
  const res = await fetch(`${e.base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${Buffer.from(`${e.key}:${e.secret}`).toString('base64')}` },
    cache: 'no-store',
  })
  const text = await res.text()
  let token: string | undefined
  try {
    token = (JSON.parse(text) as { access_token?: string }).access_token
  } catch {
    /* a web page, handled below */
  }
  if (!res.ok || !token) {
    logFailure('getting an access token', res.status, text)
    throw new Error(TRY_AGAIN)
  }
  return token
}

// Daraja wants the time as YYYYMMDDHHmmss in Nairobi time.
function timestamp() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00'
  return `${g('year')}${g('month')}${g('day')}${g('hour')}${g('minute')}${g('second')}`
}

/** Sends the payment prompt. Returns Safaricom's CheckoutRequestID, which the callback uses to find the payment. */
export async function stkPush({ phone, amount, orderId }: { phone: string; amount: number; orderId: number }) {
  const e = env()
  const msisdn = phone.replace(/\D/g, '')
  if (!/^254[17]\d{8}$/.test(msisdn)) throw new Error('The phone number on your account is not a valid Kenyan mobile number. Fix it on your account page.')
  const ts = timestamp()
  const token = await accessToken()
  const res = await fetch(`${e.base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
  const text = await res.text()
  let body: { ResponseCode?: string; CheckoutRequestID?: string } = {}
  try {
    body = JSON.parse(text)
  } catch {
    /* a web page, handled below */
  }
  if (!res.ok || body.ResponseCode !== '0' || !body.CheckoutRequestID) {
    logFailure('sending the payment prompt', res.status, text)
    throw new Error(TRY_AGAIN)
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
