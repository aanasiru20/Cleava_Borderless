"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, Building2, ShieldCheck, CheckCircle2,
  AlertTriangle, Check, User, FileText, ExternalLink
} from "lucide-react";

type BvnStep = "intro" | "bvn_input" | "verifying" | "banks_shown" | "mandate" | "signed";

const MOCK_BANKS = [
  { name: "GTBank", last4: "4521" },
  { name: "Access Bank", last4: "7832" },
  { name: "Opay", last4: "2901" },
];

const MANDATE_REF = "DMR-" + Math.random().toString(36).substring(2, 10).toUpperCase();

export default function BvnConsentPage() {
  const router = useRouter();
  const [step, setStep] = useState<BvnStep>("intro");
  const [bvn, setBvn] = useState("");
  const [agreedMandate, setAgreedMandate] = useState(false);

  const handleVerifyBvn = () => {
    if (bvn.length !== 11) return;
    setStep("verifying");
    setTimeout(() => setStep("banks_shown"), 2000);
  };

  const handleSignMandate = () => {
    if (!agreedMandate) return;
    setStep("signed");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">

        {/* ── AMBER ROADMAP BANNER — impossible to miss ──────────────────── */}
        <div className="shrink-0 bg-amber-500 px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-slate-950 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">🚧 Roadmap Feature — Launching Q1 2027</div>
            <div className="text-[10px] text-amber-900 font-medium">Requires CBN Direct Debit Mandate approval · Sandbox / Preview mode</div>
          </div>
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-3 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#009393]" /> BVN Bank Protection
          </h1>
          <p className="text-xs text-slate-400 mt-1">Preview the full bank-backed Ajo enforcement roadmap.</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── INTRO ──────────────────────────────────────────────────────── */}
          {step === "intro" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Explainer Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-[#009393]/10 border border-[#009393]/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[#009393]" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">How It Will Work</div>
                    <div className="text-[10px] text-slate-500">Bank-Backed Ajo Protection · Q1 2027</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { n: "1", text: "Link your BVN to verify your identity" },
                    { n: "2", text: "We detect your linked bank accounts" },
                    { n: "3", text: "You sign a Direct Debit Mandate" },
                    { n: "4", text: "If you default on an Ajo contribution, Cleva issues a query to your banks — funds auto-debited within 24 hours" },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-[#009393]/20 text-[#009393] flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">{s.n}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-800 text-center">
                  <p className="text-xs text-[#00D26A] font-bold">Your circle members get paid. Automatically. No matter what.</p>
                </div>
              </div>

              {/* Current vs Coming */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#00D26A]/5 border border-[#00D26A]/20 rounded-2xl p-4 space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#00D26A]">✅ Live Today</div>
                  <div className="text-xs text-white font-semibold">USDT Collateral</div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">Auto-slashed from wallet on default. Trustless & instant.</div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">🔮 Q1 2027</div>
                  <div className="text-xs text-white font-semibold">Bank Direct Debit</div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">Auto-debit from NGN bank account. CBN licence pending.</div>
                </div>
              </div>

              <button
                onClick={() => setStep("bvn_input")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#009393]/10 border border-[#009393]/30 hover:bg-[#009393]/20 text-[#009393] font-bold py-4 text-sm transition-all active:scale-[0.98]"
              >
                <ShieldCheck className="h-5 w-5" /> Preview BVN Verification →
              </button>
            </div>
          )}

          {/* ── BVN INPUT ──────────────────────────────────────────────────── */}
          {(step === "bvn_input" || step === "verifying") && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2 py-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-[#009393]/10 border border-[#009393]/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-[#009393]" />
                </div>
                <h2 className="text-base font-extrabold text-white">BVN Verification</h2>
                <p className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full inline-block">Preview Mode — BVN not stored or processed</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enter Your BVN</label>
                <input
                  type="tel" maxLength={11} value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                  placeholder="11-digit BVN number"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-base font-bold text-white tracking-widest outline-none focus:border-[#009393]/50 transition-colors placeholder:text-slate-600 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal text-center"
                />
                <p className="text-[10px] text-slate-600 text-center">Your BVN is never stored — this is a preview simulation only</p>
              </div>

              <button
                onClick={handleVerifyBvn}
                disabled={bvn.length !== 11 || step === "verifying"}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#009393]/10 border border-[#009393]/30 hover:bg-[#009393]/20 text-[#009393] font-bold py-4 text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {step === "verifying" ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying BVN (Preview)...</> : "Verify BVN — Preview"}
              </button>
            </div>
          )}

          {/* ── BANKS DETECTED ─────────────────────────────────────────────── */}
          {step === "banks_shown" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Verified banner */}
              <div className="flex items-center gap-3 bg-[#00D26A]/10 border border-[#00D26A]/20 rounded-2xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-[#00D26A] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">✅ BVN Verified <span className="text-[#00D26A] font-extrabold">(Preview Mode)</span></div>
                  <div className="text-[10px] text-slate-400">Identity: Chidi A. ••••••••</div>
                </div>
              </div>

              {/* Banks list */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Linked Banks Detected</div>
                </div>
                {MOCK_BANKS.map((bank) => (
                  <div key={bank.name} className="flex items-center justify-between px-4 py-3 border-b border-slate-900 last:border-none">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{bank.name}</div>
                        <div className="text-[10px] text-slate-500">•••• {bank.last4}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 px-2 py-0.5 rounded-full">Link ✓</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                These accounts will be used <span className="text-white font-semibold">ONLY</span> if you default on an Ajo contribution. Never for any other purpose.
              </p>

              <button
                onClick={() => setStep("mandate")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#009393] to-[#009393]/70 text-white font-bold py-4 text-sm transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#009393]/20"
              >
                <FileText className="h-5 w-5" /> Review Direct Debit Mandate →
              </button>
            </div>
          )}

          {/* ── MANDATE AGREEMENT ──────────────────────────────────────────── */}
          {step === "mandate" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="h-4 w-4 text-[#009393]" />
                  <span className="font-extrabold text-white text-sm">Direct Debit Mandate Agreement</span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  I, <strong className="text-white">Chidi A.</strong>, authorize{" "}
                  <strong className="text-white">Cleva Borderless</strong> (pending CBN license RC-XXXXXXX) to:
                </p>

                {[
                  "Verify my identity via BVN lookup",
                  "Query my linked bank accounts listed above",
                  "Initiate a direct debit of my missed Ajo contribution amount from any linked account with sufficient balance",
                  "This mandate is ONLY triggered on confirmed contribution default after a 24-hour grace period",
                  "I can revoke this mandate with 7 days notice provided no active Ajo circle is in progress",
                ].map((clause, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-400 leading-relaxed">
                    <span className="text-[#009393] shrink-0 font-bold">•</span>
                    {clause}
                  </div>
                ))}

                <div className="border-t border-slate-800 pt-4 space-y-1 text-[10px] text-slate-500">
                  <div>Mandate Reference: <span className="font-mono text-slate-400">{MANDATE_REF}</span></div>
                  <div>Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                </div>
              </div>

              {/* Agree checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setAgreedMandate(!agreedMandate)}
                  className={`shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedMandate ? "bg-[#009393] border-[#009393]" : "border-slate-600 group-hover:border-slate-400"}`}
                >
                  {agreedMandate && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-xs text-slate-400 leading-relaxed select-none" onClick={() => setAgreedMandate(!agreedMandate)}>
                  I understand this is a preview and will be legally binding upon Q1 2027 launch pending CBN approval.
                </span>
              </label>

              <button
                onClick={handleSignMandate}
                disabled={!agreedMandate}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#009393] to-[#00D26A]/70 text-white font-bold py-4 text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              >
                Sign Mandate Preview ✍️
              </button>
            </div>
          )}

          {/* ── SIGNED SUCCESS ─────────────────────────────────────────────── */}
          {step === "signed" && (
            <div className="flex flex-col items-center space-y-6 py-4 animate-fadeIn">
              <div className="h-20 w-20 rounded-full bg-[#00D26A]/20 border-2 border-[#00D26A]/40 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-[#00D26A]" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-extrabold text-white">🎉 Mandate Preview Signed</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your circle members can see you have completed the full protection setup.
                </p>
              </div>

              {/* Protection Summary */}
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current protection</span>
                  <span className="text-xs font-bold text-[#00D26A]">✅ USDT Collateral</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Coming Q1 2027</span>
                  <span className="text-xs font-bold text-amber-400">🔮 Bank Direct Debit</span>
                </div>
              </div>

              {/* Full Protection Badge */}
              <div className="w-full bg-[#00D26A]/5 border border-[#00D26A]/20 rounded-2xl p-4 text-center space-y-2">
                <div className="text-2xl">🛡️</div>
                <div className="text-sm font-extrabold text-[#00D26A]">Full Protection Badge Earned</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">You are now the most trusted member in your Ajo circle. Your shield badge will appear next to your name.</div>
              </div>

              <button
                onClick={() => router.push("/ajo")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-4 shadow-lg shadow-[#00D26A]/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Return to Ajo Circles →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
