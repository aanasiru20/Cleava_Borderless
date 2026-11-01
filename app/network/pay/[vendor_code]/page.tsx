"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CheckCircle2, Loader2, Info, ArrowDownUp } from "lucide-react";
import confetti from "canvas-confetti";

export default function StudentPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const vendor_code = params.vendor_code as string;
  
  const [vendor, setVendor] = useState<any>(null);
  const [network, setNetwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment State
  const [amountNgn, setAmountNgn] = useState("");
  const [description, setDescription] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [successTx, setSuccessTx] = useState<any>(null);

  const NGN_RATE = 1700;
  const usdtEquivalent = parseFloat(amountNgn) > 0 ? (parseFloat(amountNgn) / NGN_RATE).toFixed(2) : "0.00";

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/network`); // Gets NET-ABU01
      if (res.ok) {
        const data = await res.json();
        setNetwork(data.network);
        const v = data.vendors.find((vx: any) => vx.vendor_code === vendor_code);
        setVendor(v);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [vendor_code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async () => {
    const amount = parseFloat(usdtEquivalent);
    if (amount <= 0 || isNaN(amount)) return;
    
    setIsPaying(true);
    try {
      const res = await fetch("/api/network/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_code,
          payer_id: "user-current-student", // Mock payer
          amount_usdt: amount,
          naira_equivalent: parseFloat(amountNgn),
          description
        })
      });

      if (res.ok) {
        const tx = await res.json();
        setSuccessTx(tx);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D26A', '#009393', '#ffffff']
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsPaying(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D26A]" />
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-white">
        Vendor not found.
      </main>
    );
  }

  if (successTx) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#00D26A] p-4 font-sans antialiased animate-fadeIn">
        <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl p-8 justify-center items-center text-center">
          <div className="h-24 w-24 rounded-full bg-[#00D26A]/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-[#00D26A]" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Sent!</h1>
          <p className="text-slate-500 mb-8">{vendor.business_name}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 w-full space-y-4 shadow-sm mb-8">
            <div className="text-4xl font-extrabold text-slate-900">
              ${successTx.amount_usdt.toFixed(2)} <span className="text-lg text-slate-400">USDT</span>
            </div>
            <div className="text-sm font-semibold text-slate-500 bg-slate-200/50 inline-block px-3 py-1 rounded-full">
              ₦{successTx.naira_equivalent.toLocaleString()}
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400 font-medium">{successTx.item_description}</p>
            </div>
          </div>

          <div className="space-y-1 mb-12">
            <p className="text-xs font-bold text-slate-400">Settled in 1.3 seconds</p>
            <p className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1 uppercase tracking-widest">
              Powered by USDT on Tron
            </p>
          </div>

          <button 
            onClick={() => router.push("/network")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 transition-all"
          >
            Done
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors mb-6">
            <ChevronLeft className="h-4 w-4" /> Back to Directory
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
              {vendor.category === 'food' ? '🍽️' : vendor.category === 'print' ? '🖨️' : '🏪'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold flex items-center gap-1.5">
                {vendor.business_name}
                {vendor.is_verified && <CheckCircle2 className="h-4 w-4 text-[#00D26A]" />}
              </h1>
              <p className="text-xs text-slate-400">{network?.campus} Network</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6 flex-1">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (NGN)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</div>
              <input 
                type="number" value={amountNgn} onChange={e => setAmountNgn(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-4 text-2xl font-bold text-white outline-none focus:border-[#00D26A]/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDownUp className="h-4 w-4 text-slate-600" />
          </div>

          <div className="bg-[#00D26A]/10 border border-[#00D26A]/20 rounded-2xl p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00D26A]/70 mb-1">You will pay in crypto</div>
            <div className="text-3xl font-extrabold text-[#00D26A]">${usdtEquivalent} <span className="text-sm font-bold text-[#00D26A]/70">USDT</span></div>
            <div className="text-[10px] text-slate-500 mt-2 font-medium">Rate: ₦{NGN_RATE} / $1</div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What is this for?</label>
            <input 
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Jollof rice + water"
              maxLength={40}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-slate-600 transition-colors"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <Info className="h-4 w-4 shrink-0 text-slate-500" />
            <p>Zero bank transfers. The vendor receives USDT instantly.</p>
          </div>

          <button 
            onClick={handlePay}
            disabled={isPaying || parseFloat(usdtEquivalent) <= 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 hover:brightness-110 font-bold py-4 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Payment"}
          </button>
        </div>

      </div>
    </main>
  );
}
