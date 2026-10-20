"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AISavingsCoach from "@/components/AISavingsCoach";
import {
  ChevronLeft, Loader2, Wallet, TrendingUp, History, Info, CheckCircle2,
  AlertTriangle, DollarSign, ArrowRightLeft, Clock, Plus, Minus,
  Activity, Zap, ShieldCheck
} from "lucide-react";

// ─── Constants & Types ────────────────────────────────────────────────────────

const APY = 8.00; // 8% APY
const DEMO_MULTIPLIER = 1440; // 1 min = 1 day

interface VaultState {
  principal: number;
  accrued_yield: number;
  apy: number;
  is_active: boolean;
  is_locked: boolean;
  last_accrued_at: string;
}

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "yield_credit";
  amount: number;
  created_at: string;
}

const formatNumber = (num: number, decimals = 6) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);
  if (m > 0) return `${m}m ago`;
  const s = Math.floor(diff / 1000);
  if (s > 0) return `${s}s ago`;
  return "just now";
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StableSavePage() {
  const router = useRouter();
  
  // State
  const [vault, setVault] = useState<VaultState | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Projection State
  const [projAmount, setProjAmount] = useState("100");
  const [projDuration, setProjDuration] = useState(6); // months
  
  // Live Ticker State
  const [liveYield, setLiveYield] = useState(0);
  const [pulse, setPulse] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch("/api/yield/vault");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const nextVault = data.vault || null;
      setVault(nextVault ? { ...nextVault, is_locked: Boolean(nextVault.is_locked) } : null);
      setLiveYield(Number(nextVault?.accrued_yield || 0));
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Could not load your vault. Tap to retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/yield/history");
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchVault();
    fetchHistory();
  }, [fetchVault, fetchHistory]);

  // ─── Polling & Ticker ───────────────────────────────────────────────────────

  // History Polling (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Live Ticker (every 5s visually ticking up)
  useEffect(() => {
    if (!vault || !vault.is_active || vault.principal <= 0) return;

    const interval = setInterval(() => {
      // PER_MINUTE_RATE = 8% / 525600 = 0.000000152207
      const perMinuteRate = (APY / 100) / 525600;
      
      // Calculate how many real milliseconds have passed since last server accrual
      const now = Date.now();
      const last = new Date(vault.last_accrued_at).getTime();
      const msElapsed = now - last;
      const minutesElapsed = msElapsed / 60000;
      
      const simulatedMinutes = minutesElapsed * DEMO_MULTIPLIER;
      const newYieldSinceServer = vault.principal * (perMinuteRate * simulatedMinutes);
      
      setLiveYield(vault.accrued_yield + newYieldSinceServer);
      
      // Trigger pulse animation
      setPulse(true);
      setTimeout(() => setPulse(false), 500);

    }, 5000);

    return () => clearInterval(interval);
  }, [vault]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/yield/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", amount: amt })
      });
      if (res.ok) {
        await fetchVault();
        await fetchHistory();
        setShowDeposit(false);
        setDepositAmount("");
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
  };

  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/yield/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" })
      });
      if (res.ok) {
        await fetchVault();
        await fetchHistory();
        setShowWithdraw(false);
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
  };

  // ─── Projection Math ────────────────────────────────────────────────────────

  const pAmt = parseFloat(projAmount) || 0;
  const pYears = projDuration / 12;
  const pYield = pAmt * (APY / 100) * pYears;
  const pNgn = pYield * 1700; // Mock NGN rate

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
        <Loader2 className="h-10 w-10 animate-spin text-[#22c55e]" />
      </main>
    );
  }
  if (error) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center text-white"><p className="text-lg font-bold">Something went wrong</p><p className="text-sm text-slate-400">{error}</p><button onClick={() => { setLoading(true); fetchVault(); }} className="rounded-xl bg-[#22c55e] px-6 py-2 text-sm font-bold text-slate-950">Retry</button></main>;
  }

  const totalValue = (vault?.principal || 0) + liveYield;

  return (
    <main className="flex min-h-screen w-full flex-col overflow-y-auto bg-[#0f172a] pb-24 font-sans text-white antialiased scrollbar-hide">
      {/* Modals remain layered above the page, never in the document flow. */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full rounded-t-3xl border-t border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">Deposit to Vault</h3><button onClick={() => setShowDeposit(false)} className="p-2 text-slate-400" aria-label="Close deposit dialog">✕</button></div>
            <div className="mt-6 space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount to lock</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="50.00" className="w-full rounded-xl border border-slate-800 bg-slate-950 py-4 pl-8 pr-16 text-xl font-bold outline-none focus:border-[#22c55e]/50" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">USDT</span></div></div>
            {parseFloat(depositAmount) > 0 && <div className="mt-4 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/10 p-4 text-xs font-semibold text-[#22c55e]"><Zap className="mr-2 inline h-4 w-4" />At 8% APY, this earns ~${(parseFloat(depositAmount) * 0.08).toFixed(2)} in a year.</div>}
            <button onClick={handleDeposit} disabled={actionLoading || parseFloat(depositAmount) <= 0} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22c55e] py-4 font-bold text-slate-950 disabled:opacity-50">{actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deposit to Vault"}</button>
          </div>
        </div>
      )}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full rounded-t-3xl border-t border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">Withdraw Vault</h3><button onClick={() => setShowWithdraw(false)} className="p-2 text-slate-400" aria-label="Close withdrawal dialog">✕</button></div><div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5"><p className="text-sm text-slate-300">You are withdrawing your entire vault balance back to your main wallet.</p><div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs"><div className="flex justify-between"><span className="text-slate-400">Principal</span><span className="font-bold">${formatNumber(vault?.principal || 0, 2)}</span></div><div className="flex justify-between"><span className="text-slate-400">Yield Earned</span><span className="font-bold text-[#22c55e]">+${formatNumber(liveYield, 6)}</span></div><div className="flex justify-between pt-2 text-sm"><span className="font-bold">Total Payout</span><span className="font-extrabold">${formatNumber(totalValue, 6)} USDT</span></div></div></div><button onClick={handleWithdraw} disabled={actionLoading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-slate-950 disabled:opacity-50">{actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Withdrawal"}</button></div>
        </div>
      )}

      <header className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-4"><button onClick={() => router.push("/")} className="rounded-lg p-1 text-slate-300 hover:text-white" aria-label="Go back"><ChevronLeft className="h-5 w-5" /></button><h1 className="text-xl font-extrabold tracking-tight">StableSave</h1></header>

      <section className="w-full px-4 pt-4"><div className="w-full rounded-2xl border border-white/10 bg-[#1e293b] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-green-400" /><span className="font-bold">Your Yield Vault</span></div><span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest text-amber-400">Demo 🚀</span></div><div className="mt-6 grid grid-cols-2 gap-4"><div><p className="text-[10px] uppercase tracking-widest text-slate-500">Principal</p><p className="mt-1 text-xl font-bold">${formatNumber(vault?.principal || 0, 2)} <span className="text-xs font-normal text-slate-500">USDT</span></p></div><div className="text-right"><p className="text-[10px] uppercase tracking-widest text-green-400/70">Earned Today</p><p className={`mt-1 text-xl font-bold text-green-400 ${pulse ? "brightness-150" : ""}`}>+${formatNumber(liveYield, 6)} <span className="text-xs font-normal">USDT</span></p></div></div><div className="mt-6 border-t border-white/10 pt-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Total Value:</p><p className="mt-2 font-mono tabular-nums text-3xl font-bold text-green-400">${formatNumber(totalValue, 6)} USDT</p></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs"><span className="font-bold text-slate-300">APY: 8.00% 🟢</span><span className="font-bold text-green-400">Status: {vault?.is_active ? "ACTIVE ✅" : "INACTIVE"}</span></div></div></section>

      <section className="w-full px-4 pt-3">{vault?.is_locked && <div className="mb-3 w-full rounded-xl border border-amber-500/30 bg-amber-900/30 px-4 py-3 text-sm text-amber-100">🔒 Vault locked — active loan collateral <button onClick={() => router.push("/loans")} className="mt-1 block font-bold text-white underline">Repay loan →</button></div>}<div className="flex w-full gap-3"><button onClick={() => setShowDeposit(true)} disabled={vault?.is_locked} className="h-12 flex-1 rounded-xl bg-green-600 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" />Deposit to Vault</button><button onClick={() => setShowWithdraw(true)} disabled={!vault?.is_active || vault?.principal === 0 || vault?.is_locked} className="h-12 flex-1 rounded-xl border border-white/20 bg-transparent text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Minus className="mr-1 inline h-4 w-4" />Withdraw All + Yield</button></div></section>

      <section className="w-full px-4 pt-4"><AISavingsCoach userId="freelancer-123" showCard /></section>

      <section className="w-full px-4 pt-4"><div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">What could you earn?</div><div className="mt-4 flex gap-3"><input aria-label="Projection amount" type="number" value={projAmount} onChange={e => setProjAmount(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-bold outline-none focus:border-green-500/50" /><select aria-label="Projection duration" value={projDuration} onChange={e => setProjDuration(parseInt(e.target.value))} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-bold outline-none focus:border-green-500/50"><option value={1}>1 Month</option><option value={3}>3 Months</option><option value={6}>6 Months</option><option value={12}>1 Year</option></select></div><div className="mt-4 rounded-xl border border-green-500/10 bg-green-500/5 p-4 text-center"><div className="text-xl font-extrabold text-green-400">+${formatNumber(pYield, 2)} USDT</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Earned in {projDuration} month{projDuration > 1 ? "s" : ""}</div><div className="mt-2 text-xs text-slate-500">≈ ₦{formatNumber(pNgn, 0)} at current rates</div></div></div></section>

      <section className="w-full px-4 pt-4"><div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5"><h4 className="text-xs font-bold text-white">Why keep money here?</h4><div className="mt-3 space-y-2"><div className="flex items-center justify-between rounded-lg bg-slate-950 p-3"><span className="text-xs text-slate-400">📉 Nigerian Banks</span><span className="text-xs font-bold text-red-400">~4% NGN</span></div><div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3"><span className="text-xs font-bold text-white">🚀 Cleva Vault</span><span className="text-xs font-bold text-green-400">8% USDT</span></div></div></div></section>

      <section className="w-full px-4 pb-6 pt-4"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400"><History className="h-4 w-4" />Yield History</h3><span className="text-[9px] text-green-400">● Live feed</span></div><div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">{history.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">No history yet.</p> : history.map(tx => <div key={tx.id} className="flex items-center justify-between border-b border-white/5 py-2"><div className="flex min-w-0 items-center gap-2"><span className="text-green-400">🟢</span><span className="truncate text-sm text-gray-300">{tx.type === "yield_credit" ? "Yield credit" : tx.type === "deposit" ? "Deposit" : "Withdrawal"}</span></div><span className="whitespace-nowrap font-mono text-sm text-green-400">{tx.type === "withdraw" ? "-" : "+"}${formatNumber(tx.amount, 6)}</span></div>)}</div></section>

      <div className="flex justify-center pb-6 opacity-50"><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-slate-500"><ShieldCheck className="h-3 w-3" />Powered by USDT on Tron</div></div>
    </main>
  );
}
