import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const DEFAULT_USER_ID = "freelancer-123";

const emptyLoans = () => ({
  activeLoan: null,
  loanHistory: [],
  vault: null,
  creditScore: { score: 100, tier: "New Member", loansRepaid: 0 },
});

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || DEFAULT_USER_ID;
    const [activeResult, historyResult, vaultResult] = await Promise.all([
      supabase.from("micro_loans").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
      supabase.from("micro_loans").select("*").eq("user_id", userId).in("status", ["repaid", "auto_repaid"]).order("repaid_at", { ascending: false }).limit(5),
      supabase.from("yield_vaults").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const firstError = activeResult.error || historyResult.error || vaultResult.error;
    if (firstError) throw firstError;

    const loanHistory = historyResult.data || [];
    const loansRepaid = loanHistory.length;
    const creditScore = loansRepaid >= 5
      ? { score: 98, tier: "Gold Circle", loansRepaid }
      : loansRepaid >= 3
        ? { score: 92, tier: "Reliable", loansRepaid }
        : loansRepaid >= 1
          ? { score: 87, tier: "Trusted", loansRepaid }
          : { score: 100, tier: "New Member", loansRepaid };

    return NextResponse.json({ activeLoan: activeResult.data || null, loanHistory, vault: vaultResult.data || null, creditScore });
  } catch (error) {
    console.error("Loans API error:", error);
    return NextResponse.json(emptyLoans());
  }
}

export async function PATCH(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || DEFAULT_USER_ID;
  const { data: loan } = await supabase.from("micro_loans").select("*").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!loan) return NextResponse.json({ error: "No active loan to repay" }, { status: 404 });
  const { data, error } = await supabase.from("micro_loans").update({ status: "repaid", repaid_at: new Date().toISOString(), repayment_source: "manual" }).eq("id", loan.id).select().single();
  if (error) return NextResponse.json({ error: "Repayment failed" }, { status: 500 });
  await supabase.from("yield_vaults").update({ is_locked: false }).eq("user_id", userId);
  return NextResponse.json({ success: true, loan: data });
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId : DEFAULT_USER_ID;
    const principal = Number(body.principal);
    const termDays = Number(body.termDays ?? body.term_days);
    const vaultBalance = Number(body.vaultBalance ?? 0);
    if (!userId || !Number.isFinite(principal) || principal <= 0 || ![7, 30].includes(termDays)) {
      return NextResponse.json({ error: "Missing or invalid loan fields" }, { status: 400 });
    }

    const { data: existing } = await supabase.from("micro_loans").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
    if (existing) return NextResponse.json({ error: "You already have an active loan." }, { status: 409 });

    const fee = Number((principal * 0.02).toFixed(2));
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + termDays);
    const { data: loan, error } = await supabase.from("micro_loans").insert({
      user_id: userId, principal, fee, total_repayable: principal + fee,
      collateral_amount: vaultBalance, term_days: termDays, due_at: dueAt.toISOString(), status: "active",
    }).select().single();
    if (error) throw error;

    await supabase.from("yield_vaults").update({ is_locked: true }).eq("user_id", userId);
    return NextResponse.json({ success: true, loan });
  } catch (error) {
    console.error("Loan creation error:", error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}
