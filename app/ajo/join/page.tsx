"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, ChevronLeft, Hash, User, ShieldCheck, AlertTriangle,
  XCircle, CheckCircle2, FileText, Lock, ExternalLink, Check
} from "lucide-react";

const MOCK_BALANCE = 1240.50;

type Step = "input" | "checking" | "insufficient" | "blacklisted" | "contract" | "signing" | "tx_confirm";

interface CircleInfo {
  id: string; name: string; contribution_amount: number;
  frequency: string; max_members: number; invite_code: string;
}

function JoinCircleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get("code") ?? "");
  const [displayName, setDisplayName] = useState("Kofi");
  const [mockUserId] = useState(() => `user-${Math.random().toString(36).substring(2, 10)}`);
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [circleInfo, setCircleInfo] = useState<CircleInfo | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [circleId, setCircleId] = useState("");

  const freqLabel: Record<string, string> = { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly" };

  const handleCheckEligibility = async () => {
    if (!inviteCode.trim() || !displayName.trim()) {
      setError("Please enter both your name and the invite code.");
      return;
    }
    setStep("checking");
    setError("");
    try {
      // Fetch circle info first
      const res = await fetch("/api/ajo/circles");
      const circles = await res.json();
      const circle = circles.find((c: any) => c.invite_code === inviteCode.toUpperCase().trim());
      if (!circle) { setError("Invalid invite code. Check with your admin."); setStep("input"); return; }

      // Check reputation
      const repRes = await fetch(`/api/ajo/reputation?user_id=${mockUserId}`);
      if (repRes.ok) {
        const rep = await repRes.json();
        if (rep.tier === "Blacklisted") { setCircleInfo(circle); setStep("blacklisted"); return; }
      }

      // Check balance >= collateral
      if (MOCK_BALANCE < circle.contribution_amount) {
        setCircleInfo(circle);
        setStep("insufficient");
        return;
      }

      setCircleInfo(circle);
      setStep("contract");
    } catch {
      setError("Network error. Please try again.");
      setStep("input");
    }
  };

  const handleSignAndJoin = async () => {
    if (!agreed || !circleInfo) return;
    setStep("signing");

    try {
      const res = await fetch("/api/ajo/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: inviteCode.toUpperCase().trim(),
          user_id: mockUserId,
          display_name: displayName.trim(),
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        // Already a member - just redirect
        router.push(`/ajo/${data.circle_id}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to join.");

      // Generate TX hash
      const hash = "TX" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(hash);
      setCircleId(data.circle_id);
      setStep("tx_confirm");
    } catch (e: any) {
      setError(e.message);
      setStep("contract");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    
    // Extract code from full URL if pasted
    if (val.includes("CODE=")) {
      const parts = val.split("CODE=");
      val = parts[parts.length - 1].split("&")[0];
    } else if (val.includes("AJO-")) {
      const match = val.match(/(AJO-[A-Z0-9]+)/);
      if (match) val = match[1];
    }
    
    // Enforce max length of 8 manually after extraction
    if (val.length > 8) val = val.substring(0, 8);
    
    setInviteCode(val);
  };

  // ── Insufficient Balance Screen ──────────────────────────────────────────
  if (step === "insufficient" && circleInfo) {
    const needed = circleInfo.contribution_amount - MOCK_BALANCE;
    return (
      <FrameShell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
          <div className="h-20 w-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-white">Insufficient Balance</h2>
            <p className="text-sm text-slate-400">To join this circle you need collateral:</p>
          </div>
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Required (collateral)</span>
              <span className="text-sm font-bold text-white">${circleInfo.contribution_amount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Your balance</span>
              <span className="text-sm font-bold text-amber-400">${MOCK_BALANCE.toFixed(2)} USDT</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
              <span className="text-sm text-slate-400">You need</span>
              <span className="text-sm font-bold text-red-400">+${needed.toFixed(2)} more USDT</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-3.5 text-sm">
              Top Up Wallet
            </button>
            <button onClick={() => setStep("input")} className="w-full rounded-2xl border border-slate-700 text-slate-400 font-bold py-3 text-sm hover:text-white transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </FrameShell>
    );
  }

  // ── Blacklisted Screen ──────────────────────────────────────────────────
  if (step === "blacklisted") {
    return (
      <FrameShell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
          <div className="h-20 w-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-white">Circle Access Restricted</h2>
            <p className="text-sm text-slate-400 leading-relaxed">Your reputation score is too low to join new Ajo circles. You have defaulted on a previous circle commitment.</p>
          </div>
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Reputation Score</div>
            <div className="text-3xl font-extrabold text-red-400">20<span className="text-slate-500 text-lg">/100</span></div>
          </div>
          <button onClick={() => router.push("/ajo/reputation")} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-3.5 text-sm">
            View Your Reputation <ExternalLink className="h-4 w-4" />
          </button>
          <button onClick={() => setStep("input")} className="text-slate-500 text-sm hover:text-white transition-colors">← Go Back</button>
        </div>
      </FrameShell>
    );
  }

  // ── Smart Commitment Contract ────────────────────────────────────────────
  if ((step === "contract" || step === "signing") && circleInfo) {
    const contractId = `AJO-${circleInfo.id.substring(0, 8).toUpperCase()}-${mockUserId.substring(0, 8).toUpperCase()}`;
    const now = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    return (
      <FrameShell>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#00D26A]/10 border border-[#00D26A]/20 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-[#00D26A]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Ajo Commitment Contract</h2>
              <p className="text-[10px] text-slate-400">{circleInfo.name} · {circleInfo.max_members} Members · ${circleInfo.contribution_amount} USDT/{freqLabel[circleInfo.frequency] ?? circleInfo.frequency}</p>
            </div>
          </div>

          {/* Contract Body */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-4 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">By joining, you agree to:</div>
            {[
              `Lock $${circleInfo.contribution_amount.toFixed(2)} USDT as collateral today`,
              `Contribute $${circleInfo.contribution_amount.toFixed(2)} USDT every ${freqLabel[circleInfo.frequency] ?? circleInfo.frequency}`,
              `Your collateral will be AUTO-SLASHED if you miss a contribution round`,
              `Defaulting reduces your Ajo reputation score by 15 points`,
              `3 defaults = permanent circle ban (Blacklisted tier)`,
            ].map((term, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#00D26A] shrink-0 mt-0.5" />
                <span className="text-slate-300 text-xs leading-relaxed">{term}</span>
              </div>
            ))}

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Collateral Terms</div>
              {[
                `$${circleInfo.contribution_amount.toFixed(2)} USDT locked from your wallet now`,
                "Released back to you when circle completes",
                "Slashed to the pot if you miss a round",
                "Cannot be withdrawn while circle is active",
              ].map((term, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                  <span className="text-amber-400 shrink-0">•</span>{term}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">Enforcement</div>
              {[
                "Collateral slash is automatic — no appeals",
                "Circle admin cannot override slash logic",
                "All events are logged and visible to members",
              ].map((term, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                  <span className="text-red-400 shrink-0">•</span>{term}
                </div>
              ))}
            </div>

            {/* Contract Footer */}
            <div className="border-t border-slate-800 pt-4 space-y-1.5 text-[10px] text-slate-500">
              <div>Contract ID: <span className="text-slate-400 font-mono">{contractId}</span></div>
              <div>Timestamp: <span className="text-slate-400">{now}</span></div>
            </div>
          </div>

          {/* Agree Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${agreed ? "bg-[#00D26A] border-[#00D26A]" : "border-slate-600 group-hover:border-slate-400"}`}
              onClick={() => setAgreed(!agreed)}>
              {agreed && <Check className="h-3 w-3 text-slate-950" />}
            </div>
            <span className="text-xs text-slate-400 leading-relaxed select-none" onClick={() => setAgreed(!agreed)}>
              I have read and agree to these terms. I understand my collateral will be automatically slashed if I miss a contribution.
            </span>
          </label>

          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 text-center">⚠️ {error}</div>}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-900 space-y-2 shrink-0">
          <button
            onClick={handleSignAndJoin}
            disabled={!agreed || step === "signing"}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-4 text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#00D26A]/20"
          >
            {step === "signing" ? <><Loader2 className="h-5 w-5 animate-spin" /> Locking Collateral...</> : <><Lock className="h-4 w-4" /> Sign & Lock Collateral ✍️</>}
          </button>
          <button onClick={() => setStep("input")} className="w-full rounded-xl text-slate-500 font-semibold py-2.5 text-xs hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </FrameShell>
    );
  }

  // ── TX Hash Confirmation ─────────────────────────────────────────────────
  if (step === "tx_confirm" && circleInfo) {
    return (
      <FrameShell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
          <div className="h-20 w-20 rounded-full bg-[#00D26A]/20 border-2 border-[#00D26A]/40 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-[#00D26A]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-white">Commitment Recorded!</h2>
            <p className="text-sm text-emerald-400 font-semibold">✅ ${circleInfo.contribution_amount.toFixed(2)} USDT locked. You&apos;re in the circle!</p>
          </div>

          {/* TX Hash Card */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Commitment TX
            </div>
            <div className="font-mono text-[10px] text-[#00D26A] break-all leading-relaxed bg-slate-950 rounded-xl p-3 border border-slate-800">
              {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 8)}
            </div>
            <button
              onClick={() => window.open("https://tronscan.org", "_blank")}
              className="flex items-center gap-1.5 text-[11px] text-[#009393] hover:text-[#00D26A] transition-colors font-semibold"
            >
              <ExternalLink className="h-3 w-3" /> View on TronScan ↗
            </button>
            <p className="text-[10px] text-slate-500 leading-relaxed">All circle members can verify your commitment on-chain.</p>
          </div>

          {/* BVN Upsell */}
          <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">🔮 Upgrade Your Protection (Coming Q1 2027)</div>
            <p className="text-xs text-slate-400">Add bank direct debit mandate for extra protection — your circle members will trust you more.</p>
            <button onClick={() => router.push("/ajo/bvn-consent")} className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Preview BVN Consent Flow →
            </button>
          </div>

          <button
            onClick={() => router.push(`/ajo/${circleId}`)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-4 shadow-lg shadow-[#00D26A]/20"
          >
            Enter Circle Dashboard →
          </button>
        </div>
      </FrameShell>
    );
  }

  // ── Default: Code Input ──────────────────────────────────────────────────
  return (
    <FrameShell>
      <div className="px-6 pt-8 pb-5 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Join a Circle</h1>
        <p className="text-xs text-slate-400 mt-1">Enter your code. Lock collateral. Earn trust.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="flex flex-col items-center space-y-3 py-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00D26A]/20 to-[#009393]/20 border border-[#00D26A]/30 flex items-center justify-center">
            <Hash className="h-10 w-10 text-[#00D26A]" />
          </div>
          <p className="text-slate-500 text-xs text-center font-medium max-w-xs leading-relaxed">
            Get an invite code like <span className="font-bold text-[#00D26A]">AJO-7B3K</span> from your admin. A <span className="text-amber-400 font-semibold">collateral check</span> will run before you can join.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><User className="h-3 w-3" /> Your Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Kofi"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#00D26A]/50 transition-colors placeholder:text-slate-600" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Hash className="h-3 w-3" /> Invite Code</label>
          <input type="text" value={inviteCode} onChange={handleCodeChange}
            placeholder="AJO-XXXX"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-[#00D26A] tracking-widest outline-none focus:border-[#00D26A]/50 transition-colors placeholder:text-slate-600 placeholder:font-normal placeholder:tracking-normal text-center uppercase" />
        </div>

        {/* Balance Info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-medium">Your USDT Balance</span>
          <span className="text-sm font-bold text-[#00D26A]">${MOCK_BALANCE.toFixed(2)} USDT</span>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 font-medium text-center">⚠️ {error}</div>}
      </div>

      <div className="px-6 py-5 border-t border-slate-900 bg-slate-950/80 shrink-0">
        <button onClick={handleCheckEligibility} disabled={step === "checking"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#00D26A]/20">
          {step === "checking" ? <><Loader2 className="h-5 w-5 animate-spin" /> Checking Eligibility...</> : <><ShieldCheck className="h-5 w-5" /> Check Eligibility & Join →</>}
        </button>
      </div>
    </FrameShell>
  );
}

function FrameShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">
        {children}
      </div>
    </main>
  );
}

export default function JoinCirclePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-[#00D26A]" />
      </main>
    }>
      <JoinCircleContent />
    </Suspense>
  );
}
