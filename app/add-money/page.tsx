"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Banknote,
  Globe,
  Coins,
  ShieldCheck,
} from "lucide-react";

const BALANCE = 1240.5;

const methods = [
  {
    id: "naira",
    icon: "🏦",
    title: "Convert Naira to USDT",
    sub: "Bank transfer or card · Instant conversion",
    tag: "Best for: Nigerian users",
    meta: "Fee: 1% spread · Rate: ₦1,700/$1 USDT",
    border: "border-l-[#16a34a]",
    bg: "hover:bg-[#16a34a]/5",
    dot: "bg-[#16a34a]",
    href: "/add-money/naira",
  },
  {
    id: "diaspora",
    icon: "🌍",
    title: "Receive from Diaspora",
    sub: "Share your link · Parent or sponsor sends",
    tag: "Best for: students with family abroad",
    meta: "Fee: Zero · Arrives in < 3 seconds",
    border: "border-l-[#3b82f6]",
    bg: "hover:bg-[#3b82f6]/5",
    dot: "bg-[#3b82f6]",
    href: "/add-money/diaspora",
  },
  {
    id: "usdt",
    icon: "₮",
    title: "Deposit USDT Directly",
    sub: "Send from external wallet · TRC-20 only",
    tag: "Best for: crypto-native users",
    meta: "Fee: Zero · Min: $1 USDT",
    border: "border-l-[#7c3aed]",
    bg: "hover:bg-[#7c3aed]/5",
    dot: "bg-[#7c3aed]",
    href: "/add-money/usdt",
  },
];

export default function AddMoneyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans antialiased flex flex-col">
      {/* Header */}
      <div className="bg-[#0B1120] border-b border-slate-800 px-4 pt-10 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Add Money
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Choose how you want to fund your wallet
        </p>

        {/* Balance chip */}
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700 px-4 py-2 rounded-full">
          <span className="h-2 w-2 rounded-full bg-[#00D26A] animate-pulse" />
          <span className="text-sm font-semibold text-white">
            Current Balance:{" "}
            <span className="text-[#00D26A]">
              ${BALANCE.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
            </span>
          </span>
        </div>
      </div>

      {/* Method Cards */}
      <div className="flex-1 px-4 py-6 space-y-3 max-w-lg mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Select a funding method
        </p>

        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => router.push(m.href)}
            className={`w-full text-left bg-[#1e293b] border border-slate-700/50 border-l-4 ${m.border} ${m.bg} rounded-2xl p-5 transition-all duration-200 active:scale-[0.98] group`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="text-2xl leading-none mt-0.5 shrink-0">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base leading-tight">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{m.sub}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">
                      {m.tag}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {m.meta}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors shrink-0 mt-1" />
            </div>
          </button>
        ))}

        {/* Trust Note */}
        <div className="mt-6 flex items-start gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
          <ShieldCheck className="h-5 w-5 text-[#00D26A] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-semibold">
              All deposits are secured
            </span>{" "}
            by Cleva&apos;s licensed infrastructure. Your USDT balance is always
            1:1 backed.
          </p>
        </div>
      </div>
    </main>
  );
}
