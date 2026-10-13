"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, Users, DollarSign, Calendar, Hash } from "lucide-react";

export default function CreateCirclePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    contribution_amount: "10",
    frequency: "weekly",
    max_members: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.contribution_amount) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ajo/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contribution_amount: parseFloat(form.contribution_amount),
          created_by: "freelancer-123", // mock user
          display_name: "Me",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/ajo/${data.circle.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const potSize = parseFloat(form.contribution_amount || "0") * form.max_members;
  const freqOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans antialiased">
      <div className="relative flex h-[850px] w-full max-w-md flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 text-white shadow-2xl ring-1 ring-slate-800/50">

        {/* Header */}
        <div className="px-6 pt-8 pb-5 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shrink-0">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create a Circle</h1>
          <p className="text-xs text-slate-400 mt-1">Set the rules once. Ajo handles the rest.</p>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Circle Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Circle Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='e.g. "ABU Engineering Floor 3"'
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#00D26A]/50 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Contribution Amount */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" /> Contribution per Member
            </label>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-[#00D26A]/50 transition-colors">
              <span className="text-[#009393] font-bold text-sm">$</span>
              <input
                type="number"
                value={form.contribution_amount}
                onChange={(e) => setForm({ ...form, contribution_amount: e.target.value })}
                className="bg-transparent text-sm font-semibold text-white outline-none flex-1"
                placeholder="10.00"
                min="1"
              />
              <span className="text-slate-500 text-xs font-semibold">USDT</span>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Contribution Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {freqOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, frequency: opt.value })}
                  className={`rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    form.frequency === opt.value
                      ? "bg-[#00D26A]/10 border-[#00D26A]/40 text-[#00D26A]"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Members Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> Max Members
              </label>
              <span className="text-base font-extrabold text-[#00D26A]">{form.max_members}</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={form.max_members}
              onChange={(e) => setForm({ ...form, max_members: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#00D26A]"
            />
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>3</span><span>20</span>
            </div>
          </div>

          {/* Pot Preview Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#00D26A]/10 to-[#009393]/10 border border-[#00D26A]/20 p-5 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00D26A]">Circle Preview</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Pot Per Round</div>
                <div className="text-xl font-extrabold text-white">${potSize.toFixed(2)}</div>
                <div className="text-[10px] text-[#009393] font-bold">USDT</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Total Rounds</div>
                <div className="text-xl font-extrabold text-white">{form.max_members}</div>
                <div className="text-[10px] text-slate-500 font-bold">{form.frequency}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 font-medium">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="px-6 py-5 border-t border-slate-900 bg-slate-950/80 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D26A] to-[#009393] text-slate-950 font-bold py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#00D26A]/20"
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating...</> : "Create Circle & Get Invite Code"}
          </button>
        </div>
      </div>
    </main>
  );
}
