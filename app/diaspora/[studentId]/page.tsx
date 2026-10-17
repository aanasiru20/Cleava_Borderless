"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ShieldCheck, Zap, Globe, Copy, CheckCircle2,
  AlertTriangle, Loader2, CreditCard, Smartphone,
  Wallet, ExternalLink, Check
} from "lucide-react";

const NGN_RATE = 1700;
const WIRE_FEE = 35;

type Step = "form" | "loading" | "success";

interface Receipt {
  transaction_ref: string;
  amount_usdt: number;
  recipient: string;
  message: string;
  created_at: string;
}

export default function DiasporaLandingPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  // Mock Student Fetch
  const [student, setStudent] = useState<{name: string, uni: string} | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  
  useEffect(() => {
    // Simulate DB fetch delay
    setTimeout(() => {
      if (studentId === "freelancer-123" || studentId === "mock") {
        setStudent({ name: "Chidi Okafor", uni: "ABU Zaria · Computer Engineering" });
      } else {
        setStudent(null);
      }
      setLoadingStudent(false);
    }, 500);
  }, [studentId]);

  // Form State
  const [step, setStep] = useState<Step>("form");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderCountry, setSenderCountry] = useState("United Kingdom");
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple_pay" | "usdt">("card");
  const [message, setMessage] = useState("");
  
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  
  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(val);
    if (val) setAmount(Number(val));
  };
  
  const isFormComplete = senderName.trim() !== "" && senderEmail.trim() !== "" && amount > 0;
  
  const handleSend = async () => {
    if (!isFormComplete || !student) return;
    
    setStep("loading");
    
    try {
      const res = await fetch("/api/diaspora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          student_name: student.name,
          sender_name: senderName,
          sender_email: senderEmail,
          sender_country: senderCountry,
          amount_usdt: amount,
          payment_method: paymentMethod,
          personal_message: message,
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // Simulate 2.5s total processing time to show the loading screen for demo
      setTimeout(() => {
        setReceipt({
          transaction_ref: data.transfer.transaction_ref,
          amount_usdt: data.transfer.amount_usdt,
          recipient: data.transfer.student_name,
          message: data.transfer.personal_message,
          created_at: data.transfer.created_at,
        });
        setStep("success");
      }, 2500);
      
    } catch (e) {
      console.error(e);
      alert("Transfer failed. Please try again.");
      setStep("form");
    }
  };
  
  useEffect(() => {
    if (step === "success") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#16a34a", "#22c55e", "#f59e0b"]
      });
    }
  }, [step]);

  // ── ERROR STATE ────────────────────────────────────────────────────────
  if (!loadingStudent && !student) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Link Invalid</h2>
          <p className="text-slate-400">This allowance link is invalid or has expired.</p>
        </div>
      </main>
    );
  }

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (loadingStudent) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
      </main>
    );
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (step === "success" && receipt) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col p-4 md:p-8 items-center justify-center font-sans antialiased">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-green-500/10 rounded-bl-full blur-2xl pointer-events-none" />
            
            <div className="text-center space-y-4 relative z-10">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-green-500/10">
                🎉
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Allowance Sent Successfully!</h1>
                <p className="text-sm font-semibold text-green-400 mt-2">${receipt.amount_usdt.toFixed(2)} USDT → {receipt.recipient}</p>
                <p className="text-xs text-slate-500">{student?.uni}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">Delivered in 1.8 seconds</span>
              </div>
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">Zero fees charged</span>
              </div>
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">Receipt sent to your email</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800 border-dashed space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Transaction ID</span>
                <span className="text-xs font-mono text-slate-300">{receipt.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Amount</span>
                <span className="text-xs font-bold text-white">${receipt.amount_usdt.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Recipient</span>
                <span className="text-xs text-slate-300">{receipt.recipient}</span>
              </div>
              {receipt.message && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Message</span>
                  <span className="text-xs text-slate-300 text-right italic max-w-[200px]">"{receipt.message}"</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Timestamp</span>
                <span className="text-xs text-slate-300">
                  {new Date(receipt.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                </span>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`cleava-borderless.vercel.app/receipt/${receipt.transaction_ref}`);
                  alert("Receipt link copied!");
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <Copy className="h-4 w-4" /> Copy Receipt Link
              </button>
              <button onClick={() => window.location.reload()} className="w-full text-slate-400 hover:text-white font-medium py-2 text-sm transition-colors">
                Send Another Allowance
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex gap-4">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-bold text-white text-sm">Send allowances faster next time</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                  Create a free Cleva account to save {student?.name.split(" ")[0]}'s details and send in one tap next month.
                </p>
                <button className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                  Create Free Account →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── MAIN FORM SCREEN ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 pb-28 font-sans antialiased text-slate-300">
      
      {/* ── HEADER ── */}
      <div className="w-full bg-[#0B1120] border-b border-slate-800 px-4 py-8 md:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-black tracking-tighter text-white">
              Cleva<span className="text-green-500">.</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              Secure <CheckCircle2 className="h-3 w-3" /> Instant <CheckCircle2 className="h-3 w-3" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Send Allowance to</h2>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">👤</span> {student?.name}
            </h1>
            <p className="text-sm text-green-500 font-medium">{student?.uni}</p>
            <p className="text-sm text-slate-500 italic mt-2">Zero wire delays. Arrives in seconds. No bank account needed.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-xs font-medium text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> 256-bit Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-xs font-medium text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Instant Delivery
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-xs font-medium text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> USDT Stable — No FX Risk
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-xs font-medium text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
              <Globe className="h-3.5 w-3.5 text-purple-400" /> 190+ Countries
            </span>
          </div>
        </div>
      </div>
      
      {/* ── FORM CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        
        {/* SENDER DETAILS */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-white">Your Details</h3>
          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Your Name (e.g. Mrs. Adaeze Okafor)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-green-500 outline-none rounded-xl px-4 py-4 text-sm transition-colors"
              />
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Your Email (for receipt)"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-green-500 outline-none rounded-xl px-4 py-4 text-sm transition-colors"
              />
            </div>
            <div className="relative">
              <select 
                value={senderCountry}
                onChange={(e) => setSenderCountry(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-green-500 outline-none rounded-xl px-4 py-4 text-sm transition-colors appearance-none"
              >
                <option>🇬🇧 United Kingdom</option>
                <option>🇺🇸 United States</option>
                <option>🇨🇦 Canada</option>
                <option>🇩🇪 Germany</option>
                <option>🇦🇺 Australia</option>
                <option>🇿🇦 South Africa</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </section>
        
        {/* AMOUNT SELECTOR */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-white">How much are you sending?</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[50, 100, 250, 500].map(val => (
              <button
                key={val}
                onClick={() => handleAmountSelect(val)}
                className={`relative py-4 rounded-xl border font-bold transition-all flex items-center justify-center text-lg ${
                  amount === val && customAmount === "" 
                    ? "bg-green-500/10 border-green-500 text-white" 
                    : "bg-[#1e293b] border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                ${val} USDT
                {amount === val && customAmount === "" && (
                  <div className="absolute top-2 right-2 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-slate-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-400 mb-2 block">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="text" 
                placeholder="___"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-green-500 outline-none rounded-xl pl-8 pr-16 py-4 text-base font-bold transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">USDT</span>
            </div>
          </div>
          
          {/* LIVE BREAKDOWN CARD */}
          {amount > 0 && (
            <div className="mt-6 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <span className="text-lg">💸</span>
                <span className="font-bold text-white">Transfer Summary</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">You send:</span>
                  <span className="text-white font-medium">${amount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Cleva fee:</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center text-base border-t border-slate-800 border-dashed pt-4">
                  <span className="text-white font-bold">{student?.name.split(" ")[0]} receives:</span>
                  <span className="text-green-400 font-bold text-xl">${amount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Naira equivalent:</span>
                  <span className="text-slate-300 font-medium">₦{(amount * NGN_RATE).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Delivery time:</span>
                  <span className="text-slate-300 font-medium">&lt; 3 seconds</span>
                </div>
              </div>
              
              {/* Savings Banner */}
              <div className="bg-[#78350f] px-5 py-4 border-t border-[#92400e]">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <h4 className="font-bold text-[#fbbf24] text-sm">You save $25.00 vs bank wire transfer</h4>
                    <p className="text-xs text-[#fbbf24]/80 mt-1">Traditional wire: $35 fee + 3-5 day wait</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-500 mt-2">
            1 USDT = ₦{NGN_RATE.toLocaleString()} · Rate updated 2 min ago
          </p>
        </section>
        
        {/* PAYMENT METHOD SELECTOR */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-white">Payment Method</h3>
          <div className="space-y-3">
            
            {/* Card Option */}
            <div 
              onClick={() => setPaymentMethod("card")}
              className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start gap-3 ${
                paymentMethod === "card" 
                  ? "bg-green-500/10 border-green-500 border-l-4" 
                  : "bg-[#1e293b] border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "card" ? "border-green-500" : "border-slate-500"}`}>
                {paymentMethod === "card" && <div className="h-2 w-2 rounded-full bg-green-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-white" />
                  <span className="font-bold text-white text-sm">Card Payment</span>
                </div>
                <p className="text-xs text-slate-400">Visa, Mastercard, Verve</p>
                <p className="text-[10px] text-slate-500 mt-1">Processed via Stripe (sandbox)</p>
              </div>
            </div>
            
            {/* Apple/Google Pay Option */}
            <div 
              onClick={() => setPaymentMethod("apple_pay")}
              className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start gap-3 ${
                paymentMethod === "apple_pay" 
                  ? "bg-green-500/10 border-green-500 border-l-4" 
                  : "bg-[#1e293b] border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "apple_pay" ? "border-green-500" : "border-slate-500"}`}>
                {paymentMethod === "apple_pay" && <div className="h-2 w-2 rounded-full bg-green-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="h-4 w-4 text-white" />
                  <span className="font-bold text-white text-sm">Apple Pay / Google Pay</span>
                </div>
                <p className="text-xs text-slate-400">One-tap payment from your device</p>
              </div>
            </div>
            
            {/* Direct USDT Option */}
            <div 
              onClick={() => setPaymentMethod("usdt")}
              className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-3 ${
                paymentMethod === "usdt" 
                  ? "bg-green-500/10 border-green-500 border-l-4" 
                  : "bg-[#1e293b] border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "usdt" ? "border-green-500" : "border-slate-500"}`}>
                  {paymentMethod === "usdt" && <div className="h-2 w-2 rounded-full bg-green-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-white" />
                    <span className="font-bold text-white text-sm">Direct USDT Transfer</span>
                  </div>
                  <p className="text-xs text-slate-400">Send from your existing USDT wallet</p>
                  <p className="text-[10px] text-slate-500 mt-1">We'll show you a wallet address to send to</p>
                </div>
              </div>
              
              {paymentMethod === "usdt" && (
                <div className="ml-7 bg-slate-900 border border-slate-800 rounded-xl p-4 mt-2">
                  <p className="text-xs text-white font-medium mb-3">Send exactly <span className="text-green-400 font-bold">${amount.toFixed(2)} USDT (TRC-20)</span> to:</p>
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 mb-3">
                    <span className="text-xs font-mono text-slate-300 break-all pr-2">TRRb7...xK9m</span>
                    <button className="flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-300 shrink-0">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Only send TRC-20 USDT. Other tokens will be lost.</span>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </section>
        
        {/* PERSONAL MESSAGE */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Add a Message <span className="text-slate-500 font-normal text-sm">(Optional)</span></h3>
            <span className="text-xs text-slate-500 font-medium">{message.length}/160</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder="e.g. For your semester books and meals. Study hard, we are proud of you! ❤️"
            className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-green-500 outline-none rounded-xl px-4 py-4 text-sm transition-colors resize-none placeholder:text-slate-600"
          />
        </section>
        
      </div>
      
      {/* ── STICKY BOTTOM BAR ── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#0B1120] p-4">
        <div className="max-w-2xl mx-auto">
          {step === "loading" ? (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-[#16a34a]/80 text-white font-bold py-4 rounded-2xl shadow-lg cursor-not-allowed">
              <Loader2 className="h-5 w-5 animate-spin" /> Processing your transfer...
            </button>
          ) : (
            <button 
              onClick={handleSend}
              disabled={!isFormComplete}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                isFormComplete 
                  ? "bg-[#16a34a] text-white hover:brightness-110 shadow-green-500/20" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Zap className="h-5 w-5" /> Send ${amount.toFixed(2)} USDT to {student?.name.split(" ")[0]} Instantly →
            </button>
          )}
        </div>
      </div>
      
    </main>
  );
}
