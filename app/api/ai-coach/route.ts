import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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

async function generateContent(ai: GoogleGenAI, model: string, message: string, systemInstruction: string, maxOutputTokens = 1024) {
  const startedAt = Date.now();
  const response = await ai.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction,
      maxOutputTokens,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });
  const candidate = response.candidates?.[0];
  const usage = response.usageMetadata;
  console.log("[v0] Ada Gemini call", {
    model,
    finishReason: candidate?.finishReason,
    usage: {
      prompt: usage?.promptTokenCount,
      thinking: usage?.thoughtsTokenCount,
      output: usage?.candidatesTokenCount,
    },
    milliseconds: Date.now() - startedAt,
  });
  return response;
}

function trimToCompleteSentence(text: string) {
  const trimmed = text.trim();
  if (/[.!?)]$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^([\s\S]*[.!?)])(?:\s|$)/);
  return match?.[1]?.trim() ?? "";
}

function isRetryable(error: unknown) {
  const status = getErrorDetails(error).status;
  return status === 429 || status === 500 || status === 503;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const userId = typeof body.userId === "string" ? body.userId.trim().slice(0, 120) : "";
    if (!message || !userId) return NextResponse.json({ error: "Message and user are required." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Coach unavailable." }, { status: 503 });

    console.log("[v0] Ada request userId", userId);
    const supabaseStartedAt = Date.now();
    const queries = await Promise.all([
      Promise.resolve(supabase.from("users").select("display_name, wallet_balance").eq("id", userId).maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("wallet_transactions").select("type, amount_usdt, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)).catch(() => ({ data: [] })),
      Promise.resolve(supabase.from("yield_vaults").select("principal, accrued_yield, apy, is_active, is_locked").eq("user_id", userId).maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("micro_loans").select("principal, total_repayable, due_at, status").eq("user_id", userId).eq("status", "active").maybeSingle()).catch(() => ({ data: null })),
      Promise.resolve(supabase.from("ajo_members").select("contribution_amount, collateral_amount, collateral_status, ajo_circles(name, frequency, current_round)").eq("user_id", userId)).catch(() => ({ data: [] })),
      Promise.resolve(supabase.from("diaspora_transfers").select("amount_usdt, created_at, sender_name").eq("student_id", userId).order("created_at", { ascending: false }).limit(3)).catch(() => ({ data: [] })),
      Promise.resolve(supabase.from("ai_coach_conversations").select("user_message, coach_reply, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(6)).catch(() => ({ data: [] })),
    ]);

    console.log("[v0] Ada Supabase queries", { milliseconds: Date.now() - supabaseStartedAt });
    const [user, transactions, vault, loan, ajo, transfers, history] = queries;
    const context = { user: user.data ?? null, transactions: transactions.data ?? [], vault: vault.data ?? null, loan: loan.data ?? null, ajo: ajo.data ?? [], diasporaTransfers: transfers.data ?? [] };
    const conversationHistory = (history.data ?? []).reverse().map((item) => `User: ${item.user_message}\nAda: ${item.coach_reply}`).join("\n");
    const financialContext = JSON.stringify(context);
    const hasAccountDetails = Boolean(context.user || context.vault || context.loan || context.transactions.length || context.ajo.length || context.diasporaTransfers.length);
    const snapshot = hasAccountDetails
      ? `Here are the account details I could load: ${context.user?.wallet_balance != null ? `wallet $${context.user.wallet_balance}` : "wallet unavailable"}, ${context.vault?.principal != null ? `vault $${context.vault.principal}` : "vault unavailable"}, ${context.loan ? `loan due in ${Math.max(0, Math.ceil((new Date(context.loan.due_at).getTime() - Date.now()) / 86400000))} days` : "no active loan"}.`
      : "I couldn't load your account details.";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
    const systemInstruction = `You are Ada, a warm and direct savings coach for Nigerian university students using Cleva Borderless. Use only the financial context supplied. Give practical advice using Cleva features, never invent numbers or recommend outside products. Answer in at most 4 short sentences, then one specific action. Redirect unrelated questions by saying: I'm your savings coach — let's keep it financial!\n\nFinancial context:\n${financialContext}\n\nRecent chat history (at most 6 messages):\n${conversationHistory || "No previous chat history."}`;
    let response;
    let lastError: unknown;
    for (const candidate of [model, fallbackModel]) {
      try {
        response = await generateContent(ai, candidate, message, systemInstruction);
        break;
      } catch (error) {
        lastError = error;
        const details = getErrorDetails(error);
        console.error(`[v0] Gemini ${candidate} failed (${details.status ?? "unknown"}): ${details.message}`);
        if (!isRetryable(error)) break;
        if (candidate === model) {
          await sleep(800);
          try {
            response = await generateContent(ai, candidate, message, systemInstruction);
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
      return NextResponse.json({ reply: `I'm having trouble reaching my AI brain, but here is your snapshot: ${snapshot} Try me again in a moment.` });
    }
    let reply = response.text?.trim() || "";
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS" || (reply && !/[.!?)]$/.test(reply))) {
      const retryStartedAt = Date.now();
      try {
        const retryResponse = await generateContent(ai, model, message, systemInstruction, 2048);
        console.log("[v0] Ada truncation retry", { milliseconds: Date.now() - retryStartedAt });
        reply = retryResponse.text?.trim() || reply;
      } catch (retryError) {
        console.error("[v0] Ada truncation retry failed", getErrorDetails(retryError));
      }
    }
    reply = trimToCompleteSentence(reply) || `Here is your snapshot: ${snapshot} Try me again in a moment.`;
    await supabase.from("ai_coach_conversations").insert({ user_id: userId, user_message: message, coach_reply: reply });
    return NextResponse.json({ reply });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error(`[v0] AI Coach error (${details.status ?? "unknown"}): ${details.message}`);
    return NextResponse.json({ reply: "I'm having trouble reaching my AI brain. Try me again in a moment." });
  }
}
