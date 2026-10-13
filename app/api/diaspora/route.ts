import { NextResponse } from "next/server";
import { createTransfer, getUnseenTransfers, markTransferAsSeen } from "@/lib/diaspora-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, student_name, sender_name, sender_email, sender_country, amount_usdt, payment_method, personal_message } = body;

    if (!student_id || !student_name || !sender_name || !amount_usdt || !payment_method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTransfer = createTransfer({
      student_id,
      student_name,
      sender_name,
      sender_email: sender_email || "",
      sender_country: sender_country || "",
      amount_usdt: Number(amount_usdt),
      payment_method,
      personal_message: personal_message || "",
    });

    return NextResponse.json({ success: true, transfer: newTransfer }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to process transfer" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("studentId");
    
    if (!student_id) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }

    const transfers = getUnseenTransfers(student_id);
    return NextResponse.json({ transfers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.transfer_id) {
      return NextResponse.json({ error: "Missing transfer_id" }, { status: 400 });
    }
    
    markTransferAsSeen(body.transfer_id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update transfer status" }, { status: 500 });
  }
}
