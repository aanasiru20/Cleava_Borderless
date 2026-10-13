"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Hash,
  ArrowRight,
  RefreshCw,
  Crown,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface EnrichedCircle {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  status: string;
  current_round: number;
  invite_code: string;
  member_count: number;
  pot_size: number;
  paid_this_round: number;
  current_recipient_name: string | null;
}

export default function AjoHomePage() {
  const router = useRouter();
  const [circles, setCircles] = useState<EnrichedCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ajo/circles")
      .then((r) => r.json())
      .then((data) => setCircles(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    if (status === "active") return "bg-[#00D26A]/10 text-[#00D26A] border border-[#00D26A]/20";
    if (status === "forming") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-slate-700/50 text-slate-400 border border-slate-700";
  };

  const freqLabel: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">

        {/* Top Bar */}
        <div className="px-6 pt-8 pb-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Cleva Borderless
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 px-2 py-0.5 rounded-full uppercase tracking-wide border border-[#00D26A]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D26A] animate-pulse inline-block" />
              Live
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-3">Ajo Circles</h1>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            The Nigerian savings tradition.{" "}
            <span className="text-[#00D26A] font-semibold">Now inflation-proof in USDT.</span>
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/ajo/create")}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#00D26A] to-[#009393] text-slate-950 font-bold py-5 px-4 text-xs transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#00D26A]/20"
            >
              <Plus className="h-6 w-6" />
              Create a Circle
            </button>
            <button
              onClick={() => router.push("/ajo/join")}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 text-white font-bold py-5 px-4 text-xs transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <Hash className="h-6 w-6 text-[#009393]" />
              Join with Code
            </button>
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Your Active Circles
            </h2>
            <button
              onClick={() => {
                setLoading(true);
                fetch("/api/ajo/circles")
                  .then((r) => r.json())
                  .then((data) => setCircles(Array.isArray(data) ? data : []))
                  .finally(() => setLoading(false));
              }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Circles List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#00D26A]" />
            </div>
          ) : circles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center">
                <Users className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No circles yet.</p>
              <p className="text-xs text-slate-600">Create one or join with an invite code.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {circles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => router.push(`/ajo/${circle.id}`)}
                  className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all active:scale-[0.99] p-4 space-y-3 group"
                >
                  {/* Circle Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-white group-hover:text-[#00D26A] transition-colors">
                        {circle.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {freqLabel[circle.frequency] ?? circle.frequency}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadge(circle.status)}`}>
                        {circle.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-[#00D26A] transition-colors" />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/60 rounded-xl p-2.5 text-center">
                      <div className="text-base font-extrabold text-[#00D26A]">
                        ${circle.pot_size.toFixed(0)}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Pot / Round</div>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-2.5 text-center">
                      <div className="text-base font-extrabold text-white">
                        {circle.member_count}/{circle.max_members}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Members</div>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-2.5 text-center">
                      <div className="text-base font-extrabold text-white">
                        {circle.current_round}/{circle.max_members}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Round</div>
                    </div>
                  </div>

                  {/* Next Recipient */}
                  {circle.current_recipient_name && (
                    <div className="flex items-center gap-2 bg-[#00D26A]/5 border border-[#00D26A]/15 rounded-xl px-3 py-2">
                      <Crown className="h-3.5 w-3.5 text-[#00D26A] shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium">
                        <span className="text-[#00D26A] font-bold">{circle.current_recipient_name}</span> receives the pot this round
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Back Nav */}
        <div className="px-6 py-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md shrink-0">
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white font-semibold py-2.5 text-xs transition-all hover:bg-slate-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
