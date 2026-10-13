import { NextResponse } from "next/server";
import { processPayment } from "@/lib/network-db";

export async function POST(request: Request) {
  try {
    const { vendor_code, payer_id, amount_usdt, naira_equivalent, description } = await request.json();
    
    if (!vendor_code || !amount_usdt || amount_usdt <= 0) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    const tx = processPayment(vendor_code, payer_id, amount_usdt, naira_equivalent, description || "QR Payment");
    
    return NextResponse.json(tx);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Payment failed" }, { status: 500 });
  }
}
