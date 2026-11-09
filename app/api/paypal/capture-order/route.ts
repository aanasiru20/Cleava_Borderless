import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

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
    const orderID = typeof body.orderID === "string" ? body.orderID.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const amount = Number(body.amount);
    if (!orderID || !studentId || !Number.isFinite(amount) || amount <= 0 || amount > 100000) return NextResponse.json({ error: "Invalid PayPal payment details." }, { status: 400 });
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return NextResponse.json({ error: "PayPal is not configured." }, { status: 503 });

    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("diaspora_transfers").select("transaction_ref, amount_usdt").eq("paypal_order_id", orderID).maybeSingle();
    if (existing) return NextResponse.json({ success: true, reference: existing.transaction_ref, amount: existing.amount_usdt });

    const accessToken = await getAccessToken();
    const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok || data.status !== "COMPLETED") return NextResponse.json({ error: "PayPal payment was not completed." }, { status: 502 });

    const capturedAmount = Number(data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value);
    if (!Number.isFinite(capturedAmount) || capturedAmount !== Number(amount.toFixed(2))) return NextResponse.json({ error: "PayPal amount verification failed." }, { status: 400 });
    const captureID = data.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    const reference = `PP-${captureID || orderID}`;
    const { error } = await supabase.from("diaspora_transfers").insert({ student_id: studentId, student_name: String(body.studentName || "Student").slice(0, 120), sender_name: String(body.senderName || "Sender").slice(0, 120), sender_email: String(body.senderEmail || "").slice(0, 160), amount_usdt: capturedAmount, payment_method: "paypal", personal_message: String(body.message || "").slice(0, 500), status: "completed", transaction_ref: reference, paypal_order_id: orderID, paypal_capture_id: captureID });
    if (error) throw error;
    return NextResponse.json({ success: true, reference, amount: capturedAmount });
  } catch (error) {
    console.error("[v0] PayPal capture error:", error);
    return NextResponse.json({ error: "Unable to complete PayPal payment." }, { status: 502 });
  }
}
