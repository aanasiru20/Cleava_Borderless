"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Clipboard, Clock3, Loader2, Lock, Mail, ShieldCheck, WalletCards, X } from "lucide-react";

type Escrow = {
  id: string;
  escrow_code: string;
  freelancer_id: string;
  freelancer_name?: string | null;
  client_email?: string | null;
  amount_usdt: number;
  job_description: string;
  status: "funded" | "delivered" | "released";
  funded_at?: string | null;
  created_at?: string | null;
  delivered_at?: string | null;
  released_at?: string | null;
  payout_method?: "usdt_wallet" | "paypal" | null;
  paypal_batch_id?: string | null;
};

const steps = ["funded", "delivered", "released"] as const;

const formatDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Just now";

export default function EscrowClientPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"usdt_wallet" | "paypal">("usdt_wallet");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [error, setError] = useState("");

  const loadEscrow = async () => {
    const response = await fetch(`/api/escrow/${encodeURIComponent(code)}`, { cache: "no-store" });
    if (response.status === 404) {
      setNotFound(true);
      setEscrow(null);
      return;
    }
    if (!response.ok) throw new Error("Unable to load escrow");
    setEscrow(await response.json());
  };

  useEffect(() => {
    loadEscrow().catch(() => setError("Unable to load this escrow link.")).finally(() => setLoading(false));
  }, [code]);

  const amount = useMemo(() => Number(escrow?.amount_usdt ?? 0).toFixed(2), [escrow]);
  const currentStep = escrow ? steps.indexOf(escrow.status) : -1;

  const release = async () => {
    if (!escrow) return;
    setIsReleasing(true);
    setError("");
    try {
      const response = await fetch(`/api/escrow/${encodeURIComponent(code)}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_method: payoutMethod, freelancer_paypal_email: payoutMethod === "paypal" ? paypalEmail : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Release failed");
      setEscrow(data.escrow);
      setShowSheet(false);
      setShowSuccess(true);
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : "Release failed. Please try again.");
    } finally {
      setIsReleasing(false);
    }
  };

  const resetDemo = async () => {
    setIsResetting(true);
    setError("");
    try {
      const response = await fetch(`/api/escrow/${encodeURIComponent(code)}/release`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset_demo: true }) });
      if (!response.ok) throw new Error("Unable to reset demo");
      setShowSuccess(false);
      await loadEscrow();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset demo");
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return <Frame><Loader2 className="size-7 animate-spin text-[#00D26A]" /></Frame>;
  if (notFound || !escrow) return <Frame><div className="w-full px-6 text-center"><h1 className="text-xl font-bold">Link not found</h1><p className="mt-2 text-sm text-slate-400">This escrow link does not exist or has expired.</p><button type="button" onClick={() => router.push("/")} className="mt-6 min-h-11 w-full rounded-xl bg-[#00D26A] font-bold text-slate-950">Back</button></div></Frame>;

  return (
    <Frame>
      <div className="flex h-full flex-col overflow-y-auto bg-slate-950 text-white">
        <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4">
          <button type="button" onClick={() => router.push("/")} aria-label="Back to Freelancer dashboard" className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-white/10"><ArrowLeft className="size-5" /></button>
          <div className="flex-1"><h1 className="font-bold">Escrow Payment</h1><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#00D26A]/10 px-2 py-1 text-[10px] font-bold text-[#00D26A]"><ShieldCheck className="size-3" /> Secured by USDT</span></div>
        </header>

        <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-8">
          <section className="rounded-2xl bg-[#00D26A]/10 p-4 text-[#00D26A]"><div className="flex items-start gap-3"><Lock className="mt-0.5 size-5" /><div><p className="font-bold">Client locked ${amount} USDT</p><p className="mt-1 text-xs text-emerald-200/70">Funded {formatDate(escrow.funded_at || escrow.created_at)}</p></div></div></section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900 p-4"><h2 className="text-sm font-bold">Payment details</h2><Detail label="Job" value={escrow.job_description} /><Detail label="Freelancer" value={escrow.freelancer_name || escrow.freelancer_id} /><Detail label="Client email" value={escrow.client_email || "Not provided"} /><Detail label="Escrow code" value={escrow.escrow_code} /></section>

          <section className="rounded-2xl border border-white/10 bg-slate-900 p-4"><div className="flex items-center justify-between">{steps.map((step, index) => <div key={step} className="flex flex-1 items-center last:flex-none"><div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${index <= currentStep ? "bg-[#00D26A] text-slate-950" : "bg-slate-800 text-slate-500"}`}>{index < currentStep ? <Check className="size-4" /> : index + 1}</div>{index < steps.length - 1 && <div className={`mx-1 h-0.5 w-full ${index < currentStep ? "bg-[#00D26A]" : "bg-slate-800"}`} />}</div>)}</div><div className="mt-2 flex justify-between text-[10px] font-semibold capitalize text-slate-400"><span>Funded</span><span>Delivered</span><span>Released</span></div></section>

          {escrow.status === "funded" && <p className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-slate-400">Waiting for the freelancer to deliver.</p>}
          {escrow.status === "delivered" && <button type="button" onClick={() => setShowSheet(true)} className="min-h-11 w-full rounded-xl bg-[#00D26A] px-4 font-bold text-slate-950">Approve and Release ${amount} USDT</button>}
          {escrow.status === "released" && <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#00D26A]/10 font-bold text-[#00D26A]"><CheckCircle2 className="size-5" /> Payment Released</div>}
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-300">{error}</p>}
          {code === "ESC-DEMO01" && <button type="button" onClick={resetDemo} disabled={isResetting} className="mx-auto block min-h-11 px-3 text-xs text-slate-500 underline hover:text-white">{isResetting ? "Resetting…" : "Reset demo"}</button>}
        </main>
      </div>

      {showSheet && <div className="absolute inset-0 z-20 flex items-end bg-slate-950/70"><div className="w-full rounded-t-3xl border-t border-white/10 bg-slate-900 p-4 pb-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Choose payout</h2><button type="button" onClick={() => setShowSheet(false)} aria-label="Close payout choice" className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-white/10"><X className="size-5" /></button></div><div className="space-y-2"><PayoutOption selected={payoutMethod === "usdt_wallet"} onClick={() => setPayoutMethod("usdt_wallet")} icon={<WalletCards className="size-5" />} title="USDT wallet" subtitle="Instant" /><PayoutOption selected={payoutMethod === "paypal"} onClick={() => setPayoutMethod("paypal")} icon={<Mail className="size-5" />} title="PayPal payout" subtitle="Send to email" /></div>{payoutMethod === "paypal" && <input type="email" value={paypalEmail} onChange={(event) => setPaypalEmail(event.target.value)} placeholder="Freelancer PayPal email" className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm outline-none focus:border-[#00D26A]" />}{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<button type="button" onClick={release} disabled={isReleasing || (payoutMethod === "paypal" && !paypalEmail)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00D26A] font-bold text-slate-950 disabled:opacity-50">{isReleasing && <Loader2 className="size-4 animate-spin" />}{isReleasing ? "Releasing…" : "Confirm and Release"}</button></div></div>}

      {showSuccess && <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full rounded-3xl border border-[#00D26A]/30 bg-slate-900 p-6 text-center"><CheckCircle2 className="mx-auto size-14 text-[#00D26A]" /><h2 className="mt-3 text-xl font-bold">Payment Released</h2><p className="mt-2 text-sm text-slate-300">${amount} USDT released to {escrow.freelancer_name || escrow.freelancer_id}</p><p className="mt-1 text-xs text-slate-500">{escrow.payout_method === "paypal" ? "PayPal payout" : "USDT wallet"} · {formatDate(escrow.released_at)}</p><p className="mt-2 text-[10px] text-slate-500">Reference: {escrow.paypal_batch_id || escrow.escrow_code}</p><button type="button" onClick={() => router.push("/")} className="mt-5 min-h-11 w-full rounded-xl bg-[#00D26A] font-bold text-slate-950">Done</button></div></div>}
    </Frame>
  );
}

function Frame({ children }: { children: ReactNode }) { return <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans"><div className="relative h-[min(844px,calc(100vh-2rem))] w-full max-w-[390px] overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 shadow-2xl">{children}</div></main>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-sm text-slate-200">{value}</div></div>; }
function PayoutOption({ selected, onClick, icon, title, subtitle }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) { return <button type="button" onClick={onClick} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left ${selected ? "border-[#00D26A] bg-[#00D26A]/10" : "border-white/10 bg-slate-950"}`}><span className="text-[#00D26A]">{icon}</span><span className="flex-1"><span className="block text-sm font-bold">{title}</span><span className="block text-xs text-slate-400">{subtitle}</span></span><span className={`size-4 rounded-full border-2 ${selected ? "border-[#00D26A] bg-[#00D26A]" : "border-slate-600"}`} /></button>; }
