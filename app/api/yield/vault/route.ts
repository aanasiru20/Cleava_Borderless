import { NextResponse } from "next/server";
import { getVaultForUser, depositToVault, withdrawFromVault } from "@/lib/yield-db";

const MOCK_USER_ID = "freelancer-123";

export async function GET() {
  try {
    const vault = getVaultForUser(MOCK_USER_ID);
    return NextResponse.json(vault);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vault" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action; // "deposit" | "withdraw"
    
    if (action === "deposit") {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      const vault = depositToVault(MOCK_USER_ID, amount);
      return NextResponse.json(vault);
    } 
    else if (action === "withdraw") {
      const result = withdrawFromVault(MOCK_USER_ID);
      return NextResponse.json(result);
    } 
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
