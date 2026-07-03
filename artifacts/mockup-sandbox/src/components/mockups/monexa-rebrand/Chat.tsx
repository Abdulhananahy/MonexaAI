import React, { useState } from "react";
import { ChevronLeft, Send, Sparkles, Image as ImageIcon } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Chat() {
  const [inputValue, setInputValue] = useState("");

  const suggestedPrompts = [
    "Am I on track this month?",
    "How much did I spend on food?",
    "Set a $200 budget for groceries",
    "Analyze my recent spending"
  ];

  return (
    <div className="monexa-rebrand mx-phone flex flex-col h-[100dvh] relative">
      {/* Header */}
      <header 
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{ 
          background: "rgba(251, 247, 241, 0.9)", 
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--mx-primary-soft)"
        }}
      >
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--mx-primary-soft)] transition-colors text-[var(--mx-ink)] -ml-2">
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-[var(--mx-primary-soft)] shrink-0 border-2 border-[var(--mx-bg-elevated)] relative">
            <Mascot mood="happy" size={48} className="translate-y-1 mx-anim-float" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--mx-income)] rounded-full border-2 border-[var(--mx-bg-elevated)]"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="mx-display text-xl leading-none text-[var(--mx-ink)]">Monexa</h1>
            <span className="text-[13px] text-[var(--mx-income)] font-medium flex items-center gap-1.5">
              Always online ✨
            </span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-32">
        {/* Date separator */}
        <div className="text-center text-[12px] font-semibold text-[var(--mx-ink-soft)] uppercase tracking-wider my-2">
          Today
        </div>

        {/* Assistant Message */}
        <div className="flex gap-3 max-w-[85%] mx-anim-bounce-in" style={{ animationDelay: "0.1s" }}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--mx-primary-soft)] shrink-0 mt-auto">
            <Mascot mood="waving" size={32} className="translate-y-0.5" />
          </div>
          <div 
            className="px-5 py-4 text-[15px] leading-relaxed rounded-2xl rounded-bl-none shadow-sm"
            style={{ 
              background: "var(--mx-primary-soft)", 
              color: "var(--mx-ink)",
              borderRadius: "24px 24px 24px 8px"
            }}
          >
            Hi there! 👋 I'm Momo, your financial wing-owl. What can I help you with today?
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end mx-anim-bounce-in" style={{ animationDelay: "0.2s" }}>
          <div 
            className="px-5 py-3.5 text-[15px] leading-relaxed max-w-[85%] shadow-sm"
            style={{ 
              background: "var(--mx-ink)", 
              color: "#FFFFFF",
              borderRadius: "24px 24px 8px 24px"
            }}
          >
            How much did I spend on food this month?
          </div>
        </div>

        {/* Assistant Message */}
        <div className="flex gap-3 max-w-[90%] mx-anim-bounce-in" style={{ animationDelay: "0.3s" }}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--mx-primary-soft)] shrink-0 mt-auto">
            <Mascot mood="thinking" size={32} className="translate-y-0.5" />
          </div>
          <div className="flex flex-col gap-2">
            <div 
              className="px-5 py-4 text-[15px] leading-relaxed rounded-2xl shadow-sm"
              style={{ 
                background: "var(--mx-primary-soft)", 
                color: "var(--mx-ink)",
                borderRadius: "24px 24px 24px 8px"
              }}
            >
              Let me check that for you! 🍔
              <br /><br />
              You've spent <strong>$340.50</strong> on food and dining so far this month. You're actually doing great—that's $50 less than you spent at this time last month!
            </div>
            
            {/* Rich UI in chat */}
            <div 
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{ background: "var(--mx-bg-elevated)", boxShadow: "var(--mx-shadow-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFE7E7]">
                  <span className="text-xl">🍔</span>
                </div>
                <div>
                  <div className="font-semibold text-[15px] text-[var(--mx-ink)]">Food & Dining</div>
                  <div className="text-[13px] text-[var(--mx-ink-soft)]">14 transactions</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[16px] text-[var(--mx-ink)]">$340.50</div>
                <div className="text-[12px] text-[var(--mx-income)] font-medium">↓ 12% vs last mo</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end mx-anim-bounce-in" style={{ animationDelay: "0.4s" }}>
          <div 
            className="px-5 py-3.5 text-[15px] leading-relaxed max-w-[85%] shadow-sm"
            style={{ 
              background: "var(--mx-ink)", 
              color: "#FFFFFF",
              borderRadius: "24px 24px 8px 24px"
            }}
          >
            Nice! What about coffee? ☕️
          </div>
        </div>

        {/* Assistant Message (Typing Indicator) */}
        <div className="flex gap-3 max-w-[85%] mx-anim-bounce-in" style={{ animationDelay: "0.5s" }}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--mx-primary-soft)] shrink-0 mt-auto">
            <Mascot mood="happy" size={32} className="translate-y-0.5" />
          </div>
          <div 
            className="px-5 py-4 flex items-center gap-1.5 h-12 shadow-sm"
            style={{ 
              background: "var(--mx-primary-soft)", 
              borderRadius: "24px 24px 24px 8px"
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--mx-primary)] mx-anim-pulse-ring" style={{ animation: "mx-pulse-ring 1s infinite", animationDelay: "0s" }}></div>
            <div className="w-2 h-2 rounded-full bg-[var(--mx-primary)] mx-anim-pulse-ring" style={{ animation: "mx-pulse-ring 1s infinite", animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 rounded-full bg-[var(--mx-primary)] mx-anim-pulse-ring" style={{ animation: "mx-pulse-ring 1s infinite", animationDelay: "0.4s" }}></div>
          </div>
        </div>

      </main>

      {/* Bottom Area (Fixed) */}
      <div 
        className="fixed bottom-0 w-full max-w-[400px] z-20 flex flex-col pb-safe"
        style={{ 
          background: "linear-gradient(to top, var(--mx-bg) 80%, transparent)",
        }}
      >
        {/* Suggested Prompts (Horizontal Scroll) */}
        <div className="w-full overflow-x-auto hide-scrollbar px-4 pb-3 flex gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button 
              key={i}
              className="px-4 py-2 whitespace-nowrap text-[13px] font-medium transition-transform active:scale-95"
              style={{
                background: "var(--mx-bg-elevated)",
                color: "var(--mx-primary-dark)",
                border: "1px solid var(--mx-primary-soft)",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(76, 63, 145, 0.05)"
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-6 pt-2">
          <div 
            className="flex items-end gap-2 p-1.5"
            style={{
              background: "var(--mx-bg-elevated)",
              borderRadius: "32px",
              boxShadow: "var(--mx-shadow)",
            }}
          >
            <div className="flex-1 flex items-center min-h-[48px] px-4">
              <input 
                type="text" 
                placeholder="Ask Momo anything..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-[var(--mx-ink-soft)] text-[var(--mx-ink)]"
              />
            </div>
            <button 
              className="w-[48px] h-[48px] shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: inputValue.trim() ? "var(--mx-primary)" : "var(--mx-primary-soft)",
                color: inputValue.trim() ? "#FFFFFF" : "var(--mx-primary)",
              }}
            >
              <Send size={20} className={inputValue.trim() ? "translate-x-0.5" : ""} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
