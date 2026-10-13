"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark, ShieldCheck, CheckCircle2, History, Loader2, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function MicroLoansPage() {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Borrow State
  const [borrowAmount, setBorrowAmount] = useState(1);
  const [term, setTerm] = useState<7 | 30>(7);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Values
  const vaultBalance = data?.vault?.principal || 0;
  const borrowPct = data?.standing?.borrowing_power_pct || 0.4;
  const maxBorrow = Math.floor(vaultBalance * borrowPct);
  
  const fee = borrowAmount * 0.02;
  const totalRepay = borrowAmount + fee;
  
  const dueDateDisplay = new Date(Date.now() + term * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleBorrow = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principal: borrowAmount, term_days: term })
      });
      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D26A', '#009393', '#ffffff']
        });
        await fetchData(); // Refresh data to show active loan
      }
    } catch (error) {
      console.error(error);
    }
    setIsProcessing(false);
  };

  const handleRepay = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/loans", { method: "PATCH" });
      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D26A', '#009393', '#ffffff']
        });
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    }
    setIsProcessing(false);
  };

  const handleAutoRepayTrigger = async () => {
    try {
      const res = await fetch("/api/loans", { method: "PUT" });
      if (res.ok) await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-900"><Loader2 className="h-10 w-10 text-[#00D26A] animate-spin" /></div>;

  const { activeLoan, history, standing } = data;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <button onClick={() => router.push("/")} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors mb-4">
            <ChevronLeft className="h-4 w-4" /> Home
          </button>
          
          <div className="flex items-center gap-1.5 mb-1">
            <Landmark className="h-5 w-5 text-[#00D26A]" />
            <h1 className="text-xl font-extrabold tracking-tight">Micro-Loans</h1>
          </div>
          <p className="text-xs text-slate-400 italic">No bank. No credit check. Just your USDT.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-6 pb-20 scrollbar-hide">
          
          {/* Credit Standing Indicator */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Credit Standing</p>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="text-lg">{standing.emoji}</span> {standing.badge}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 mb-0.5">{standing.repaid_count} Repaid</p>
              <div className="text-xs font-bold text-[#00D26A]">{standing.borrowing_power_pct * 100}% LTV Limit</div>
            </div>
          </div>

          {activeLoan ? (
            /* ─── ACTIVE LOAN VIEW ─── */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#1a1a2e] border border-slate-800 rounded-[24px] p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                  📋 Active Loan
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Borrowed</p>
                    <p className="text-lg font-bold text-white">${activeLoan.principal.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase">You Repay</p>
                    <p className="text-lg font-bold text-amber-500">${activeLoan.total_repayable.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800/50 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-slate-400">Due: <span className="font-bold text-white">{new Date(activeLoan.due_at).toLocaleDateString()}</span></p>
                    <p className="text-[10px] font-bold text-amber-500">
                      {Math.ceil((new Date(activeLoan.due_at).getTime() - Date.now()) / 86400000)} days left
                    </p>
                  </div>
                  {/* Progress Bar Mock */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-3/4 rounded-full" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 text-[9px] text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-amber-500" />
                  Your vault (${activeLoan.collateral_amount.toFixed(2)}) is locked as collateral
                </div>
              </div>

              <button 
                onClick={handleRepay} disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold py-4 transition-all active:scale-[0.98]"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : `Repay $${activeLoan.total_repayable.toFixed(2)} USDT Now`}
              </button>

              <button onClick={handleAutoRepayTrigger} className="w-full text-center text-[10px] text-slate-500 underline mt-2 hover:text-white">
                [Admin: Simulate Auto-Repayment]
              </button>
            </div>
          ) : (
            /* ─── BORROW FLOW ─── */
            <div className="space-y-6 animate-fadeIn">
              
              {maxBorrow > 0 ? (
                <>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Your Borrowing Power</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">Vault Balance</span>
                      <span className="text-sm font-bold text-white">${vaultBalance.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-xs text-[#00D26A] font-semibold">Max Available ({borrowPct * 100}%)</span>
                      <span className="text-sm font-extrabold text-[#00D26A]">${maxBorrow.toFixed(2)} USDT</span>
                    </div>
                    <div className="pt-3 flex items-center gap-1.5 text-[9px] text-slate-500">
                      <CheckCircle2 className="h-3 w-3 text-[#00D26A]" /> You are eligible to borrow
                    </div>
                  </div>

                  <div className="bg-[#1a1a2e] border border-slate-800 rounded-[24px] p-6 relative overflow-hidden">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-2">How much do you need?</label>
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-4xl font-extrabold text-white tracking-tighter">
                        ${borrowAmount.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-[#00D26A]">USDT</div>
                    </div>
                    <input 
                      type="range" min="1" max={maxBorrow} step="1"
                      value={borrowAmount} onChange={(e) => setBorrowAmount(parseInt(e.target.value))}
                      className="w-full accent-green-500 mb-6 cursor-pointer"
                    />

                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-2">Select Term</label>
                    <div className="flex gap-3 mb-6">
                      <button onClick={() => setTerm(7)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${term === 7 ? 'bg-[#00D26A]/10 border-[#00D26A] text-[#00D26A]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>7 Days</button>
                      <button onClick={() => setTerm(30)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${term === 30 ? 'bg-[#00D26A]/10 border-[#00D26A] text-[#00D26A]' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>30 Days</button>
                    </div>

                    <div className="bg-slate-950 rounded-xl p-4 space-y-2 border border-slate-800/50 h-[104px] flex flex-col justify-between">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Flat Fee (2%)</span>
                        <span className="text-white font-medium font-mono">${fee.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Due Date</span>
                        <span className="text-white font-medium">{dueDateDisplay}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-800 font-bold">
                        <span className="text-[#00D26A]">Total Repay</span>
                        <span className="text-[#00D26A] font-mono">${totalRepay.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleBorrow} disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00D26A] text-slate-950 hover:bg-emerald-400 font-extrabold py-4 transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : `Get $${borrowAmount.toFixed(2)} USDT Now`}
                  </button>
                </>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Unlock Borrowing Power</h3>
                  <p className="text-xs text-slate-400">You need USDT in your StableSave vault to use as collateral before you can borrow.</p>
                  <button onClick={() => router.push("/stablesave")} className="text-xs font-bold text-[#00D26A] flex items-center justify-center gap-1 mx-auto hover:underline">
                    Go to StableSave <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loan History */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
              <History className="h-4 w-4" /> Past Loans
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              {history.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No loan history.</div>
              ) : (
                history.map((loan: any) => (
                  <div key={loan.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">${loan.principal.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">Fee: ${loan.fee.toFixed(2)} • {loan.term_days}d</p>
                    </div>
                    <div className="text-right">
                      {loan.status === 'repaid' || loan.status === 'auto_repaid' ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#00D26A] justify-end">
                          <CheckCircle2 className="h-3 w-3" /> Repaid
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-amber-500 uppercase">Active</div>
                      )}
                      <p className="text-[9px] text-slate-500 mt-1">{new Date(loan.disbursed_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
