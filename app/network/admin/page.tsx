"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, CheckCircle2, Store, Search, Copy, Check } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [network, setNetwork] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/network`);
      if (res.ok) {
        const data = await res.json();
        setNetwork(data.network);
        setVendors(data.vendors.sort((a:any, b:any) => b.total_earnings - a.total_earnings));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://localhost:3000/network/join?code=${network?.network_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="bg-slate-900 min-h-screen text-white p-8">Loading...</div>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-slate-900 border-b border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => router.push("/network")} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Home
            </button>
            <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
              Admin View
            </div>
          </div>
          <h1 className="font-extrabold text-xl">{network.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Network management and overview</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 scrollbar-hide">
          
          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Pool</div>
              <div className="text-xl font-bold text-[#00D26A]">${network.total_pool_balance.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Txns</div>
              <div className="text-xl font-bold text-white">{network.total_transactions.toLocaleString()}</div>
            </div>
          </div>

          {/* Invite Section */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Grow your network</h3>
            <p className="text-[10px] text-slate-400 mb-3">Share this code with campus vendors so they can self-onboard and receive QR codes.</p>
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 flex-1 truncate">
                Join Code: {network.network_code}
              </div>
              <button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Vendor Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <Store className="h-4 w-4" /> Active Vendors ({vendors.length})
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                  <tr>
                    <th className="p-3">Vendor Name</th>
                    <th className="p-3 text-right">Today</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vendors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1">
                          {v.business_name} {v.is_verified && <CheckCircle2 className="h-3 w-3 text-[#00D26A]" />}
                        </div>
                        <div className="text-[9px] text-slate-500 capitalize">{v.category}</div>
                      </td>
                      <td className="p-3 text-right text-[#00D26A] font-semibold">${v.today_earnings.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-300">${v.total_earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
