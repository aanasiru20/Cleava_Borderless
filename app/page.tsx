"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AISavingsCoach from "@/components/AISavingsCoach";
import {
  Wallet,
  QrCode,
  TrendingUp,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownToLine,
  ChevronRight,
  Plus,
  Send,
  Sparkles,
  RefreshCw,
  Bell,
  CheckCircle2,
  Copy,
  ScanLine,
  Loader2,
  TrendingDown,
  Info,
  Check,
  Globe,
  FileText,
  Sun,
  Moon,
  Users,
  Store,
  Landmark
} from "lucide-react";

type Persona = "Freelancer" | "Merchant" | "User";
type Tab = "dashboard" | "pay" | "save" | "earn" | "swap";

export default function Home() {
  const router = useRouter();
  const [currentPersona, setCurrentPersona] = useState<Persona>("User");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedToast = sessionStorage.getItem('cleva_toast');
    if (savedToast) {
      setToastMessage(savedToast);
      sessionStorage.removeItem('cleva_toast');
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetch("/api/loans")
      .then(res => res.json())
      .then(data => setActiveLoan(data?.activeLoan))
      .catch(console.error);
      
    fetch("/api/diaspora?studentId=freelancer-123")
      .then(res => res.json())
      .then(data => {
        if (data.transfers?.length > 0) {
          setDiasporaTransfers(data.transfers);
          // Auto add the first unseen transfer to balance for demo purposes
          setUsdtBalance(prev => prev + data.transfers[0].amount_usdt);
        }
      })
      .catch(console.error);
  }, []);

  const dismissDiaspora = (id: string) => {
    fetch("/api/diaspora", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transfer_id: id }) });
    setDiasporaTransfers(prev => prev.filter(t => t.id !== id));
  };
  
  const shareDiasporaLink = () => {
    navigator.clipboard.writeText("Send me my allowance instantly via Cleva Borderless — zero wire fees, arrives in seconds. Click here: cleava-borderless.vercel.app/diaspora/freelancer-123");
    alert("Diaspora allowance link copied to clipboard!");
  };

  // Accessibility State (Premium Dark Mode by Default)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Interactive Balance & Flow States
  const [usdtBalance, setUsdtBalance] = useState<number>(1240.50);
  const [nairaBalance, setNairaBalance] = useState<number>(2108850);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [invoiceAmount, setInvoiceAmount] = useState<string>("50");

  // Wealth/Save States
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);

  // Invoicing/Links States
  const [invoiceDescription, setInvoiceDescription] = useState<string>("Web Development Services");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Escrow States
  const [isEscrow, setIsEscrow] = useState<boolean>(false);
  const [clientEmail, setClientEmail] = useState<string>("");
  const [freelancerPaypalEmail, setFreelancerPaypalEmail] = useState<string>("");
  const [generatedEscrowCode, setGeneratedEscrowCode] = useState<string>("");
  const [escrows, setEscrows] = useState<any[]>([]);
  
  // Diaspora States
  const [diasporaTransfers, setDiasporaTransfers] = useState<any[]>([]);

  const NGN_RATE = 1700; // ₦1700 per USDT

  // Update default description when persona changes
  useEffect(() => {
    if (currentPersona === "Freelancer") {
      setInvoiceDescription("Web Development Services");
    } else if (currentPersona === "Merchant") {
      setInvoiceDescription("Wholesale Electronics Supply");
    } else {
      setInvoiceDescription("Campus Shared Lunch Split");
    }
    // Reset generation state on persona change
    setHasGenerated(false);
    setLinkCopied(false);
    setIsEscrow(false);
    setGeneratedEscrowCode("");
    
    // Fetch escrows if Freelancer
    if (currentPersona === "Freelancer") {
      fetch("/api/escrow?freelancer_id=freelancer-123")
        .then(res => res.json())
        .then(data => setEscrows(data || []))
        .catch(console.error);
    }
  }, [currentPersona]);

  // Dynamic Header Configuration
  const getHeader = (persona: Persona) => {
    switch (persona) {
      case "Freelancer":
        return { title: "Welcome back, Dev. Aisha", subtitle: "Global Tech Talent" };
      case "Merchant":
        return { title: "Welcome back, Aliyu Electronics", subtitle: "Verified Main Market Merchant" };
      case "User":
      default:
        return { title: "Welcome back, Chidi", subtitle: "Everyday Smart Wallet" };
    }
  };

  // Quick Action Switcher
  const handleQuickAction = (actionLabel: string) => {
    if (actionLabel === "Scan to Pay" || actionLabel === "Generate POS QR") {
      setActiveTab("pay");
    } else if (actionLabel === "Create Invoice Link") {
      setActiveTab("earn");
    } else if (actionLabel === "Withdraw to Naira" || actionLabel === "Convert to Stablecoin") {
      setActiveTab("save");
    } else if (actionLabel === "View Daily Sales") {
      setActiveTab("pay");
    }
  };

  // Persona-Specific Action Configs
  const getActions = (persona: Persona) => {
    switch (persona) {
      case "Freelancer":
        return [
          { label: "Create Invoice Link", icon: Link2 },
          { label: "Withdraw to Naira", icon: ArrowDownLeft }
        ];
      case "Merchant":
        return [
          { label: "Generate POS QR", icon: QrCode },
          { label: "View Daily Sales", icon: TrendingUp }
        ];
      case "User":
      default:
        return [
          { label: "Scan to Pay", icon: QrCode },
          { label: "Convert to Stablecoin", icon: RefreshCw }
        ];
    }
  };

  // Persona-Specific Mock Transactions
  const getTransactions = (persona: Persona) => {
    switch (persona) {
      case "Freelancer":
        return [
          { id: 1, type: "in", label: "Upwork Escrow Payout", date: "Today, 2:40 PM", amount: "+$850.00 USDT", local: "₦1,445,000.00" },
          { id: 2, type: "out", label: "Withdrawal to NGN", date: "Yesterday, 10:15 AM", amount: "-$250.00 USDT", local: "₦425,000.00" },
          { id: 3, type: "in", label: "GitHub Sponsors Pay", date: "Jul 25, 2026", amount: "+$120.00 USDT", local: "₦204,000.00" }
        ];
      case "Merchant":
        return [
          { id: 1, type: "in", label: "POS QR Retail Sale", date: "Today, 3:10 PM", amount: "+$45.50 USDT", local: "₦77,350.00" },
          { id: 2, type: "in", label: "POS QR Retail Sale", date: "Today, 1:15 PM", amount: "+$120.00 USDT", local: "₦204,000.00" },
          { id: 3, type: "out", label: "Inventory Supplier Pay", date: "Yesterday, 4:45 PM", amount: "-$500.00 USDT", local: "₦850,000.00" }
        ];
      case "User":
      default:
        return [
          { id: 1, type: "out", label: "Bought Grocery (Campus Store)", date: "Today, 1:04 PM", amount: "-$12.50 USDT", local: "₦21,250.00" },
          { id: 2, type: "in", label: "Swapped NGN to USDT", date: "Yesterday, 6:00 PM", amount: "+$100.00 USDT", local: "₦170,000.00" },
          { id: 3, type: "out", label: "Sent to @kofi", date: "Jul 26, 2026", amount: "-$15.00 USDT", local: "₦25,500.00" }
        ];
    }
  };

  // QR Scan Simulation
  const startQrScanSimulation = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
    }, 1500);
  };

  // Dismiss scan modal and deduct balance
  const dismissScanSuccess = () => {
    setScanSuccess(false);
    setUsdtBalance((prev) => parseFloat((prev - 15.00).toFixed(2)));
    setNairaBalance((prev) => Math.max(0, prev - (15.00 * NGN_RATE)));
    setActiveTab("dashboard");
  };

  // StableSave Configs depending on Persona
  const getSaveConfig = (persona: Persona) => {
    switch (persona) {
      case "Freelancer":
        return {
          aiText: "✨ AI Insight: You received a global payout yesterday. We suggest moving $400 into your Cleva USD Pot to earn a stable 3% annual reward rate.",
          ngnDeduct: 400 * NGN_RATE, // ₦680,000
          usdtAdd: 400.00,
          fromText: "NGN Wallet",
          toText: "Cleva USD Pot",
          fromVal: "₦680,000.00",
          toVal: "$400.00 USDT"
        };
      case "Merchant":
        return {
          aiText: "✨ AI Insight: Your daily retail sales reached ₦120,000. Protect ₦40,000 from weekly market volatility by auto-converting it to USDT right now.",
          ngnDeduct: 40000,
          usdtAdd: parseFloat((40000 / NGN_RATE).toFixed(2)), // $23.53
          fromText: "Naira Merchant Till",
          toText: "USDT Treasury Wallet",
          fromVal: "₦40,000.00",
          toVal: "$23.53 USDT"
        };
      case "User":
      default:
        return {
          aiText: "✨ AI Insight: You spent less than usual this weekend! We recommend locking ₦5,000 into StableSave to maintain your purchasing power.",
          ngnDeduct: 5000,
          usdtAdd: parseFloat((5000 / NGN_RATE).toFixed(2)), // $2.94
          fromText: "NGN Personal Pocket",
          toText: "Everyday StableSave Pot",
          fromVal: "₦5,000.00",
          toVal: "$2.94 USDT"
        };
    }
  };

  const activeSave = getSaveConfig(currentPersona);

  // StableSave Auto-Save execution
  const executeAutoSave = () => {
    setIsSwapping(true);
    setSwapSuccess(false);
    setTimeout(() => {
      setIsSwapping(false);
      setNairaBalance((prev) => Math.max(0, prev - activeSave.ngnDeduct));
      setUsdtBalance((prev) => parseFloat((prev + activeSave.usdtAdd).toFixed(2)));
      setSwapSuccess(true);
      setTimeout(() => setSwapSuccess(false), 3000);
    }, 1000);
  };

  // Generate Secure Link Simulation
  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setLinkCopied(false);
    
    if (isEscrow) {
      try {
        const res = await fetch("/api/escrow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freelancer_id: "freelancer-123", // mock ID
            client_email: clientEmail,
            amount_usdt: invoiceAmount,
    job_description: invoiceDescription,
    freelancer_paypal_email: freelancerPaypalEmail || null,
  }),
        });
        const data = await res.json();
        if (data.escrow_code) {
          setGeneratedEscrowCode(data.escrow_code);
          // Refresh list
          const listRes = await fetch("/api/escrow?freelancer_id=freelancer-123");
          const listData = await listRes.json();
          setEscrows(listData || []);
        }
      } catch (error) {
        console.error("Error creating escrow:", error);
      }
    } else {
      setGeneratedEscrowCode("");
    }

    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 1000);
  };

  const handleCopyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const header = getHeader(currentPersona);
  const actions = getActions(currentPersona);
  const transactions = getTransactions(currentPersona);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[9999] bg-[#16a34a] text-white p-4 rounded-xl shadow-lg font-medium text-center animate-fadeIn max-w-md mx-auto">
          {toastMessage}
        </div>
      )}

      {/* Mobile Device Frame Container (Dynamic Theme Color classes) */}
      <div
        className={`relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border shadow-2xl ring-1 ring-slate-800/50 transition-all duration-300 ${
          isDarkMode
            ? "border-slate-800 bg-slate-950 text-white"
            : "border-slate-200 bg-slate-50 text-slate-900"
        }`}
      >
        {/* Full Screen Green Modal Overlay on Transaction Success */}
        {scanSuccess && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950/95 px-6 text-center animate-fadeIn backdrop-blur-md">
            <div className="space-y-6 max-w-xs">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Transaction Successful!</h3>
                <p className="text-sm text-emerald-300">
                  $15.00 USDT Transferred.
                </p>
              </div>
              <button
                onClick={dismissScanSuccess}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-6 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Dismiss & Return
              </button>
            </div>
          </div>
        )}

        {/* Sleek Top Bar (Persona Switcher + Theme Toggle) */}
        <div
          className={`z-10 px-6 pt-8 pb-4 backdrop-blur-md transition-colors ${
            isDarkMode ? "bg-slate-950/80" : "bg-slate-50/80"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-xs font-semibold tracking-widest uppercase transition-colors ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Cleva Borderless
            </span>
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-1.5 rounded-lg border transition-all duration-300 active:scale-95 ${
                  isDarkMode
                    ? "border-slate-800 bg-slate-900 text-amber-400 hover:text-amber-300"
                    : "border-slate-200 bg-slate-200 text-indigo-900 hover:bg-slate-300"
                }`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>

              <button
                className={`relative p-1 transition-colors ${
                  isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-[#00D26A]" />
              </button>
              <div className="h-2 w-2 rounded-full bg-[#00D26A] animate-pulse" />
            </div>
          </div>

          {/* Persona Switcher Pill */}
          <div
            className={`flex rounded-full p-1 border transition-colors ${
              isDarkMode ? "bg-slate-900 border-slate-800/80" : "bg-slate-200/60 border-slate-300"
            }`}
          >
            {(["Freelancer", "Merchant", "User"] as Persona[]).map((persona) => {
              const isActive = currentPersona === persona;
              return (
                <button
                  key={persona}
                  onClick={() => setCurrentPersona(persona)}
                  className={`flex-1 rounded-full py-2 text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#00D26A] to-[#009393] text-white shadow-lg shadow-[#00D26A]/10 font-semibold"
                      : isDarkMode
                      ? "text-slate-400 hover:text-white hover:bg-slate-800/40"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/40"
                  }`}
                >
                  {persona}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Dynamic Header */}
              <div className="space-y-1">
                <h1
                  className={`text-xl font-bold tracking-tight transition-colors ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {header.title}
                </h1>
                <p
                  className={`text-xs flex items-center gap-1.5 transition-colors ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#009393]" />
                  {header.subtitle}
                </p>
              </div>

              {/* Loan Health Indicator */}
              {activeLoan && (
                <div onClick={() => router.push("/loans")} className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex justify-between items-center cursor-pointer hover:bg-amber-500/20 transition-colors animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500">Loan due in {Math.ceil((new Date(activeLoan.due_at).getTime() - Date.now()) / 86400000)} days</p>
                      <p className="text-[9px] text-amber-500/80">${activeLoan.total_repayable.toFixed(2)} USDT</p>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-amber-500 bg-amber-500/20 px-2 py-1 rounded-lg">
                    Repay Now →
                  </div>
                </div>
              )}

              {/* Diaspora Transfers Banner */}
              {diasporaTransfers.map((t) => (
                <div key={t.id} className="bg-[#00D26A]/10 border-l-4 border-[#00D26A] rounded-r-2xl p-4 flex flex-col gap-2 relative">
                  <button onClick={() => dismissDiaspora(t.id)} className="absolute top-2 right-3 text-[#00D26A] font-bold text-lg hover:text-white transition-colors">×</button>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <h3 className="font-bold text-[#00D26A]">Allowance Received!</h3>
                  </div>
                  <p className="text-xs font-semibold text-white">${t.amount_usdt.toFixed(2)} USDT from {t.sender_name} ({t.sender_country})</p>
                  {t.personal_message && <p className="text-xs text-slate-300 italic">"{t.personal_message}"</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Arrived just now · Zero fees</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => dismissDiaspora(t.id)} className="text-[10px] font-bold bg-[#00D26A] text-slate-900 px-4 py-2 rounded-xl">View Receipt</button>
                    <button onClick={() => dismissDiaspora(t.id)} className="text-[10px] font-bold bg-slate-800 text-white px-4 py-2 rounded-xl border border-slate-700">Save to Vault</button>
                  </div>
                </div>
              ))}

              {/* Unified Balance Card */}
              <div
                className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl transition-all ${
                  isDarkMode
                    ? "bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 border-slate-800 text-white"
                    : "bg-gradient-to-br from-teal-50 via-slate-100 to-slate-200 border-slate-200 text-slate-900"
                }`}
              >
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-[#00D26A]/10 to-[#009393]/10 rounded-bl-full filter blur-xl" />
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Total Balance
                    </span>
                    <button 
                      onClick={() => setActiveTab("swap")}
                      className="relative z-10 inline-flex items-center gap-1 text-[10px] font-medium bg-[#00D26A]/10 text-[#00D26A] hover:bg-[#00D26A]/20 px-2.5 py-0.5 rounded-full transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Live Swap
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold tracking-tight flex items-baseline gap-1">
                      ${usdtBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-semibold text-[#009393]">USDT</span>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      ₦{nairaBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Action Buttons inside Balance Area */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {actions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(action.label)}
                          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all active:scale-[0.98] ${
                            isDarkMode
                              ? "bg-slate-900/60 hover:bg-slate-900 text-white border-slate-800"
                              : "bg-slate-200/80 hover:bg-slate-200 text-slate-800 border-slate-300"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 text-[#00D26A]" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Money Button */}
                  <button
                    onClick={() => router.push("/add-money")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] hover:brightness-110 text-white text-xs font-bold py-2.5 transition-all active:scale-[0.98] shadow-md shadow-[#16a34a]/20"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                    + Add Money
                  </button>
                </div>
              </div>
              
              {/* Share Diaspora Link Button */}
              <button 
                onClick={shareDiasporaLink}
                className="w-full flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-2xl p-4 transition-all hover:bg-purple-900/60 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Globe className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Share Allowance Link</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Receive USDT instantly from abroad</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Copy className="h-4 w-4 text-slate-300" />
                </div>
              </button>

              {/* Dynamic Transaction Activity Feed */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-xs font-bold uppercase tracking-widest ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Recent Activity
                  </h3>
                  <button className="text-xs font-medium text-[#00D26A] hover:underline flex items-center gap-0.5">
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between rounded-xl p-3 border transition-colors ${
                        isDarkMode
                          ? "bg-slate-900/40 hover:bg-slate-900/60 border-slate-900"
                          : "bg-white hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            tx.type === "in"
                              ? "bg-[#00D26A]/10 text-[#00D26A]"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {tx.type === "in" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                        </div>
                        <div>
                          <div
                            className={`text-xs font-semibold ${
                              isDarkMode ? "text-white" : "text-slate-950"
                            }`}
                          >
                            {tx.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{tx.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold ${tx.type === "in" ? "text-[#00D26A]" : "text-red-400"}`}>
                          {tx.amount}
                        </div>
                        <div className="text-[9px] text-slate-500">{tx.local}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Transactions Section (Freelancer Only) */}
              {currentPersona === "Freelancer" && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Active Escrows
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {escrows.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">No active escrow jobs.</div>
                    ) : (
                      escrows.map((escrow) => (
                        <div key={escrow.id} className={`rounded-xl p-3 border ${isDarkMode ? "bg-slate-900/40 border-slate-900" : "bg-white border-slate-200"}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                                {escrow.job_description}
                              </div>
                              <div className="text-[10px] text-slate-500">Client: {escrow.client_email || "N/A"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-[#00D26A]">${escrow.amount_usdt.toFixed(2)} USDT</div>
                              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase inline-block ${
                                escrow.status === "funded" ? "bg-amber-500/10 text-amber-500" :
                                escrow.status === "delivered" ? "bg-blue-500/10 text-blue-500" :
                                "bg-emerald-500/10 text-emerald-500"
                              }`}>
                                {escrow.status}
                              </div>
                            </div>
                          </div>
                          
                          {/* Deliver Button */}
                          {escrow.status === "funded" && (
                            <button
                              onClick={async () => {
                                await fetch(`/api/escrow/${escrow.escrow_code}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "delivered" }),
                                });
                                const res = await fetch("/api/escrow?freelancer_id=freelancer-123");
                                const data = await res.json();
                                setEscrows(data || []);
                              }}
                              className="w-full mt-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[10px] font-bold py-1.5 transition-colors"
                            >
                              Mark as Delivered
                            </button>
                          )}
                          
                          <div className="mt-2 text-[9px] text-slate-500 truncate">
                            Link: <a href={`/escrow/${escrow.escrow_code}`} target="_blank" rel="noreferrer" className="text-[#00D26A] hover:underline">/escrow/{escrow.escrow_code}</a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pay/Accept View */}
          {activeTab === "pay" && (
            <div className="h-full flex flex-col justify-between py-4 space-y-6">
              <div className="text-center space-y-1">
                <h2
                  className={`text-xl font-bold transition-colors ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {currentPersona === "Merchant" ? "Accept POS Payments" : "Scan to Pay"}
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {currentPersona === "Merchant"
                    ? "Let customers scan to transfer USDT instantly"
                    : "Scan any vendor QR code to transfer stablecoins"}
                </p>
              </div>

              {/* QR Screen Simulation Area */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto">
                {currentPersona === "Merchant" ? (
                  /* Merchant static QR Display */
                  <div className="flex flex-col items-center space-y-4">
                    <div
                      className={`relative p-6 rounded-3xl border shadow-xl transition-all ${
                        isDarkMode ? "bg-white border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="h-48 w-48 flex items-center justify-center bg-slate-100 text-slate-900 border-2 border-[#009393] rounded-2xl relative overflow-hidden">
                        {/* Simulated QR block code */}
                        <div className="grid grid-cols-5 gap-2 p-4 w-full h-full opacity-90">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-sm ${
                                (i * 7 + 13) % 5 === 0 || (i * 3 + 2) % 4 === 0
                                  ? "bg-slate-950"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-slate-950 p-2 rounded-xl border border-[#00D26A] text-[#00D26A]">
                            <QrCode className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs border px-3 py-1 rounded-full font-medium transition-all ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-slate-200 border-slate-300 text-slate-600"
                      }`}
                    >
                      Merchant ID: <strong className={isDarkMode ? "text-white" : "text-slate-800"}>aliyu.cleva</strong>
                    </span>
                  </div>
                ) : (
                  /* User/Freelancer camera scanning view */
                  <div
                    className={`relative w-64 h-64 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                      isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-300 bg-slate-200/40"
                    }`}
                  >
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2 z-10 text-[#00D26A]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs font-semibold">Scanning QR code...</span>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col items-center gap-2 z-10 ${
                          isDarkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        <ScanLine className="h-10 w-10 animate-pulse text-[#00D26A]" />
                        <span className="text-[11px]">Align QR in viewfinder</span>
                      </div>
                    )}
                    {/* Simulated laser line */}
                    {!isScanning && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00D26A] animate-scan shadow-lg shadow-[#00D26A]/50" />
                    )}
                  </div>
                )}
              </div>

              {/* Simulation Trigger Button */}
              <div className="pt-4">
                <button
                  onClick={startQrScanSimulation}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] disabled:opacity-50 text-slate-950 font-bold py-3.5 px-6 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing payment...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      {currentPersona === "Merchant" ? "Simulate Customer Payment" : "Simulate Scan Success ($15.00)"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* StableSave (TrendingUp) View */}
          {activeTab === "save" && (
            <div className="h-full flex flex-col justify-between py-4 space-y-4">
              {/* Header Info */}
              <div className="text-center space-y-1">
                <h2
                  className={`text-xl font-bold flex items-center justify-center gap-1.5 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  <TrendingUp className="h-5 w-5 text-[#00D26A]" />
                  Cleva StableSave
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Lock stable value & secure your purchasing power
                </p>
              </div>

              {/* 1. Local Inflation Tracker Widget */}
              <div
                className={`rounded-2xl border p-4 space-y-2 transition-all ${
                  isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-200/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Naira Purchasing Power
                  </span>
                  <span className="text-[9px] font-bold text-[#009393] bg-[#009393]/10 border border-[#009393]/20 px-2 py-0.5 rounded-full">
                    Real-Time Inflation Protect: Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="text-xs text-slate-500">Weekly Inflation Decline</div>
                    <div className="text-sm font-bold text-red-400">-4.2% (Local Fiat)</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Target Swap Suggested</div>
                    <div className="text-sm font-bold text-[#00D26A]">Beat inflation by 18% APY</div>
                  </div>
                </div>
              </div>

              {/* 2. AI Smart Suggestion Card */}
              <div
                className={`relative overflow-hidden rounded-2xl p-5 border shadow-xl space-y-3 transition-all ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-900/30 via-slate-950 to-slate-950 border-purple-500/20 text-slate-200"
                    : "bg-gradient-to-r from-purple-100 via-slate-100 to-slate-100 border-purple-200 text-slate-800"
                }`}
              >
                <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/10 rounded-bl-full filter blur-lg" />
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      isDarkMode ? "text-purple-300" : "text-purple-700"
                    }`}
                  >
                    Cleva AI Brain SUGGESTION
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {activeSave.aiText}
                </p>
              </div>

              {/* 3. The 1-Click Swap Component */}
              <div
                className={`border p-4 rounded-2xl space-y-3 transition-all ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-200/30 border-slate-200"
                }`}
              >
                <div
                  className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Swap Preview
                </div>
                <div
                  className={`flex justify-between items-center p-3 rounded-xl border ${
                    isDarkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"
                  }`}
                >
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">From ({activeSave.fromText})</span>
                    <span className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-slate-855"}`}>
                      {activeSave.fromVal}
                    </span>
                  </div>
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase">To ({activeSave.toText})</span>
                    <span className="text-xs font-semibold text-[#00D26A]">{activeSave.toVal}</span>
                  </div>
                </div>

                {/* Swap Success Toast inside screen layout */}
                {swapSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs font-semibold text-emerald-500 animate-fadeIn justify-center">
                    <Check className="h-4 w-4" /> Assets Successfully Secured in Stablecoin!
                  </div>
                )}

                <button
                  onClick={executeAutoSave}
                  disabled={isSwapping}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-3 px-4 text-xs transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-[#00D26A]/10"
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Swapping NGN to USDT...
                    </>
                  ) : (
                    "Approve AI Auto-Save Recommendation"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Invoicing / Links (Link2) View */}
          {activeTab === "earn" && (
            <div className="h-full flex flex-col justify-between py-4 space-y-4">
              {/* Dynamic Header Wrapper */}
              <div className="text-center space-y-1">
                <h2
                  className={`text-xl font-bold flex items-center justify-center gap-1.5 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  <Link2 className="h-5 w-5 text-[#009393]" />
                  {currentPersona === "Merchant" ? "Bulk B2B Invoice Link" : "Global PayLink Generator"}
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {currentPersona === "Merchant"
                    ? "Generate formal business invoices for suppliers"
                    : "Create customizable links to receive global payments"}
                </p>
              </div>

              {/* Interactive Input Fields */}
              <div
                className={`border p-5 rounded-2xl space-y-4 transition-all ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-250/20 border-slate-200"
                }`}
              >
                {/* Amount input */}
                <div className="space-y-1.5">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Requested Amount
                  </label>
                  <div
                    className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 transition-all ${
                      isDarkMode ? "border-slate-850 bg-slate-950" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="text-md font-bold text-[#009393]">$</span>
                    <input
                      type="number"
                      value={invoiceAmount}
                      onChange={(e) => {
                        setInvoiceAmount(e.target.value);
                        setHasGenerated(false); // Reset URL lock
                      }}
                      className={`bg-transparent text-sm font-semibold outline-none w-full ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                      placeholder="0.00"
                    />
                    <span className="text-xs font-semibold text-slate-500">USDT</span>
                  </div>
                </div>

                {/* Escrow Toggle */}
                {currentPersona === "Freelancer" && (
                  <div className="flex items-center justify-between border-b border-dashed border-slate-700/50 pb-4 pt-2">
                    <div>
                      <div className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Escrow Payment</div>
                      <div className="text-[10px] text-slate-500">Hold funds until work is delivered</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isEscrow}
                        onChange={(e) => {
                          setIsEscrow(e.target.checked);
                          setHasGenerated(false);
                        }}
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D26A]"></div>
                    </label>
                  </div>
                )}
                
                {/* Client Email Input (only if Escrow) */}
                {isEscrow && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Client Email
                    </label>
                    <div
                      className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 transition-all ${
                        isDarkMode ? "border-slate-850 bg-slate-950" : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => {
                          setClientEmail(e.target.value);
                          setHasGenerated(false);
                        }}
                        className={`bg-transparent text-sm font-medium outline-none w-full ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                        placeholder="client@example.com"
                      />
                    </div>
                  </div>
                )}

                {isEscrow && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Your PayPal email (optional — for PayPal payouts)
                    </label>
                    <input
                      type="email"
                      value={freelancerPaypalEmail}
                      onChange={(e) => { setFreelancerPaypalEmail(e.target.value); setHasGenerated(false); }}
                      className={`w-full border rounded-xl px-3.5 py-2.5 bg-transparent text-sm font-medium outline-none ${isDarkMode ? "border-slate-850 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"}`}
                      placeholder="you@paypal.com"
                    />
                  </div>
                )}

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Description / Project Name
                  </label>
                  <div
                    className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 transition-all ${
                      isDarkMode ? "border-slate-850 bg-slate-950" : "border-slate-200 bg-white"
                    }`}
                  >
                    <FileText className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={invoiceDescription}
                      onChange={(e) => {
                        setInvoiceDescription(e.target.value);
                        setHasGenerated(false);
                      }}
                      className={`bg-transparent text-sm font-medium outline-none w-full ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                      placeholder="e.g. Services rendered"
                    />
                  </div>
                </div>
              </div>

              {/* Live Link Preview Box */}
              <div
                className={`rounded-2xl border-2 border-dashed p-4 space-y-3 transition-all ${
                  isDarkMode ? "border-slate-800 bg-slate-900/10" : "border-slate-300 bg-slate-200/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    <Globe className="h-3 w-3" /> Live URL Preview
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold italic">updates live</span>
                </div>

                <div
                  className={`border p-3.5 rounded-xl truncate text-xs text-[#00D26A] font-medium tracking-tight ${
                    isDarkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"
                  }`}
                >
                  {hasGenerated && isEscrow 
                    ? `cleava-borderless.vercel.app/escrow/${generatedEscrowCode}` 
                    : `cleava-borderless.io/pay/user101/${invoiceAmount || "0"}`}
                </div>
              </div>

              {/* Action Buttons & Interactions */}
              <div className="space-y-3">
                {!hasGenerated ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-3.5 px-4 text-xs transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating Secure Link...
                      </>
                    ) : (
                      "Generate Secure Cleva Link"
                    )}
                  </button>
                ) : (
                  <div className="space-y-3 animate-fadeIn">
                    <button
                      onClick={handleCopyLink}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl font-bold py-3.5 px-4 text-xs transition-all active:scale-[0.98] ${
                        linkCopied
                          ? "bg-emerald-500 text-slate-950"
                          : isDarkMode
                          ? "bg-slate-900 text-white border border-slate-800 hover:bg-slate-850"
                          : "bg-slate-200 text-slate-850 border border-slate-300 hover:bg-slate-250"
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4" /> Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-[#009393]" /> Copy Secure PayLink
                        </>
                      )}
                    </button>
                    {linkCopied && (
                      <p className="text-[10px] text-center text-emerald-500 font-semibold animate-pulse">
                        Link ready to share with global buyers!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Swap / Balances View */}
          {activeTab === "swap" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2
                    className={`text-xl font-bold transition-colors ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Your Balances
                  </h2>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Manage your funds across multiple currencies
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Naira Balance */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-5 border shadow-md transition-all hover:scale-[1.01] ${
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-800 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-green-500/10 rounded-bl-full filter blur-lg" />
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-500">₦</span>
                      Naira (NGN)
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    ₦{nairaBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Dollar Balance */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-5 border shadow-md transition-all hover:scale-[1.01] ${
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-800 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/10 rounded-bl-full filter blur-lg" />
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">$</span>
                      US Dollar (USD)
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    ${usdtBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Stable Coin Balance */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-5 border shadow-md transition-all hover:scale-[1.01] ${
                    isDarkMode
                      ? "bg-gradient-to-br from-[#00D26A]/10 to-[#009393]/10 border-[#00D26A]/30 text-white"
                      : "bg-gradient-to-br from-[#00D26A]/5 to-[#009393]/5 border-[#00D26A]/20 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00D26A]/20 text-[#00D26A]">₮</span>
                      Tether (USDT)
                    </span>
                    <span className="text-[9px] font-bold text-[#00D26A] bg-[#00D26A]/10 border border-[#00D26A]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Stable Coin
                    </span>
                  </div>
                  <div className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {usdtBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-[#009393]">USDT</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Bottom Navigation */}
        <div
          className={`z-10 border-t px-4 pt-3 pb-6 backdrop-blur-md transition-all ${
            isDarkMode ? "border-slate-900 bg-slate-950/90" : "border-slate-200 bg-slate-100/90"
          }`}
        >
          <nav className="flex justify-around items-center">
            {/* Dashboard Tab */}
            <button onClick={() => setActiveTab("dashboard")} className="flex flex-col items-center gap-1 group">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  activeTab === "dashboard" ? "bg-[#00D26A]/10 text-[#00D26A]" : "text-slate-500"
                }`}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? isDarkMode
                      ? "text-white font-semibold"
                      : "text-slate-900 font-semibold"
                    : "text-slate-500"
                }`}
              >
                Dashboard
              </span>
            </button>

            {/* Loans Tab */}
            <button onClick={() => router.push("/loans")} className="flex flex-col items-center gap-1 group">
              <div className="p-2 rounded-xl transition-all duration-300 text-slate-500 group-hover:text-[#00D26A] group-hover:bg-[#00D26A]/10">
                <Landmark className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-[#00D26A] transition-colors">
                Loans
              </span>
            </button>

            {/* Wealth / Save Tab */}
            <button onClick={() => router.push("/stablesave")} className="flex flex-col items-center gap-1 group">
              <div className="p-2 rounded-xl transition-all duration-300 text-slate-500 group-hover:text-[#00D26A] group-hover:bg-[#00D26A]/10">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-[#00D26A] transition-colors">
                StableSave
              </span>
            </button>

            {/* Campus Network Tab */}
            <button onClick={() => router.push("/network")} className="flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00D26A] ring-2 ring-slate-950" />
              <div className="p-2 rounded-xl transition-all duration-300 text-slate-500 group-hover:text-[#00D26A] group-hover:bg-[#00D26A]/10">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-[#00D26A] transition-colors">
                Network
              </span>
            </button>

            {/* Ajo Circles — navigates to /ajo */}
            <button onClick={() => router.push("/ajo")} className="flex flex-col items-center gap-1 group">
              <div className="p-2 rounded-xl transition-all duration-300 text-slate-500 group-hover:text-[#00D26A] group-hover:bg-[#00D26A]/10">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-[#00D26A] transition-colors">
                Ajo
              </span>
            </button>
          </nav>
        </div>
  </div>
  <AISavingsCoach userId="freelancer-123" />
  </main>
  );
  }
