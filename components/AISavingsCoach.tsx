"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "coach"; content: string; timestamp: Date };

const suggestions = [
  "Should I put more money in my vault?",
  "Can I afford my Ajo contribution this week?",
  "When should I repay my loan?",
  "How much have I saved this month?",
];

const greeting: Message = {
  role: "coach",
  content: "Hi, I’m Ada, your savings coach. I can help you understand your vault, spending, loan, and Ajo commitments. What’s on your mind?",
  timestamp: new Date(),
};

export default function AISavingsCoach({ userId = "freelancer-123", showCard = false }: { userId?: string; showCard?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/ai-coach/history?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((history) => {
        if (!history?.length) return;
        const past = history.reverse().flatMap((item: { user_message: string; coach_reply: string; created_at: string }) => [
          { role: "user" as const, content: item.user_message, timestamp: new Date(item.created_at) },
          { role: "coach" as const, content: item.coach_reply, timestamp: new Date(item.created_at) },
        ]);
        setMessages([greeting, ...past]);
      })
      .catch(() => undefined);
  }, [isOpen, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (value = input) => {
    const text = value.trim();
    if (!text || isLoading) return;
    setMessages((current) => [...current, { role: "user", content: text, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai-coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, userId }) });
      const data = await response.json();
      setMessages((current) => [...current, { role: "coach", content: data.reply || "I couldn’t process that right now. Please try again.", timestamp: new Date() }]);
    } catch {
      setMessages((current) => [...current, { role: "coach", content: "I’m having trouble connecting. Please try again in a moment.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      {showCard && (
        <section className="mx-6 my-4 rounded-2xl border border-emerald-500/30 border-l-4 border-l-emerald-500 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400"><Sparkles className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-white">Ask Ada — Your AI Savings Coach</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">“Should I put more in my vault this week?” or “Can I afford my Ajo contribution?”</p>
              <p className="mt-2 text-xs text-slate-500">Ada uses your Cleva financial activity to give practical guidance.</p>
              <button type="button" onClick={() => setIsOpen(true)} className="mt-3 w-full rounded-xl border border-emerald-500/50 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10">Chat with Ada</button>
            </div>
          </div>
        </section>
      )}

      {!isOpen && !showCard && <button type="button" aria-label="Open Ada savings coach" onClick={() => setIsOpen(true)} className="absolute bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-400 active:scale-95"><Bot className="size-6" /></button>}

      {isOpen && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-950 text-white md:inset-auto md:bottom-4 md:right-4 md:h-[min(680px,calc(100vh-2rem))] md:w-[calc(100%-2rem)] md:max-w-[358px] md:overflow-hidden md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl">
          <header className="flex items-center gap-3 border-b border-white/10 bg-slate-900 px-4 py-3">
            <div className="rounded-full bg-emerald-500 p-2 text-slate-950"><Bot className="size-5" /></div>
            <div className="flex-1"><p className="text-sm font-semibold">Ada — AI Savings Coach</p><p className="text-xs text-emerald-400">Online · Knows your finances</p></div>
            <button type="button" aria-label="Close Ada savings coach" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4"><div className="flex flex-col gap-4">
            {messages.map((message, index) => <div key={`${message.timestamp.toISOString()}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "rounded-tr-sm bg-emerald-500 text-slate-950" : "rounded-tl-sm bg-slate-900 text-slate-100"}`}>{message.content}<p className="mt-1 text-[10px] opacity-50">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div></div>)}
            {isLoading && <div className="rounded-2xl rounded-tl-sm bg-slate-900 px-4 py-3 text-sm text-emerald-300">Ada is thinking…</div>}
            <div ref={endRef} />
          </div></div>
          {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3">{suggestions.map((question) => <button type="button" key={question} onClick={() => sendMessage(question)} className="rounded-full border border-slate-700 px-3 py-1.5 text-left text-xs text-slate-300 hover:border-emerald-500/60 hover:text-white">{question}</button>)}</div>}
          <form onSubmit={submit} className="flex gap-2 border-t border-white/10 bg-slate-900 p-3"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit(event); } }} aria-label="Message Ada" placeholder="Ask Ada anything…" rows={1} className="min-h-11 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-emerald-500" /><button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message" className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" /></button></form>
          <p className="bg-slate-900 pb-3 text-center text-[10px] text-slate-500">Powered by Gemini AI · Your data stays private</p>
        </div>
      )}
    </>
  );
}

export { suggestions as ADA_SUGGESTED_QUESTIONS };
