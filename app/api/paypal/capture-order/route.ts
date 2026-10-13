import { NextResponse } from "next/server";
import { createTransfer } from "@/lib/diaspora-db";

const paypalApi = process.env.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

async function getAccessToken() {
  const credentials = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${paypalApi}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials", cache: "no-store" });
  if (!response.ok) throw new Error("PayPal authentication failed");
  return (await response.json()).access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderID, studentId, studentName, amount, senderName, senderEmail, senderCountry, message } = body;
    const expectedAmount = Number(amount);
    if (!orderID || !studentId || !studentName || !senderName || !Number.isFinite(expectedAmount) || expectedAmount <= 0) return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    const accessToken = await getAccessToken();
    const response = await fetch(`${paypalApi}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } });
    const captureData = await response.json();
    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const capturedAmount = Number(capture?.amount?.value);
    if (!response.ok || captureData.status !== "COMPLETED" || capturedAmount !== Number(expectedAmount.toFixed(2)) || purchaseUnit?.custom_id !== studentId) return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
    const transfer = createTransfer({ student_id: studentId, student_name: studentName, sender_name: senderName, sender_email: senderEmail || "", sender_country: senderCountry || "", amount_usdt: capturedAmount, payment_method: "paypal", personal_message: message || "", paypal_order_id: orderID, paypal_capture_id: capture.id });
    return NextResponse.json({ success: true, reference: transfer.transaction_ref, captureId: capture.id, amount: capturedAmount, studentName });
  } catch (error) {
    console.error("PayPal capture error", error);
    return NextResponse.json({ error: "Payment capture failed" }, { status: 500 });
  }
}
