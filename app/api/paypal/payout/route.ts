import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, amount, escrowId } = await request.json();
    const numericAmount = Number(amount);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail ?? "")) {
      return NextResponse.json({ error: "A valid PayPal email is required" }, { status: 400 });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "A valid payout amount is required" }, { status: 400 });
    }
    if (!escrowId) return NextResponse.json({ error: "Escrow ID is required" }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ error: "PayPal payouts are not configured" }, { status: 503 });
    }

    const credentials = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!tokenResponse.ok) return NextResponse.json({ error: "Unable to authenticate with PayPal" }, { status: 502 });
    const { access_token: accessToken } = await tokenResponse.json();
    const batchId = `CLEVA-ESC-${escrowId}-${Date.now()}`.slice(0, 50);

    const payoutResponse = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": batchId },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "Your Cleva Borderless Escrow Has Been Released",
          email_message: `Your escrow payment of $${numericAmount.toFixed(2)} USD has been released via Cleva Borderless.`,
        },
        items: [{ recipient_type: "EMAIL", amount: { value: numericAmount.toFixed(2), currency: "USD" }, receiver: recipientEmail, note: `Escrow release for job #${escrowId}`, sender_item_id: String(escrowId) }],
      }),
    });
    const payoutData = await payoutResponse.json();
    if (!payoutResponse.ok) return NextResponse.json({ error: payoutData.message ?? "PayPal payout failed" }, { status: 502 });

    return NextResponse.json({ success: true, batchId: payoutData.batch_header?.payout_batch_id ?? batchId, status: payoutData.batch_header?.batch_status });
  } catch (error) {
    console.error("PayPal payout error:", error);
    return NextResponse.json({ error: "Payout failed" }, { status: 500 });
  }
}
