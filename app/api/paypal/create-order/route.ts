import { NextResponse } from "next/server";

const paypalBaseUrl = process.env.PAYPAL_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  return (await response.json()).access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return NextResponse.json({ error: "PayPal is not configured." }, { status: 503 });
    const accessToken = await getAccessToken();
    const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ custom_id: String(body.studentId || ""), description: `Allowance for ${String(body.studentName || "student").slice(0, 120)}`, amount: { currency_code: "USD", value: amount.toFixed(2) } }] }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok || !data.id) return NextResponse.json({ error: "Unable to create PayPal order." }, { status: 502 });
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("[v0] PayPal create order error:", error);
    return NextResponse.json({ error: "Unable to connect to PayPal." }, { status: 502 });
  }
}
