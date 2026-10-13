"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Crown, Check, ChevronLeft, Copy, Loader2, RefreshCw, Zap,
  CheckCircle2, Clock, XCircle, Share2, ShieldCheck, ChevronDown,
  ChevronUp, AlertTriangle, Slash
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AjoMember {
  id: string; user_id: string; display_name: string; payout_position: number;
  has_received_payout: boolean; collateral_amount: number;
  collateral_status: "unlocked" | "locked" | "slashed" | "released";
  missed_contributions: number; commitment_tx_hash: string | null;
  mandate_preview_signed: boolean;
  reputation: { reputation_score: number; tier: string } | null;
}
interface Circle { id: string; name: string; contribution_amount: number; frequency: string; max_members: number; status: string; current_round: number; invite_code: string; }
interface Contribution { id: string; member_id: string; round_number: number; amount: number; status: "pending" | "paid" | "missed"; display_name: string; }
interface Payout { id: string; recipient_member_id: string; round_number: number; total_amount: number; status: "pending" | "released"; }
interface CollateralEvent { id: string; member_id: string; event_type: string; amount: number; round_number: number | null; reason: string; created_at: string; display_name: string; }
interface CircleDetail { circle: Circle; members: AjoMember[]; contributions: Contribution[]; currentPayout: Payout | null; collateralEvents: CollateralEvent[]; }

const MY_USER_ID = "freelancer-123";
const freqLabel: Record<string, string> = { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly" };

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" | "info" | "warning" }) {
  const styles = {
    success: "bg-[#00D26A] text-slate-950",
    error:   "bg-red-500 text-white",
    info:    "bg-[#009393] text-white",
    warning: "bg-amber-500 text-slate-950",
  };
  return (
    <div className={`absolute top-20 left-4 right-4 z-50 ${styles[type]} font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fadeIn`}>
      {type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : type === "warning" ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <Clock className="h-5 w-5 shrink-0" />}
      <span className="leading-snug">{message}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const collateralChip = (status: string, amount: number, contribution: number) => {
  if (status === "released") return <span className="text-[9px] font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">Released</span>;
  if (status !== "locked")   return <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Slashed</span>;
  if (amount < contribution) return <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">🟡 ${amount.toFixed(0)} Low</span>;
  return <span className="text-[9px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">🟢 ${amount.toFixed(0)}</span>;
};

const tierBadge = (tier: string | undefined) => {
  if (tier === "Gold Circle")  return "🥇 Gold";
  if (tier === "Reliable")     return "🥈 Reliable";
  if (tier === "Trusted")      return "⭐ Trusted";
  if (tier === "Blacklisted")  return "🚫 Banned";
  return "🆕 New";
};

const eventIcon = (type: string) => {
  if (type === "locked")   return "🔒";
  if (type === "slashed")  return "⚡";
  if (type === "released") return "✅";
  if (type === "topped_up") return "⬆️";
  return "•";
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  return "just now";
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CircleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const circleId = params.id as string;

  const [data, setData] = useState<CircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [markingRound, setMarkingRound] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ajo/circles/${circleId}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [circleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-900"><Loader2 className="h-10 w-10 animate-spin text-[#00D26A]" /></main>;
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white flex-col gap-4"><p className="font-bold">Circle not found.</p><button onClick={() => router.push("/ajo")} className="text-[#00D26A] underline text-sm">Back to Ajo</button></main>;

  const { circle, members, contributions, currentPayout, collateralEvents } = data;
  const totalMembers = members.length;
  const potSize = circle.contribution_amount * totalMembers;
  const currentRecipient = members.find((m) => m.id === currentPayout?.recipient_member_id);
  const myMember = members.find((m) => m.user_id === MY_USER_ID);
  const myContribution = contributions.find((c) => c.member_id === myMember?.id);
  const paidAmount = contributions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const progressPct = Math.min(100, Math.round((paidAmount / potSize) * 100));
  const isPotFull = paidAmount >= potSize;
  const alreadyContributed = myContribution?.status === "paid";
  const canRelease = isPotFull && currentPayout?.status === "pending" && circle.status === "active";
  const hasPendingContribs = contributions.some((c) => c.status === "pending");

  const handleContribute = async () => {
    if (!myMember || alreadyContributed) return;
    setContributing(true);
    try {
      const res = await fetch("/api/ajo/contribute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: myMember.id, circle_id: circle.id, round_number: circle.current_round }),
      });
      if (res.ok) {
        showToast(`✅ Your $${circle.contribution_amount} USDT contribution for Round ${circle.current_round} is confirmed!`, "success");
        await fetchData();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed.", "error");
      }
    } catch { showToast("Network error.", "error"); }
    finally { setContributing(false); }
  };

  const handleRelease = async () => {
    if (!canRelease) return;
    setReleasing(true);
    try {
      const res = await fetch("/api/ajo/release", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circle_id: circle.id, round_number: circle.current_round }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast(`🎉 Pot released! ${currentRecipient?.display_name} received $${potSize.toFixed(2)} USDT!`, "success");
        await fetchData();
      } else { showToast(d.error || "Failed.", "error"); }
    } catch { showToast("Network error.", "error"); }
    finally { setReleasing(false); }
  };

  const handleMarkRoundComplete = async () => {
    setMarkingRound(true);
    try {
      const res = await fetch("/api/ajo/mark-round", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circle_id: circle.id }),
      });
      const d = await res.json();
      if (res.ok) {
        const slashMsg = d.slashResults.length > 0
          ? d.slashResults.map((s: any) => `⚡ ${s.name}'s collateral was slashed $${s.amount} for Round ${circle.current_round} miss. Pot is fully funded.`).join(" | ")
          : "";
        if (slashMsg) showToast(slashMsg, "warning");
        else showToast(`🎉 ${d.recipientName} received $${d.potAmount} USDT!`, "success");
        await fetchData();
      } else { showToast(d.error || "Failed.", "error"); }
    } catch { showToast("Network error.", "error"); }
    finally { setMarkingRound(false); }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`cleava-borderless.vercel.app/ajo/join?code=${circle.invite_code}`).catch(() => {});
    setCodeCopied(true);
    showToast("Invite link copied!", "info");
    setTimeout(() => setCodeCopied(false), 3000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">
        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push("/ajo")} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"><ChevronLeft className="h-4 w-4" /> Back</button>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/ajo/reputation")} className="text-[10px] font-bold text-slate-500 hover:text-[#00D26A] transition-colors">My Rep →</button>
              <button onClick={fetchData} className="text-slate-500 hover:text-white transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{circle.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 border border-[#00D26A]/20 px-2 py-0.5 rounded-full uppercase">{circle.status}</span>
            <span className="text-[10px] text-slate-500">{freqLabel[circle.frequency] ?? circle.frequency}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "💰", label: "Pot / Round", value: `$${potSize}`, sub: "USDT" },
              { icon: "👥", label: "Members",     value: `${totalMembers}/${circle.max_members}`, sub: "joined" },
              { icon: "🔄", label: "Round",       value: `${circle.current_round}/${totalMembers}`, sub: "current" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-base mb-1">{s.icon}</div>
                <div className="text-sm font-extrabold text-white">{s.value}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rotation Timeline */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payout Rotation</div>
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-3 w-max px-1">
                {members.map((member) => {
                const isPast = member.has_received_payout;
                const isCurrent = member.payout_position === circle.current_round && !member.has_received_payout;
                return (
                  <div key={member.id} className={`relative shrink-0 flex flex-col items-center rounded-2xl py-3 px-2.5 w-[72px] border transition-all duration-500 ${
                    isCurrent ? "bg-[#00D26A]/10 border-[#00D26A]/40 scale-105 shadow-lg shadow-[#00D26A]/15"
                    : isPast   ? "bg-slate-900/30 border-slate-800/50 opacity-50"
                    : "bg-slate-900/60 border-slate-800"}`}>
                    {isCurrent && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base">👑</div>}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-extrabold mb-1.5 ${
                      isCurrent ? "bg-[#00D26A] text-slate-950 shadow-md shadow-[#00D26A]/30"
                      : isPast  ? "bg-slate-700 text-slate-400"
                      : "bg-slate-800 text-slate-500"}`}>
                      {isPast ? <Check className="h-4 w-4" /> : member.display_name.charAt(0)}
                    </div>
                    <div className={`text-[10px] font-bold truncate w-full text-center ${isCurrent ? "text-[#00D26A]" : isPast ? "text-slate-500" : "text-slate-400"}`}>
                      {member.display_name}
                    </div>
                    <div className={`text-[8px] font-semibold mt-0.5 uppercase tracking-wide ${isCurrent ? "text-[#00D26A]/70" : "text-slate-600"}`}>
                      {isCurrent ? "NOW" : isPast ? "Done" : `Rd ${member.payout_position}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pot Progress — Round {circle.current_round}</div>
              <div className="text-xs font-bold text-white">${paidAmount.toFixed(0)} <span className="text-slate-500 font-normal">/ ${potSize} USDT</span></div>
            </div>
            <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${isPotFull ? "bg-gradient-to-r from-[#00D26A] to-emerald-400 shadow-lg shadow-[#00D26A]/40" : "bg-gradient-to-r from-[#009393] to-[#00D26A]/60"}`} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={`text-center text-xs font-bold ${isPotFull ? "text-[#00D26A]" : "text-slate-500"}`}>
              {progressPct}% collected{isPotFull ? " — Pot Full! 🎉" : ""}
            </div>
          </div>

          {/* Contributions Table */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contributions — Round {circle.current_round}</div>
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 bg-slate-900/60 border-b border-slate-800">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Member</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-center">Amount</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right">Status</span>
              </div>
              {contributions.sort((a, b) => {
                const ma = members.find((m) => m.id === a.member_id);
                const mb = members.find((m) => m.id === b.member_id);
                return (ma?.payout_position ?? 0) - (mb?.payout_position ?? 0);
              }).map((c) => {
                const isMe = c.member_id === myMember?.id;
                return (
                  <div key={c.id} className={`grid grid-cols-3 items-center px-4 py-3 border-b border-slate-900 last:border-none ${isMe ? "bg-[#00D26A]/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isMe ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-slate-800 text-slate-400"}`}>{c.display_name.charAt(0)}</div>
                      <span className={`text-xs font-semibold truncate ${isMe ? "text-[#00D26A]" : "text-white"}`}>{c.display_name}{isMe ? " (You)" : ""}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold text-center">${c.amount.toFixed(2)}</div>
                    <div className="flex justify-end">
                      {c.status === "paid"    && <span className="flex items-center gap-1 text-[9px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /> Paid</span>}
                      {c.status === "pending" && <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" /> Pending</span>}
                      {c.status === "missed"  && <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" /> Missed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collateral & Reputation Table */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collateral Status</div>
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 bg-slate-900/60 border-b border-slate-800">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Member</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-center">Collateral</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right">Rep</span>
              </div>
              {members.map((m) => (
                <div key={m.id} className="grid grid-cols-3 items-center px-4 py-3 border-b border-slate-900 last:border-none">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">{m.display_name.charAt(0)}</div>
                    <div>
                      <div className="text-xs font-semibold text-white">{m.display_name}</div>
                      {m.mandate_preview_signed && <div className="text-[8px] text-[#00D26A] font-bold">🛡️ Full Prot.</div>}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {collateralChip(m.collateral_status, m.collateral_amount, circle.contribution_amount)}
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[9px] font-bold text-slate-400">{tierBadge(m.reputation?.tier)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collateral Events Feed (collapsible) */}
          {collateralEvents.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowEvents(!showEvents)} className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                <span>Circle Events</span>
                {showEvents ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showEvents && (
                <div className="space-y-2 animate-fadeIn">
                  {collateralEvents.map((ev) => (
                    <div key={ev.id} className={`flex items-start gap-3 rounded-xl p-3 border text-xs ${ev.event_type === "slashed" ? "border-red-500/20 bg-red-500/5 border-l-2 border-l-red-500" : "border-slate-800 bg-slate-900/40"}`}>
                      <span className="text-base shrink-0 mt-0.5">{eventIcon(ev.event_type)}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white">{ev.display_name}</span>
                        <span className="text-slate-400"> — {ev.reason}</span>
                      </div>
                      <span className="text-slate-600 text-[9px] shrink-0 mt-0.5">{timeAgo(ev.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invite Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Share2 className="h-3 w-3" /> Invite Friends</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-[#00D26A] tracking-widest text-center">{circle.invite_code}</div>
              <button onClick={handleCopyInvite} className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all active:scale-95 ${codeCopied ? "bg-[#00D26A] text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {codeCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-4 border-t border-slate-900 bg-slate-950/90 backdrop-blur-md shrink-0 space-y-2">
          {/* My Contribution Button */}
          {myMember && !alreadyContributed && (
            <button onClick={handleContribute} disabled={contributing} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-3.5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#00D26A]/20">
              {contributing ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : <><Zap className="h-4 w-4" /> Contribute My ${circle.contribution_amount} USDT</>}
            </button>
          )}
          {myMember && alreadyContributed && !canRelease && !hasPendingContribs && (
            <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00D26A]/10 border border-[#00D26A]/20 text-[#00D26A] font-bold py-3.5 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Contribution Confirmed
            </div>
          )}
          {/* Release Pot */}
          {canRelease && (
            <button onClick={handleRelease} disabled={releasing} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-emerald-400 text-slate-950 font-bold py-3.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#22c55e]/30 animate-pulse">
              {releasing ? <><Loader2 className="h-5 w-5 animate-spin" /> Releasing...</> : `🎉 Release Pot to ${currentRecipient?.display_name} ($${potSize} USDT)`}
            </button>
          )}
          {/* Mark Round Complete (handles auto-slash) */}
          {hasPendingContribs && (
            <button onClick={handleMarkRoundComplete} disabled={markingRound} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold py-3 text-xs transition-all hover:bg-amber-500/20 active:scale-[0.98] disabled:opacity-50">
              {markingRound ? <><Loader2 className="h-4 w-4 animate-spin" /> Slashing & Releasing...</> : <><Slash className="h-4 w-4" /> Mark Round Complete (Auto-Slash Pending)</>}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
