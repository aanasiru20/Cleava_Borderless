import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorDetails(error: unknown) {
  const candidate = error as { status?: number; message?: string; error?: { status?: number; message?: string } };
  return {
    status: candidate?.status ?? candidate?.error?.status,
    message: candidate?.message ?? candidate?.error?.message ?? String(error),
  };
}

async function generateWithTimeout(ai: GoogleGenAI, model: string, message: string, systemInstruction: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const generation = ai.models.generateContent({ model, contents: message, config: { systemInstruction, maxOutputTokens: 300 } });
    return await Promise.race([
      generation,
      new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Gemini request timed out")), { once: true })),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryable(error: unknown) {
  const status = getErrorDetails(error).status;
  return status === 429 || status === 500 || status === 503 || getErrorDetails(error).message.toLowerCase().includes("timed out");
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const userId = typeof body.userId === "string" ? body.userId.trim().slice(0, 120) : "";
    if (!message || !userId) return NextResponse.json({ error: "Message and user are required." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Coach unavailable." }, { status: 503 });

    const queries = await Promise.all([
      Promise.resolve(supabase.from("users").select("display_name, wallet_balance").eq("id", userId).maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("wallet_transactions").select("type, amount_usdt, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)).catch(() => ({ data: [] })),
      Promise.resolve(supabase.from("yield_vaults").select("principal, accrued_yield, apy, is_active, is_locked").eq("user_id", userId).maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("micro_loans").select("principal, total_repayable, due_at, status").eq("user_id", userId).eq("status", "active").maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("ajo_members").select("contribution_amount, collateral_amount, collateral_status, ajo_circles(name, frequency, current_round)").eq("user_id", userId)).catch(() => ({ data: [] })),
      Promise.resolve(supabase.from("diaspora_transfers").select("amount_usdt, created_at, sender_name").eq("student_id", userId).order("created_at", { ascending: false }).limit(3)).catch(() => ({ data: [] })),
    ]);

    const [user, transactions, vault, loan, ajo, transfers] = queries;
    const context = { user: user.data ?? null, transactions: transactions.data ?? [], vault: vault.data ?? null, loan: loan.data ?? null, ajo: ajo.data ?? [], diasporaTransfers: transfers.data ?? [] };
    const financialContext = JSON.stringify(context);
    const snapshot = `wallet $${context.user?.wallet_balance ?? 0}, vault $${context.vault?.principal ?? 0}, loan due in ${context.loan?.due_at ? Math.max(0, Math.ceil((new Date(context.loan.due_at).getTime() - Date.now()) / 86400000)) : "no"} days`;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
    const systemInstruction = `You are Ada, a warm and direct savings coach for Nigerian university students using Cleva Borderless. Use only the financial context supplied. Give practical advice using Cleva features, never invent numbers or recommend outside products. Keep replies to four concise plain-text sentences. End with one specific actionable suggestion. Redirect unrelated questions by saying: I'm your savings coach — let's keep it financial!\n\nFinancial context:\n${financialContext}`;
    let response;
    let lastError: unknown;
    for (const candidate of [model, fallbackModel]) {
      try {
        response = await generateWithTimeout(ai, candidate, message, systemInstruction);
        break;
      } catch (error) {
        lastError = error;
        const details = getErrorDetails(error);
        console.error(`[v0] Gemini ${candidate} failed (${details.status ?? "unknown"}): ${details.message}`);
        if (candidate === model && isRetryable(error)) {
          await sleep(800);
          try {
            response = await generateWithTimeout(ai, candidate, message, systemInstruction);
            break;
          } catch (retryError) {
            lastError = retryError;
            const retryDetails = getErrorDetails(retryError);
            console.error(`[v0] Gemini retry failed (${retryDetails.status ?? "unknown"}): ${retryDetails.message}`);
          }
        }
      }
    }
    if (!response) {
      const details = getErrorDetails(lastError);
      console.error(`[v0] Gemini final failure (${details.status ?? "unknown"}): ${details.message}`);
      return NextResponse.json({ reply: `I'm having trouble reaching my AI brain, but here is your snapshot: ${snapshot}. Try me again in a moment.` });
    }
    const reply = response.text?.trim() || `Here is your snapshot: ${snapshot}. Try me again in a moment.`;
    await supabase.from("ai_coach_conversations").insert({ user_id: userId, user_message: message, coach_reply: reply });
    return NextResponse.json({ reply });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error(`[v0] AI Coach error (${details.status ?? "unknown"}): ${details.message}`);
    return NextResponse.json({ reply: "I'm having trouble reaching my AI brain. Try me again in a moment." });
  }
}
