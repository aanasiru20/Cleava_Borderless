import { NextResponse } from "next/server";
import { getTransactionHistory } from "@/lib/yield-db";

const MOCK_USER_ID = "freelancer-123";

export async function GET() {
  try {
    const history = getTransactionHistory(MOCK_USER_ID, 50); // Get last 50 transactions
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
