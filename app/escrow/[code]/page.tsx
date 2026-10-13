"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Loader2,
  ExternalLink
} from "lucide-react";

export default function EscrowClientPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [releaseSuccess, setReleaseSuccess] = useState<boolean>(false);

  // Fetch escrow details
  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const res = await fetch(`/api/escrow/${code}`);
        if (res.ok) {
          const data = await res.json();
          setEscrow(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Poll every 5 seconds so client sees when freelancer marks as delivered
    fetchEscrow();
    const interval = setInterval(fetchEscrow, 5000);
    return () => clearInterval(interval);
  }, [code]);

  const handleRelease = async () => {
    setIsReleasing(true);
    try {
      const res = await fetch(`/api/escrow/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "released" })
      });
      if (res.ok) {
        setReleaseSuccess(true);
        const updated = await res.json();
        setEscrow(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D26A]" />
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-xl font-bold mb-2">Escrow Not Found</div>
        <div className="text-slate-400">The code {code} is invalid or has expired.</div>
      </div>
    );
  }

  // If success modal is active
  if (releaseSuccess || escrow.status === "released") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-950 p-6 text-center">
        <div className="space-y-6 max-w-sm w-full animate-fadeIn bg-emerald-900/40 p-8 rounded-3xl border border-emerald-500/30 backdrop-blur-md shadow-2xl shadow-emerald-500/10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50">
            <CheckCircle2 className="h-14 w-14" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Payment Released!</h1>
            <p className="text-emerald-200/80 font-medium">
              ${escrow.amount_usdt.toFixed(2)} USDT has been successfully released to your freelancer.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-center gap-2 text-emerald-500/60 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Secured by Cleva
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950/80 p-6 text-center border-b border-slate-800 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 px-2 py-1 rounded-full uppercase">
            <ShieldCheck className="h-3 w-3" /> Secure Escrow
          </div>
          <h1 className="text-xl font-bold text-white mt-4 tracking-tight">Cleva Borderless</h1>
          <p className="text-xs text-slate-400 mt-1">Client Payment Release Portal</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            escrow.status === "funded" 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
              : "bg-blue-500/10 border-blue-500/20 text-blue-500"
          }`}>
            {escrow.status === "funded" ? <Lock className="h-5 w-5 mt-0.5" /> : <Unlock className="h-5 w-5 mt-0.5" />}
            <div>
              <div className="font-bold uppercase tracking-wider text-xs mb-1">
                Status: {escrow.status}
              </div>
              <div className="text-sm opacity-90 leading-snug">
                {escrow.status === "funded" 
                  ? "Funds are securely locked in escrow. The freelancer is currently working on the job."
                  : "The freelancer has marked the job as delivered. Please review and release the funds."
                }
              </div>
            </div>
          </div>

          {/* Job Details Box */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Freelancer</div>
              <div className="text-sm font-semibold text-white">Dev. Aisha (ID: {escrow.freelancer_id.substring(0, 8)})</div>
            </div>
            
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Job Description</div>
              <div className="text-sm text-slate-300 font-medium">{escrow.job_description}</div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Locked</div>
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1">
                  ${escrow.amount_usdt.toFixed(2)} <span className="text-sm font-bold text-[#00D26A]">USDT</span>
                </div>
              </div>
              <div className="text-[#00D26A] bg-[#00D26A]/10 p-2 rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          {escrow.status === "delivered" ? (
            <button
              onClick={handleRelease}
              disabled={isReleasing}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00D26A] hover:bg-emerald-400 text-slate-950 font-bold py-4 px-6 transition-all shadow-lg shadow-[#00D26A]/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isReleasing ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Releasing Funds...</>
              ) : (
                "Approve & Release Payment"
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-800 text-slate-500 font-bold py-4 px-6 cursor-not-allowed"
            >
              Waiting for Delivery...
            </button>
          )}

          <div className="text-center text-[10px] text-slate-600 font-medium pt-2 flex items-center justify-center gap-1">
            Learn more about Cleva Escrow Protection <ExternalLink className="h-3 w-3" />
          </div>

        </div>
      </div>
    </main>
  );
}
