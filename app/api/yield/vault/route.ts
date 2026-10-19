import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const DEFAULT_USER_ID = "freelancer-123";
const APY = 8;
const MINUTES_PER_YEAR = 525600;
const DEMO_MULTIPLIER = 1440;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || DEFAULT_USER_ID;
    const { data: vault, error } = await supabase.from("yield_vaults").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!vault || !vault.is_active) return NextResponse.json({ vault: vault || null, transactions: [] });

    const now = new Date();
    const minutesElapsed = Math.max(0, (now.getTime() - new Date(vault.last_accrued_at).getTime()) / 60000);
    const newYield = Number(vault.principal) * (APY / 100 / MINUTES_PER_YEAR) * minutesElapsed * DEMO_MULTIPLIER;
    const { data: updatedVault, error: updateError } = await supabase.from("yield_vaults").update({
      accrued_yield: Number(vault.accrued_yield || 0) + newYield,
      last_accrued_at: now.toISOString(),
    }).eq("user_id", userId).select().single();
    if (updateError) throw updateError;

    const { data: transactions } = await supabase.from("yield_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
    return NextResponse.json({ vault: updatedVault || vault, transactions: transactions || [] });
  } catch (error) {
    console.error("Vault API error:", error);
    return NextResponse.json({ vault: null, transactions: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId : DEFAULT_USER_ID;
    const action = body.action;
    if (action === "deposit") {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      const { data: current } = await supabase.from("yield_vaults").select("*").eq("user_id", userId).maybeSingle();
      const now = new Date().toISOString();
      const { data: vault, error } = await supabase.from("yield_vaults").upsert({
        user_id: userId, principal: Number(current?.principal || 0) + amount, accrued_yield: Number(current?.accrued_yield || 0),
        apy: Number(current?.apy || APY), is_active: true, is_locked: Boolean(current?.is_locked),
        deposited_at: current?.deposited_at || now, last_accrued_at: now,
      }, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return NextResponse.json(vault);
    }
    if (action === "withdraw") {
      const { data: vault, error } = await supabase.from("yield_vaults").update({ principal: 0, accrued_yield: 0, is_active: false, deposited_at: null }).eq("user_id", userId).eq("is_locked", false).select().single();
      if (error) throw error;
      return NextResponse.json({ total: 0, principal: 0, yield: 0, vault });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Vault action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
