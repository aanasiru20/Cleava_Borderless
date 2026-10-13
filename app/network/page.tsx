"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Store, Users, Activity, QrCode, TrendingUp, Search } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (num: number) => 
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMOJIS: Record<string, string> = {
  food: "🍽️", print: "🖨️", bookstore: "📚", pharmacy: "💊", 
  fashion: "👗", tech: "💻", other: "🛍️"
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NetworkHomePage() {
  const router = useRouter();
  const [network, setNetwork] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/network?code=NET-ABU01");
      if (res.ok) {
        const data = await res.json();
        setNetwork(data.network);
        setVendors(data.vendors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [fetchNetwork]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Activity className="h-10 w-10 animate-spin text-[#00D26A]" />
      </main>
    );
  }

  const filteredVendors = vendors.filter(v => 
    v.business_name.toLowerCase().includes(search.toLowerCase()) || 
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50 bg-[url('/grid.svg')] bg-center">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-slate-950/90 backdrop-blur-md z-10 sticky top-0 border-b border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push("/")} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors">
              <ChevronLeft className="h-4 w-4" /> Home
            </button>
            <div className="flex items-center gap-1.5 bg-[#00D26A]/10 border border-[#00D26A]/20 px-2 py-1 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00D26A] animate-pulse" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#00D26A]">Live Network</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          {/* HERO SECTION */}
          <div className="px-5 pt-2 pb-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-[#00D26A]/10 mb-3">
                <Store className="h-5 w-5 text-[#00D26A]" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {network?.campus || "Campus Network"}
              </h1>
              <p className="text-xs text-slate-400">The first zero-cash campus economy in Nigeria</p>
            </div>

            {/* Live Stats Board */}
            <div className="bg-[#1a1a2e] border border-slate-800 rounded-[24px] p-5 shadow-2xl relative overflow-hidden mt-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 bg-[#00D26A]/10 blur-3xl rounded-full pointer-events-none" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Settled Today</div>
                  <div className="text-xl font-bold text-[#00D26A]">
                    ${formatCurrency(network?.total_pool_balance || 0)} <span className="text-xs font-normal">USDT</span>
                  </div>
                </div>
                
                <div className="space-y-1 text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Total Txns</div>
                  <div className="text-xl font-bold text-white flex items-center justify-end gap-1">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    {(network?.total_transactions || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold">{network?.total_vendors || 0} Vendors Active</span>
                </div>
                <button onClick={() => router.push("/network/vendor")} className="text-[10px] font-bold text-[#00D26A] uppercase hover:underline">
                  Vendor Login →
                </button>
              </div>
            </div>
          </div>

          {/* VENDOR DIRECTORY */}
          <div className="px-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Campus Directory
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search food, books, print..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-[#00D26A]/50 transition-colors"
              />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors min-h-[120px] overflow-hidden">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{EMOJIS[vendor.category] || "🏪"}</span>
                      <div className="flex items-center gap-1 bg-[#00D26A]/10 px-1.5 py-0.5 rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00D26A]" />
                        <span className="text-[8px] font-bold text-[#00D26A] uppercase tracking-wider">Open</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mb-1">{vendor.business_name}</h4>
                    <p className="text-[9px] text-slate-400 capitalize">{vendor.category} • {Math.floor(Math.random() * 50) + 1} sales today</p>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/network/pay/${vendor.vendor_code}`)}
                    className="w-full mt-4 flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-[#00D26A]/20 hover:text-[#00D26A] text-slate-300 font-bold py-2 text-[10px] transition-all"
                  >
                    <QrCode className="h-3 w-3" /> Pay Now
                  </button>
                </div>
              ))}
              
              {filteredVendors.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-500 text-sm">
                  No vendors found.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
