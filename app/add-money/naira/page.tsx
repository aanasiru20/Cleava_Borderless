"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Loader2,
  Copy,
  CheckCircle2,
  CreditCard,
  Banknote,
  Check,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";

/* ─── Constants ─────────────────────────────────── */
const NGN_RATE = 1700;
const SPREAD = 0.01; // 1%
const PREV_BALANCE = 1240.5;
const USER_ID = "freelancer-123";
const QUICK_AMOUNTS = [2000, 5000, 10000, 20000, 50000];
const BANK_LOGOS = ["GTB", "Access", "Zenith", "UBA", "First"];

type Step =
  | "amount"
  | "method"
  | "bank-transfer"
  | "pending"
  | "card"
  | "card-loading"
  | "success";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function calcUsdt(ngn: number) {
  const fee = ngn * SPREAD;
  return ((ngn - fee) / NGN_RATE).toFixed(2);
}

/* ─── Countdown Timer Component ─────────────────── */
function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [left]);
  const m = Math.floor(left / 60)
    .toString()
    .padStart(2, "0");
  const s = (left % 60).toString().padStart(2, "0");
  const isUrgent = left < 300;
  return (
    <span className={`font-mono text-lg font-bold ${isUrgent ? "text-red-400" : "text-white"}`}>
      {m}:{s}
    </span>
  );
}

/* ─── Progress Bar ───────────────────────────────── */
function StepProgress({ step }: { step: Step }) {
  const map: Record<Step, number> = {
    amount: 1,
    method: 2,
    "bank-transfer": 3,
    pending: 3,
    card: 3,
    "card-loading": 3,
    success: 3,
  };
  const cur = map[step];
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((n) => (
        <React.Fragment key={n}>
          <div
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              n <= cur ? "bg-[#16a34a]" : "bg-slate-700"
            }`}
          />
        </React.Fragment>
      ))}
      <span className="text-[10px] text-slate-500 shrink-0">
        Step {cur} of 3
      </span>
    </div>
  );
}

function AnimatedAmount({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setVal(progress * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return <>+${val.toFixed(2)} USDT</>;
}

const generateRef = () => {
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  const rand2 = Math.random().toString(36).substring(2,6).toUpperCase();
  return `CLV-ADD-${rand}-${rand2}`;
};

export default function NairaConversionPage() {
  const router = useRouter();

  /* ─── State ──────────────────────────────────── */
  const [step, setStep] = useState<Step>("amount");
  const [transferStatus, setTransferStatus] = useState<"idle" | "verifying" | "pending">("idle");
  const [ngnAmount, setNgnAmount] = useState<number>(5000);
  const [ngnInput, setNgnInput] = useState<string>("5000");
  const [selectedQuick, setSelectedQuick] = useState<number | null>(5000);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card" | null>(null);
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [receipt, setReceipt] = useState<{
    ref: string;
    usdt: number;
    ngn: number;
    method: string;
    created_at: string;
  } | null>(null);

  /* ─── Derived ────────────────────────────────── */
  const fee = ngnAmount * SPREAD;
  const usdtReceive = parseFloat(calcUsdt(ngnAmount));
  const newBalance = parseFloat((PREV_BALANCE + usdtReceive).toFixed(2));

  const cardType =
    cardNumber.startsWith("4")
      ? "Visa"
      : cardNumber.startsWith("5")
      ? "Mastercard"
      : cardNumber.startsWith("6")
      ? "Verve"
      : null;

  /* ─── Handlers ───────────────────────────────── */
  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setNgnInput(clean);
    setNgnAmount(Number(clean) || 0);
    setSelectedQuick(null);
  };

  const handleQuickSelect = (val: number) => {
    setSelectedQuick(val);
    setNgnAmount(val);
    setNgnInput(val.toString());
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
  };

  const copyAcct = () => {
    navigator.clipboard.writeText("9031284756");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTransferConfirm = () => {
    setTransferStatus("verifying");
    
    setTimeout(() => {
      setTransferStatus("pending");
      
      const fetchPromise = fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          type: "naira_conversion",
          amount_usdt: usdtReceive,
          amount_naira: ngnAmount,
          exchange_rate: NGN_RATE,
          fee_usdt: fee / NGN_RATE,
          description: `Naira conversion — ${formatNaira(ngnAmount)} via Bank Transfer`,
        }),
      });

      setTimeout(async () => {
        try {
          const res = await fetchPromise;
          const data = await res.json();
          setReceipt({
            ref: data.transaction?.reference || generateRef(),
            usdt: usdtReceive,
            ngn: ngnAmount,
            method: "Naira Bank Transfer",
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          setReceipt({
            ref: generateRef(),
            usdt: usdtReceive,
            ngn: ngnAmount,
            method: "Naira Bank Transfer",
            created_at: new Date().toISOString(),
          });
        }
        setStep("success");
        setTransferStatus("idle");
      }, 2000);
    }, 500); // Small delay to show the spinner on button before replacing screen
  };

  const handleCardPay = () => {
    setStep("card-loading");
    setTimeout(async () => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          type: "naira_conversion",
          amount_usdt: usdtReceive,
          amount_naira: ngnAmount,
          exchange_rate: NGN_RATE,
          fee_usdt: fee / NGN_RATE,
          description: `Naira conversion — ${formatNaira(ngnAmount)} via Debit Card`,
        }),
      });
      const data = await res.json();
      setReceipt({
        ref: data.transaction?.reference || "CLV-ADD-2026-DEMO",
        usdt: usdtReceive,
        ngn: ngnAmount,
        method: "Debit Card",
        created_at: new Date().toISOString(),
      });
      setStep("success");
    }, 2500);
  };

  /* ─── Confetti on success ────────────────────── */
  useEffect(() => {
    if (step === "success") {
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#16a34a", "#22c55e", "#00D26A", "#f59e0b"],
      });
    }
  }, [step]);

  /* ─── Back navigation ────────────────────────── */
  const handleBack = () => {
    if (step === "amount") router.back();
    else if (step === "method") setStep("amount");
    else if (step === "bank-transfer" || step === "card") setStep("method");
    else if (step === "pending") setStep("bank-transfer");
    else if (step === "card-loading") setStep("card");
  };

  /* ─── SUCCESS SCREEN ─────────────────────────── */
  if (step === "success" && receipt) {
    return (
      <main className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans antialiased overflow-x-hidden max-w-[100vw] pb-20">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl mx-auto flex justify-center">🎉</div>
            <h1 className="text-2xl font-bold text-white">Money Added Successfully!</h1>
            <div className="text-4xl font-bold text-[#22c55e]">
              <AnimatedAmount target={receipt.usdt} />
            </div>
            <p className="text-slate-400 text-sm">added to your wallet</p>
          </div>

          <div className="w-full bg-[#1e293b] rounded-2xl p-4 border-l-4 border-l-[#22c55e]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Previous balance:</span>
                <span>${PREV_BALANCE.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-[#22c55e] font-medium">
                <span>Added:</span>
                <span>+${receipt.usdt.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>New balance:</span>
                <span>${(PREV_BALANCE + receipt.usdt).toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-slate-700 my-2 pt-2 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Method:</span>
                  <span>{receipt.method}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rate:</span>
                  <span>₦{NGN_RATE} = $1 USDT</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Time:</span>
                  <span>
                    {new Date(receipt.created_at).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short"
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs font-mono">
                  <span>Ref:</span>
                  <span>{receipt.ref}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Cleva Borderless Receipt\nRef: ${receipt.ref}\nAmount: +$${receipt.usdt.toFixed(2)} USDT\nMethod: ${receipt.method}\nDate: ${new Date(receipt.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })}\nBalance: $${(PREV_BALANCE + receipt.usdt).toFixed(2)} USDT`);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 h-[44px]"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy Receipt"}
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem('cleva_toast', `✅ $${receipt.usdt.toFixed(2)} USDT added to your wallet`);
                router.push("/");
              }}
              className="w-full bg-[#16a34a] hover:brightness-110 text-white font-bold py-3.5 rounded-xl transition-all h-[44px]"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setStep("amount");
                setReceipt(null);
                setTransferStatus("idle");
              }}
              className="w-full text-slate-400 hover:text-white font-medium py-2 text-sm h-[44px]"
            >
              + Add More Money
            </button>
          </div>
        </div>
        
        {/* Local Toast for Copy */}
        {copied && (
          <div className="fixed top-4 left-4 right-4 z-[9999] bg-[#16a34a] text-white p-4 rounded-xl shadow-lg font-medium text-center">
            Receipt copied to clipboard ✅
          </div>
        )}
      </main>
    );
  }



  /* ─── CARD-LOADING SCREEN ────────────────────── */
  if (step === "card-loading") {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-[#0d1b2a] border border-slate-800 rounded-[32px] p-8 text-center space-y-6">
          <Loader2 className="h-12 w-12 text-[#00D26A] animate-spin mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">Processing Payment...</h2>
            <p className="text-sm text-slate-400 mt-2">
              Charging {formatNaira(ngnAmount)} from your card
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#00D26A]" /> Secured by 256-bit encryption
          </div>
        </div>
      </main>
    );
  }

  /* ─── MAIN FLOW ──────────────────────────────── */
  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans antialiased flex flex-col pb-28">
      {/* Header */}
      <div className="bg-[#0B1120] border-b border-slate-800 px-4 pt-10 pb-5 sticky top-0 z-20">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">
            {step === "amount"
              ? "Add Money"
              : step === "method"
              ? "Amount"
              : step === "bank-transfer" || step === "card"
              ? "Payment Method"
              : "Back"}
          </span>
        </button>
        <h1 className="text-xl font-bold text-white">
          {step === "amount" && "Convert Naira to USDT"}
          {step === "method" && "How do you want to pay?"}
          {step === "bank-transfer" && "Bank Transfer Details"}
          {step === "card" && "Card Payment"}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        <StepProgress step={step} />

        {/* ── STEP 1: AMOUNT ─────────────────────── */}
        {step === "amount" && (
          <>
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-3">
                How much Naira do you want to convert?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ngnInput ? Number(ngnInput).toLocaleString("en-NG") : ""}
                  onChange={(e) =>
                    handleAmountChange(e.target.value.replace(/,/g, ""))
                  }
                  placeholder="0"
                  className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-[#16a34a] outline-none rounded-2xl pl-9 pr-4 py-4 text-xl font-bold transition-colors"
                />
              </div>

              {/* Quick select */}
              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => handleQuickSelect(v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      selectedQuick === v
                        ? "bg-[#16a34a]/10 border-[#16a34a] text-white"
                        : "bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {formatNaira(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Preview */}
            {ngnAmount > 0 && (
              <div className="bg-[#0d1b2a] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-base">💱</span>
                  <span className="font-bold text-white text-sm">
                    Conversion Summary
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "You pay:", val: formatNaira(ngnAmount) },
                    {
                      label: "Exchange rate:",
                      val: `₦${NGN_RATE} = $1 USDT`,
                      muted: true,
                    },
                    {
                      label: `Cleva spread (1%):`,
                      val: formatNaira(Math.round(fee)),
                      muted: true,
                    },
                  ].map(({ label, val, muted }) => (
                    <div
                      key={label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-slate-400">{label}</span>
                      <span
                        className={muted ? "text-slate-300" : "text-white font-semibold"}
                      >
                        {val}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800 border-dashed">
                    <span className="text-white font-bold text-sm">
                      You receive:
                    </span>
                    <span className="text-[#00D26A] font-black text-2xl">
                      ${usdtReceive.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#00D26A] bg-[#00D26A]/5 rounded-xl px-3 py-2">
                    <Zap className="h-3 w-3" />
                    Credited instantly to your wallet
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center pb-3">
                  Rate updates every 5 minutes · Last updated 2 min ago
                </p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: METHOD ─────────────────────── */}
        {step === "method" && (
          <div className="space-y-3">
            {[
              {
                id: "bank" as const,
                icon: "🏦",
                title: "Bank Transfer",
                sub: "Transfer from any Nigerian bank",
                logos: BANK_LOGOS,
                note: "Processing: Instant after confirmation",
              },
              {
                id: "card" as const,
                icon: "💳",
                title: "Debit Card",
                sub: "Pay with your Nigerian debit card",
                logos: ["Visa", "Mastercard", "Verve"],
                note: "Processing: Instant",
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setPaymentMethod(m.id);
                  setStep(m.id === "bank" ? "bank-transfer" : "card");
                }}
                className="w-full text-left bg-[#1e293b] border border-slate-700 hover:border-[#16a34a]/50 rounded-2xl p-5 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {m.logos.map((l) => (
                        <span
                          key={l}
                          className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">{m.note}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2A: BANK TRANSFER ──────────────── */}
        {step === "bank-transfer" && (
          <div className="space-y-4">
            <div className="bg-[#0d1b2a] border border-slate-800 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-semibold text-white">
                Transfer <span className="text-[#00D26A]">{formatNaira(ngnAmount)}</span> to this account:
              </p>

              {[
                { label: "Bank", val: "Providus Bank" },
                { label: "Account Name", val: "Cleva Borderless / Chidi Okafor" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}:</span>
                  <span className="text-white font-semibold text-right max-w-[200px]">
                    {val}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Account No:</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-white tracking-widest">
                    9031 2847 56
                  </span>
                  <button
                    onClick={copyAcct}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                      copied
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 border border-slate-700">
                <span className="text-xs text-slate-400">⏱ Account expires in:</span>
                <Countdown seconds={29 * 60 + 47} />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Send <strong>EXACTLY {formatNaira(ngnAmount)}</strong>. Other
                  amounts will cause delays.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2B: CARD ──────────────────────── */}
        {step === "card" && (
          <div className="space-y-5">
            {/* Summary bar */}
            <div className="bg-[#16a34a]/10 border border-[#16a34a]/30 rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-between">
              <span>Paying {formatNaira(ngnAmount)}</span>
              <span className="text-[#00D26A]">→ Receiving ${usdtReceive.toFixed(2)} USDT</span>
            </div>

            {/* Card form */}
            <div className="space-y-4">
              {/* Card number */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="____  ____  ____  ____"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    maxLength={19}
                    className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-[#16a34a] outline-none rounded-xl px-4 py-4 text-sm font-mono transition-colors pr-20"
                  />
                  {cardType && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                      {cardType}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Expiry
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={7}
                    className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-[#16a34a] outline-none rounded-xl px-4 py-4 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    CVV
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    maxLength={3}
                    className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-[#16a34a] outline-none rounded-xl px-4 py-4 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="As shown on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-[#16a34a] outline-none rounded-xl px-4 py-4 text-sm transition-colors"
                />
              </div>

              {cardType && (
                <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00D26A]" />
                  <span className="text-xs text-slate-300">
                    Detected: <strong className="text-white">{cardType}</strong>{" "}
                    ●●●● {cardNumber.replace(/\s/g, "").slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1120]/90 backdrop-blur border-t border-slate-800 p-4 z-50">
        <div className="max-w-lg mx-auto">
          {step === "amount" && (
            <button
              onClick={() => setStep("method")}
              disabled={ngnAmount < 100}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] ${
                ngnAmount >= 100
                  ? "bg-[#16a34a] hover:brightness-110 text-white shadow-lg shadow-[#16a34a]/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              Continue → Receive ${usdtReceive.toFixed(2)} USDT
            </button>
          )}
          {step === "method" && (
            <p className="text-center text-xs text-slate-500">
              Select a payment method above
            </p>
          )}
          {step === "bank-transfer" && transferStatus === "idle" && (
            <button
              onClick={handleTransferConfirm}
              className="w-full bg-[#16a34a] hover:brightness-110 text-white font-bold h-[44px] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#16a34a]/20"
            >
              I Have Made This Transfer ✓
            </button>
          )}
          {step === "bank-transfer" && transferStatus === "verifying" && (
            <button
              disabled
              className="w-full bg-[#16a34a]/60 text-white font-bold h-[44px] rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying Transfer...
            </button>
          )}
          {step === "bank-transfer" && transferStatus === "pending" && (
            <div className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
                <span className="font-bold text-white text-sm">Confirming Your Transfer...</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Checking with Bank...</div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-[#16a34a] transition-all duration-[2000ms] ease-out w-[85%]" />
              </div>
              <div className="text-xs text-slate-500 font-medium flex justify-between">
                <span>Verifying...</span>
                <span>This usually takes a few seconds</span>
              </div>
              <div className="text-xs text-slate-500 text-center">Do not close this page</div>
            </div>
          )}
          {step === "card" && (
            <button
              onClick={handleCardPay}
              disabled={
                cardNumber.replace(/\s/g, "").length < 16 ||
                cardExpiry.length < 7 ||
                cardCvv.length < 3 ||
                !cardName.trim()
              }
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] ${
                cardNumber.replace(/\s/g, "").length >= 16 &&
                cardExpiry.length >= 7 &&
                cardCvv.length >= 3 &&
                cardName.trim()
                  ? "bg-[#16a34a] hover:brightness-110 text-white shadow-lg shadow-[#16a34a]/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              🔒 Pay {formatNaira(ngnAmount)} Securely
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
