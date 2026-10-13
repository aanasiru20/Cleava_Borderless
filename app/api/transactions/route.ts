import { NextResponse } from "next/server";
import {
  createTransaction,
  getTransactionsByUser,
  WalletTransaction,
} from "@/lib/transactions-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      type,
      amount_usdt,
      amount_naira,
      exchange_rate,
      fee_usdt,
      description,
    } = body;

    if (!user_id || !type || amount_usdt === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTx = createTransaction({
      user_id,
      type,
      amount_usdt: Number(amount_usdt),
      amount_naira: Number(amount_naira || 0),
      exchange_rate: Number(exchange_rate || 0),
      fee_usdt: Number(fee_usdt || 0),
      description: description || "",
      status: "completed",
    });

    return NextResponse.json({ success: true, transaction: newTx }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("userId") || "freelancer-123";
    const txs = getTransactionsByUser(user_id);
    return NextResponse.json({ transactions: txs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
