"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Store, Loader2, CheckCircle2 } from "lucide-react";

function JoinNetworkPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("food");
  const [networkCode, setNetworkCode] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !networkCode) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/network/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-new-vendor", // Mock auth
          network_code: networkCode,
          business_name: businessName,
          category
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/network/vendor");
        }, 1500);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="text-center space-y-4 animate-fadeIn">
          <CheckCircle2 className="h-16 w-16 text-[#00D26A] mx-auto" />
          <h2 className="text-2xl font-bold text-white">Vendor Created!</h2>
          <p className="text-slate-400">Redirecting to your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
        
        <div className="px-6 pt-8 pb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors mb-6">
            <ChevronLeft className="h-4 w-4" /> Cancel
          </button>
          
          <div className="h-12 w-12 rounded-full bg-[#00D26A]/10 flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-[#00D26A]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Join Campus Network</h1>
          <p className="text-xs text-slate-400 mt-1">Start accepting zero-fee stablecoin payments from students today.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Network Invite Code</label>
            <input 
              type="text" value={networkCode} onChange={e => setNetworkCode(e.target.value)}
              placeholder="e.g. NET-ABU01" required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-[#00D26A]/50 transition-colors uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Business Name</label>
            <input 
              type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Iya Basira Foods" required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-[#00D26A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</label>
            <div className="relative">
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-[#00D26A]/50 transition-colors appearance-none"
              >
                <option value="food">🍽️ Food & Drinks</option>
                <option value="print">🖨️ Printing & Copying</option>
                <option value="bookstore">📚 Bookstore & Stationery</option>
                <option value="pharmacy">💊 Pharmacy & Health</option>
                <option value="tech">💻 Tech & Repairs</option>
                <option value="fashion">👗 Fashion & Wears</option>
                <option value="other">🛍️ Other Services</option>
              </select>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <button 
            onClick={handleSubmit}
            disabled={loading || !businessName || !networkCode}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#00D26A] text-slate-950 hover:bg-emerald-400 font-bold py-4 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Join Network"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function JoinNetworkPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-900 p-4"><Loader2 className="h-10 w-10 animate-spin text-[#00D26A]" /></main>}>
      <JoinNetworkPageContent />
    </Suspense>
  );
}
