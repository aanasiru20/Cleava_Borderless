import { NextResponse } from "next/server";
import { getActiveLoan, getLoanHistory, getCreditStanding, takeLoan, repayLoan, autoRepayLoanFromVault } from "@/lib/loans-db";
import { getVaultForUser } from "@/lib/yield-db";

const MOCK_USER = "freelancer-123";

export async function GET() {
  try {
    const activeLoan = getActiveLoan(MOCK_USER);
    const history = getLoanHistory(MOCK_USER);
    const standing = getCreditStanding(MOCK_USER);
    const vault = getVaultForUser(MOCK_USER);
    
    return NextResponse.json({ activeLoan, history, standing, vault });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch loan data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { principal, term_days } = await request.json();
    if (!principal || !term_days || (term_days !== 7 && term_days !== 30)) {
      return NextResponse.json({ error: "Invalid loan parameters" }, { status: 400 });
    }
    const loan = takeLoan(MOCK_USER, parseFloat(principal), term_days);
    return NextResponse.json(loan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to borrow" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const repayment = repayLoan(MOCK_USER);
    return NextResponse.json(repayment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Repayment failed" }, { status: 500 });
  }
}

export async function PUT() {
  // Admin trigger for auto-repayment
  try {
    const repayment = autoRepayLoanFromVault(MOCK_USER);
    if (!repayment) return NextResponse.json({ error: "No active loan to auto-repay" }, { status: 400 });
    return NextResponse.json(repayment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Auto-repayment failed" }, { status: 500 });
  }
}
