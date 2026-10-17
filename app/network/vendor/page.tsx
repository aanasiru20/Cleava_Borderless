"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, QrCode, Download, Share2, History, ArrowDownLeft, CheckCircle2, Loader2, ArrowRightLeft } from "lucide-react";
import QRCode from "qrcode";

const formatCurrency = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} hr ago`;
};

export default function VendorDashboard() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [network, setNetwork] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const fetchData = useCallback(async () => {
    try {
      // In a real app we'd fetch securely by auth session, using mock "freelancer-123" (Mama Ngozi)
      const res = await fetch(`/api/network`);
      if (res.ok) {
        const data = await res.json();
        setNetwork(data.network);
        const myVendor = data.vendors.find((v: any) => v.user_id === "freelancer-123");
        setVendor(myVendor);
        
        // Mock fetch transactions just filtering the frontend state for speed in demo
        if (myVendor) {
           const txs = [
             { id: '1', amount_usdt: 2.50, item_description: 'Jollof rice + water', settled_at: new Date(Date.now() - 2 * 60000).toISOString() },
             { id: '2', amount_usdt: 1.20, item_description: 'Bottled water x2', settled_at: new Date(Date.now() - 15 * 60000).toISOString() },
             { id: '3', amount_usdt: 5.00, item_description: 'Lunch combo', settled_at: new Date(Date.now() - 60 * 60000).toISOString() },
           ];
           setTransactions(txs);
        }
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

  useEffect(() => {
    if (vendor && qrCanvasRef.current) {
      // The QR code contains a full link to the payment portal
      const paymentUrl = `${window.location.origin}/network/pay/${vendor.vendor_code}`;
      QRCode.toCanvas(qrCanvasRef.current, paymentUrl, {
        width: 200, margin: 2, color: { dark: '#020617', light: '#ffffff' }
      });
    }
  }, [vendor]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/network/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id })
      });
      if (res.ok) {
        const data = await res.json();
        setToast(`✅ $${data.amount.toFixed(2)} USDT claimed to your wallet!`);
        setTimeout(() => setToast(""), 4000);
        await fetchData(); // Refresh state
      }
    } catch (e) {
      console.error(e);
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D26A]" />
      </main>
    );
  }

  if (!vendor) return <div className="text-white p-8">Vendor not found. Please register.</div>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-slate-900 border-b border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => router.push("/network")} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Network
            </button>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{network.name}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner">
              {vendor.category === 'food' ? '🍽️' : '🏪'}
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg">{vendor.business_name}</h1>
              <p className="text-xs text-[#00D26A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified Vendor
              </p>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] z-50 bg-[#00D26A] text-slate-950 px-4 py-3 rounded-xl font-bold text-sm shadow-xl animate-fadeIn flex items-center gap-2">
            {toast}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-20 scrollbar-hide">
          
          {/* Earnings Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Earnings Summary</h3>
            <div className="grid grid-cols-2 gap-3 divide-x sm:grid-cols-3 divide-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1">Today</p>
                <p className="text-sm font-bold text-[#00D26A]">${formatCurrency(vendor.today_earnings)}</p>
              </div>
              <div className="pl-3">
                <p className="text-[10px] text-slate-500 uppercase mb-1">This Week</p>
                <p className="text-sm font-bold text-white">${formatCurrency(vendor.today_earnings * 5 + 45.0)}</p>
              </div>
              <div className="pl-3">
                <p className="text-[10px] text-slate-500 uppercase mb-1">All Time</p>
                <p className="text-sm font-bold text-white">${formatCurrency(vendor.total_earnings)}</p>
              </div>
            </div>
          </div>

          {/* Claim Section */}
          <div className="bg-gradient-to-br from-slate-900 to-[#00D26A]/5 border border-[#00D26A]/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ArrowDownLeft className="h-16 w-16 text-[#00D26A]" />
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              💰 Ready to Claim
            </h3>
            <p className="text-xs text-slate-400 mb-4">${formatCurrency(vendor.pending_payout)} USDT pending settlement in pool.</p>
            
            <button 
              onClick={handleClaim} disabled={claiming || vendor.pending_payout <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00D26A] text-slate-950 hover:bg-emerald-400 font-bold py-3 text-sm transition-all disabled:opacity-50"
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim to My Wallet"}
            </button>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <h3 className="text-sm font-bold text-white mb-1">My QR Code</h3>
            <p className="text-[10px] text-slate-400 mb-4">Print this and stick it on your stall. Students scan to pay instantly.</p>
            
            <div className="inline-block bg-white p-3 rounded-2xl shadow-xl mb-4">
              <canvas ref={qrCanvasRef} className="rounded-lg" />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
                <Download className="h-3 w-3" /> Download PNG
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
                <Share2 className="h-3 w-3" /> Share
              </button>
            </div>
          </div>

          {/* Transaction Feed */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
              <History className="h-4 w-4" /> Recent Payments
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No payments yet.</div>
              ) : (
                transactions.map((tx: any, i) => (
                  <div key={i} className="p-3.5 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#00D26A]/10 flex items-center justify-center">
                        <ArrowRightLeft className="h-3 w-3 text-[#00D26A]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#00D26A]">${tx.amount_usdt.toFixed(2)} USDT</p>
                        <p className="text-[10px] text-slate-400">{tx.item_description}</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500">{timeAgo(tx.settled_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
