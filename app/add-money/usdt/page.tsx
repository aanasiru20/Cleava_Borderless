"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const DEPOSIT_ADDRESS = "TRRb7xK9mNpQ2cF4jL8sW1vA6dE3hY5uB";
const MOCK_DEPOSITS = [
  { id: 1, amount: 50, date: "3 days ago", status: "Confirmed" },
  { id: 2, amount: 25, date: "1 week ago", status: "Confirmed" },
];

function truncateAddress(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function UsdtDepositPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  /* Generate QR on client side (avoid SSR issues) */
  useEffect(() => {
    if (!showAddress) return;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(`tron:${DEPOSIT_ADDRESS}`, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        })
      )
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [showAddress]);

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
          <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl font-bold text-purple-400">
            ₮
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Deposit USDT Directly</h1>
            <p className="text-xs text-slate-400">TRC-20 · Tron Network · Zero fees</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">

        {/* Step 1 — Warning */}
        {!showAddress && (
          <>
            {/* Network Warning */}
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-amber-300">
                  ⚠️ IMPORTANT — Read Before Sending
                </h3>
              </div>
              <p className="text-sm text-amber-200/80 leading-relaxed">
                Only send <strong className="text-amber-300">USDT on the TRC-20 network</strong> (Tron).
                Sending on ERC-20 (Ethereum) or any other network will result in{" "}
                <strong className="text-red-400">permanent loss of funds.</strong>
              </p>
            </div>

            {/* Limits */}
            <div className="bg-[#0d1b2a] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Deposit Limits</h3>
              {[
                { label: "Minimum deposit", val: "$1.00 USDT" },
                { label: "Maximum per day", val: "$10,000.00 USDT" },
                { label: "Arrival time", val: "1–3 minutes after confirmation" },
                { label: "Network fee", val: "Zero" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}:</span>
                  <span className="text-white font-semibold">{val}</span>
                </div>
              ))}
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setAgreed((p) => !p)}
                className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  agreed
                    ? "bg-purple-600 border-purple-600"
                    : "border-slate-600 group-hover:border-purple-500"
                }`}
              >
                {agreed && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-slate-300">
                I understand — I will only send{" "}
                <span className="text-white font-semibold">TRC-20 USDT</span> to
                this address. I accept the risk of sending on wrong networks.
              </span>
            </label>

            {/* CTA */}
            <button
              onClick={() => agreed && setShowAddress(true)}
              disabled={!agreed}
              className={`w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] ${
                agreed
                  ? "bg-purple-600 hover:brightness-110 text-white shadow-lg shadow-purple-500/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              Show My Deposit Address →
            </button>
          </>
        )}

        {/* Step 2 — Address */}
        {showAddress && (
          <>
            <div className="text-center">
              <h2 className="font-bold text-white text-lg">Your USDT Deposit Address</h2>
              <p className="text-xs text-purple-400 font-semibold mt-1">TRC-20 · Tron Network Only</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl ? (
                <div className="bg-white p-4 rounded-2xl shadow-xl shadow-purple-500/10 border-2 border-purple-500/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="USDT Deposit QR Code"
                    className="h-48 w-48 rounded-lg"
                  />
                </div>
              ) : (
                <div className="h-56 w-56 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-black text-purple-400">₮</div>
                    <p className="text-xs text-slate-400">Generating QR...</p>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="w-full bg-[#0d1b2a] border border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Deposit Address
                </p>
                <p className="font-mono text-sm text-white break-all leading-relaxed hidden sm:block">
                  {DEPOSIT_ADDRESS}
                </p>
                <p className="font-mono text-sm text-white break-all leading-relaxed sm:hidden">
                  {truncateAddress(DEPOSIT_ADDRESS)}
                </p>
                <button
                  onClick={copyAddress}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] ${
                    copied
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  {copied ? (
                    <><Check className="h-4 w-4" /> Deposit address copied!</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy Address</>
                  )}
                </button>
              </div>
            </div>

            {/* Trust bullets */}
            <div className="space-y-2.5">
              {[
                "This address is unique to your account",
                "Funds arrive after 1 Tron block confirmation",
                "No expiry — this address is permanent",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#00D26A] shrink-0" />
                  <p className="text-sm text-slate-300">{t}</p>
                </div>
              ))}
            </div>

            {/* Powered by */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>⚡ Powered by Cleva Partner API + Tron Network</span>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800" />

            {/* Recent Deposits */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Recent Deposits
              </p>
              {MOCK_DEPOSITS.length > 0 ? (
                <div className="space-y-2">
                  {MOCK_DEPOSITS.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between bg-[#0d1b2a] border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#00D26A]" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            +${d.amount.toFixed(2)} USDT
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {d.date} · {d.status}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#00D26A] bg-[#00D26A]/10 px-2 py-0.5 rounded-md">
                        ✓ {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No deposits yet — send your first USDT above
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
