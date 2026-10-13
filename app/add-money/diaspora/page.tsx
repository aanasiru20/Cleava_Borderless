"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Mail,
  MessageCircle,
  ChevronRight,
  Globe,
} from "lucide-react";

const USER_ID = "freelancer-123";
const ALLOWANCE_LINK = `cleava-borderless.vercel.app/diaspora/${USER_ID}`;
const WA_MESSAGE = encodeURIComponent(
  `Send me my allowance instantly via Cleva Borderless — zero fees, arrives in seconds:\nhttps://${ALLOWANCE_LINK}`
);
const EMAIL_SUBJECT = encodeURIComponent("Send me my allowance via Cleva Borderless");
const EMAIL_BODY = encodeURIComponent(
  `Hi,\n\nYou can send me my allowance instantly using Cleva Borderless — no bank account needed, zero fees, arrives in seconds.\n\nJust click this link:\nhttps://${ALLOWANCE_LINK}\n\nThank you!`
);

const HOW_IT_WORKS = [
  {
    step: "1",
    text: "Share your personal link with a parent or sponsor",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    step: "2",
    text: "They open it — no Cleva account needed on their side",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    step: "3",
    text: "They send USDT in any amount via card or wallet",
    color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  {
    step: "4",
    text: "You receive instantly with a dashboard notification",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
];

export default function DiasporaBridgePage() {
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${ALLOWANCE_LINK}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans antialiased flex flex-col pb-10">
      {/* Header */}
      <div className="bg-[#0B1120] border-b border-slate-800 px-4 pt-10 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Add Money</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
            🌍
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Receive From Abroad</h1>
            <p className="text-xs text-slate-400">Zero fees · Arrives in seconds</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">

        {/* Intro */}
        <p className="text-sm text-slate-300 leading-relaxed">
          Share your personal allowance link with anyone abroad. They send —
          you receive instantly.{" "}
          <span className="text-[#00D26A] font-semibold">Zero fees on both sides.</span>
        </p>

        {/* Link Card */}
        <div className="bg-[#0d1b2a] border border-blue-500/20 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Your Allowance Link
          </p>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
            <Globe className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-xs font-mono text-slate-300 flex-1 truncate">
              {ALLOWANCE_LINK}
            </span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 transition-all ${
                linkCopied
                  ? "bg-green-500/20 text-green-400"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {linkCopied ? (
                <><Check className="h-3 w-3" /> Copied!</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${WA_MESSAGE}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between bg-[#075E54]/20 border border-[#075E54]/40 hover:bg-[#075E54]/30 rounded-2xl p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📤</span>
              <div>
                <p className="font-semibold text-white text-sm">Share on WhatsApp</p>
                <p className="text-[10px] text-slate-400">Opens WhatsApp with pre-written message</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>

          <a
            href={`mailto:?subject=${EMAIL_SUBJECT}&body=${EMAIL_BODY}`}
            className="w-full flex items-center justify-between bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600/20 rounded-2xl p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-semibold text-white text-sm">Share via Email</p>
                <p className="text-[10px] text-slate-400">Opens email client with message draft</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>

          <button
            onClick={copyLink}
            className="w-full flex items-center justify-between bg-[#1e293b] border border-slate-700 hover:border-slate-600 rounded-2xl p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-semibold text-white text-sm">Copy Link</p>
                <p className="text-[10px] text-slate-400">Paste it anywhere</p>
              </div>
            </div>
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* How it works */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">💡</span>
            <h3 className="font-bold text-white text-sm">How it works</h3>
          </div>
          <div className="space-y-2.5">
            {HOW_IT_WORKS.map(({ step, text, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 mt-0.5 ${color}`}
                >
                  {step}
                </div>
                <p className="text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Last received */}
        <div className="bg-[#0d1b2a] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-xs font-bold text-white">Last received</p>
              <p className="text-[10px] text-slate-400">$100 USDT from Mum (UK) · 2 days ago</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#00D26A]">+$100.00</span>
        </div>
      </div>
    </main>
  );
}
