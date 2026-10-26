import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const userId = typeof body.userId === "string" ? body.userId.trim().slice(0, 120) : "";
    if (!message || !userId) return NextResponse.json({ error: "Message and user are required." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Coach unavailable." }, { status: 503 });

    const results = await Promise.all([
      supabase.from("users").select("display_name, wallet_balance").eq("id", userId).maybeSingle(),
      supabase.from("wallet_transactions").select("type, amount_usdt, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("yield_vaults").select("principal, accrued_yield, apy, is_active, is_locked").eq("user_id", userId).maybeSingle(),
      supabase.from("micro_loans").select("principal, total_repayable, due_at, status").eq("user_id", userId).eq("status", "active").maybeSingle(),
      supabase.from("ajo_members").select("contribution_amount, collateral_amount, collateral_status, ajo_circles(name, frequency, current_round)").eq("user_id", userId),
      supabase.from("diaspora_transfers").select("amount_usdt, created_at, sender_name").eq("student_id", userId).order("created_at", { ascending: false }).limit(3),
    ]);

    const [user, transactions, vault, loan, ajo, transfers] = results;
    const financialContext = JSON.stringify({ user: user.data ?? null, transactions: transactions.data ?? [], vault: vault.data ?? null, loan: loan.data ?? null, ajo: ajo.data ?? [], diasporaTransfers: transfers.data ?? [] });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: message, config: { systemInstruction: `You are Ada, a warm and direct savings coach for Nigerian university students using Cleva Borderless. Use only the financial context supplied. Give practical advice using Cleva features, never invent numbers or recommend outside products. Keep replies to four concise plain-text sentences unless asked for detail. End with one specific actionable suggestion. Redirect unrelated questions by saying: I'm your savings coach — let's keep it financial!\n\nFinancial context:\n${financialContext}`, maxOutputTokens: 1000 } });
    const reply = response.text?.trim() || "I couldn’t process that right now. Please try again.";
    await supabase.from("ai_coach_conversations").insert({ user_id: userId, user_message: message, coach_reply: reply });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[v0] AI Coach error:", error);
    return NextResponse.json({ error: "Coach unavailable. Try again." }, { status: 500 });
  }
}
