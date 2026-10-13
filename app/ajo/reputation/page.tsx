"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Trophy, ArrowRight } from "lucide-react";

const MY_USER_ID = "freelancer-123";

interface Reputation {
  reputation_score: number; tier: string;
  circles_completed: number; circles_defaulted: number;
  total_contributed: number;
}

const TIER_INFO: Record<string, { emoji: string; color: string; maxJoin: string; benefit: string }> = {
  "New Member":  { emoji: "🆕", color: "text-slate-400",  maxJoin: "$10/round",  benefit: "Basic circle access" },
  "Trusted":     { emoji: "⭐", color: "text-blue-400",   maxJoin: "$50/round",  benefit: "Join circles up to $50/round" },
  "Reliable":    { emoji: "🥈", color: "text-slate-300",  maxJoin: "$100/round", benefit: "Join circles up to $100/round" },
  "Gold Circle": { emoji: "🥇", color: "text-amber-400",  maxJoin: "Unlimited",  benefit: "Create premium circles, skip collateral" },
  "Blacklisted": { emoji: "🚫", color: "text-red-400",    maxJoin: "None",       benefit: "No new circles allowed" },
};

const TIER_ORDER = ["New Member", "Trusted", "Reliable", "Gold Circle"];

export default function ReputationPage() {
  const router = useRouter();
  const [rep, setRep] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ajo/reputation?user_id=${MY_USER_ID}`)
      .then((r) => r.json())
      .then(setRep)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const score = rep?.reputation_score ?? 0;
  const tier  = rep?.tier ?? "New Member";
  const tierMeta = TIER_INFO[tier] ?? TIER_INFO["New Member"];

  // Calculate next tier
  const currentTierIdx = TIER_ORDER.indexOf(tier);
  const nextTier = currentTierIdx !== -1 && currentTierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIdx + 1] : null;
  const pointsNeeded = nextTier ? Math.max(0, 85 - score) : 0;

  // SVG ring progress
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">

        {/* Header */}
        <div className="px-6 pt-8 pb-5 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" /> Your Ajo Reputation
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#00D26A]" /></div>
          ) : !rep ? (
            <div className="text-center py-16 text-slate-500">No reputation data yet. Join a circle to start building yours!</div>
          ) : (
            <>
              {/* Score Ring + Tier */}
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="relative w-36 h-36">
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                    {/* Background ring */}
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
                    {/* Score ring */}
                    <circle
                      cx="60" cy="60" r={radius} fill="none"
                      stroke={tier === "Gold Circle" ? "#f59e0b" : tier === "Blacklisted" ? "#ef4444" : "#00D26A"}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white">{score}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">/ 100</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className={`text-xl font-extrabold ${tierMeta.color}`}>{tierMeta.emoji} {tier}</div>
                  <div className="text-xs text-slate-500">{tierMeta.benefit}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Circles Completed", value: rep.circles_completed, color: "text-[#00D26A]" },
                  { label: "Total Contributed", value: `$${rep.total_contributed.toFixed(0)}`, color: "text-[#009393]" },
                  { label: "Defaults", value: rep.circles_defaulted, color: rep.circles_defaulted > 0 ? "text-red-400" : "text-slate-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                    <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Next Tier Progress */}
              {nextTier && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Tier</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {TIER_INFO[nextTier].emoji} {nextTier} <ArrowRight className="h-3 w-3 text-slate-500" />
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#009393] to-[#00D26A] rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (score / 85) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {pointsNeeded > 0 ? `${pointsNeeded} more points to unlock ${nextTier}` : `Complete ${Math.max(0, 3 - rep.circles_completed)} more circles to unlock ${nextTier}`}
                  </p>
                </div>
              )}

              {/* Tier Benefits Ladder */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tier Benefits</div>
                <div className="space-y-2">
                  {TIER_ORDER.map((t) => {
                    const meta = TIER_INFO[t];
                    const isCurrentOrHigher = TIER_ORDER.indexOf(t) <= TIER_ORDER.indexOf(tier === "Blacklisted" ? "New Member" : tier);
                    return (
                      <div key={t} className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${t === tier ? "border-[#00D26A]/30 bg-[#00D26A]/5" : "border-slate-800 bg-slate-900/30 opacity-60"}`}>
                        <span className="text-base shrink-0">{meta.emoji}</span>
                        <div className="flex-1">
                          <div className={`text-xs font-bold ${t === tier ? "text-white" : "text-slate-500"}`}>{t}</div>
                          <div className="text-[10px] text-slate-500">{meta.benefit}</div>
                        </div>
                        {t === tier && <span className="text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BVN Upsell */}
              <button onClick={() => router.push("/ajo/bvn-consent")} className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-left space-y-1 hover:bg-amber-500/15 transition-colors active:scale-[0.99]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">🔮 Boost Trust — Coming Q1 2027</div>
                <div className="text-xs text-slate-400">Add BVN Bank Mandate to become the most trusted member in any circle.</div>
                <div className="text-xs font-bold text-amber-400 mt-1">Preview BVN Consent Flow →</div>
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
