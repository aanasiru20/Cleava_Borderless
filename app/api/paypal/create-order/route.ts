import { NextResponse } from "next/server";

const paypalApi = process.env.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

async function getAccessToken() {
  const credentials = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${paypalApi}/v1/oauth2/token`, {
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
    const { amount, studentName, studentId } = await request.json();
    const numericAmount = Number(amount);
    if (!studentId || !studentName || !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 10000) {
      return NextResponse.json({ error: "Invalid order details" }, { status: 400 });
    }
    const accessToken = await getAccessToken();
    const response = await fetch(`${paypalApi}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: numericAmount.toFixed(2) }, description: `USDT Allowance for ${studentName} via Cleva Borderless`, custom_id: studentId }],
        application_context: { brand_name: "Cleva Borderless", user_action: "PAY_NOW" },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.id) return NextResponse.json({ error: "Could not create PayPal order" }, { status: 502 });
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("PayPal create order error", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
