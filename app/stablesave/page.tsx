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
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">
        
        {/* Modals */}
        {showDeposit && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-white">Deposit to Vault</h3>
                <button onClick={() => setShowDeposit(false)} className="text-slate-400 p-2">✕</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount to lock</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                  <input 
                    type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-4 text-xl font-bold text-white outline-none focus:border-[#22c55e]/50 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">USDT</div>
                </div>
              </div>

              {parseFloat(depositAmount) > 0 && (
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4">
                  <p className="text-xs text-[#22c55e] font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    At 8% APY, this earns ~${(parseFloat(depositAmount) * 0.08).toFixed(2)} in a year.
                  </p>
                </div>
              )}

              <button 
                onClick={handleDeposit} disabled={actionLoading || parseFloat(depositAmount) <= 0}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-emerald-400 text-slate-950 font-bold py-4 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deposit to Vault"}
              </button>
            </div>
          </div>
        )}

        {showWithdraw && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-white">Withdraw Vault</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-slate-400 p-2">✕</button>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <p className="text-sm text-slate-300">You are withdrawing your entire vault balance back to your main wallet.</p>
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Principal</span>
                    <span className="text-white font-bold">${formatNumber(vault?.principal || 0, 2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Yield Earned</span>
                    <span className="text-[#22c55e] font-bold">+${formatNumber(liveYield, 6)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-white font-bold">Total Payout</span>
                    <span className="text-white font-extrabold">${formatNumber(totalValue, 6)} USDT</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleWithdraw} disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-bold py-4 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="px-6 pt-8 pb-4 bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push("/")} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors">
              <ChevronLeft className="h-4 w-4" /> Home
            </button>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">Demo Mode 🚀</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">StableSave</h1>
          <p className="text-xs text-slate-400 mt-1">Inflation-proof dollar savings</p>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-6 pb-20 scrollbar-hide">
          
          {/* Locked Banner */}
          {vault?.is_locked && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">🔒</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-500">Vault Locked</h4>
                <p className="text-[10px] text-amber-500/80 mb-2">Your vault is currently acting as collateral for an active loan.</p>
                <button onClick={() => router.push("/loans")} className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  Go to Loans →
                </button>
              </div>
            </div>
          )}

          {/* HERO CARD (The Showstopper) */}
          <div className="bg-[#1a1a2e] border border-slate-800 rounded-[24px] p-6 shadow-2xl relative overflow-hidden">
            {/* Background embellishment */}
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-[#22c55e]/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-[#22c55e]" />
              </div>
              <span className="text-sm font-extrabold text-white">Your Yield Vault</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Principal</div>
                <div className="text-xl font-bold text-white">${formatNumber(vault?.principal || 0, 2)} <span className="text-xs text-slate-500 font-normal">USDT</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#22c55e]/70 mb-1">Earned Yield</div>
                <div className={`text-xl font-bold text-[#22c55e] transition-colors duration-300 ${pulse ? 'brightness-150' : ''}`}>
                  +${formatNumber(liveYield, 6)} <span className="text-xs font-normal">USDT</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/50 pt-5 pb-5 relative z-10">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 text-center">Total Value</div>
              <div className="flex justify-center items-end gap-1 font-mono tabular-nums">
                <span className="text-4xl font-extrabold text-white tracking-tighter">
                  ${Math.floor(totalValue)}
                </span>
                <span className={`text-2xl font-bold text-[#22c55e] tracking-tight pb-0.5 transition-colors duration-300 ${pulse ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}>
                  .{(totalValue % 1).toFixed(6).substring(2)}
                </span>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-3 italic">&quot;Your money grew while you read this.&quot;</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/50 pt-4 relative z-10">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                <span className="text-xs font-bold text-slate-300">APY: 8.00%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-full">
                <Activity className="h-3 w-3 text-[#22c55e]" />
                <span className="text-[9px] font-bold text-[#22c55e] uppercase tracking-wider">{vault?.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowDeposit(true)} disabled={vault?.is_locked}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-3.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Deposit
            </button>
            <button 
              onClick={() => setShowWithdraw(true)} disabled={!vault?.is_active || vault?.principal === 0 || vault?.is_locked}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-3.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" /> Withdraw
            </button>
          </div>

          {/* Yield History Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <History className="h-4 w-4" /> Yield History
              </h3>
              <div className="flex items-center gap-1 text-[9px] text-[#22c55e]">
                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Live feed
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[220px] overflow-y-auto space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No history yet.</p>
              ) : (
                history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'yield_credit' ? 'bg-[#22c55e]/10' : tx.type === 'deposit' ? 'bg-blue-500/10' : 'bg-slate-800'}`}>
                        {tx.type === 'yield_credit' ? <TrendingUp className="h-4 w-4 text-[#22c55e]" /> : tx.type === 'deposit' ? <Plus className="h-4 w-4 text-blue-400" /> : <Minus className="h-4 w-4 text-slate-400" />}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${tx.type === 'yield_credit' ? 'text-[#22c55e]' : 'text-white'}`}>
                          {tx.type === 'yield_credit' ? `+${formatNumber(tx.amount, 6)} USDT` : tx.type === 'deposit' ? `Deposited $${tx.amount}` : `Withdrew $${tx.amount}`}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {tx.type === 'yield_credit' ? 'yield credited' : tx.type === 'deposit' ? 'to vault' : 'from vault'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {timeAgo(tx.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Projection Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Projection Calculator</div>
            <div className="flex gap-3">
              <input 
                type="number" value={projAmount} onChange={e => setProjAmount(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#22c55e]/50"
              />
              <select 
                value={projDuration} onChange={e => setProjDuration(parseInt(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#22c55e]/50"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>1 Year</option>
              </select>
            </div>
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl p-4 text-center">
              <div className="text-xl font-extrabold text-[#22c55e]">+${formatNumber(pYield, 2)} USDT</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Earned in {projDuration} month{projDuration > 1 ? 's' : ''}</div>
              <div className="text-xs text-slate-500 font-medium mt-2">≈ ₦{formatNumber(pNgn, 0)} at current rates</div>
            </div>
          </div>

          {/* Comparison Callout */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white">Why keep money here?</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-950 rounded-lg p-3">
                <span className="text-xs text-slate-400 flex items-center gap-2">📉 Nigerian Banks</span>
                <span className="text-xs font-bold text-red-400">~4% NGN</span>
              </div>
              <div className="flex justify-between items-center bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-3 shadow-lg shadow-[#22c55e]/5">
                <span className="text-xs text-white font-bold flex items-center gap-2">🚀 Cleva Vault</span>
                <span className="text-xs font-bold text-[#22c55e]">8% USDT</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-center italic mt-2">
              &quot;Your naira savings lost 40% last year. Your USDT vault never will.&quot;
            </p>
          </div>

          <div className="pb-6 pt-4 flex justify-center opacity-50">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-slate-500">
              <ShieldCheck className="h-3 w-3" /> Powered by USDT on Tron
            </div>
          </div>

        </div>
          </div>
          <AISavingsCoach userId="freelancer-123" showCard />
        </main>
  );
}
