import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, MessageCircle, ArrowRight } from 'lucide-react';
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";
import { BottomNav } from "./_shared/BottomNav";

const TRANSACTIONS = [
  { id: 1, name: "Salary", category: "Income", emoji: "💼", amount: 3100.00, type: "income", date: "Today, 9:00 AM" },
  { id: 2, name: "Whole Foods", category: "Groceries", emoji: "🛒", amount: -120.40, type: "expense", date: "Yesterday, 6:30 PM" },
  { id: 3, name: "Uber", category: "Transport", emoji: "🚗", amount: -18.20, type: "expense", date: "Yesterday, 2:15 PM" },
  { id: 4, name: "Blue Bottle Coffee", category: "Food & Drink", emoji: "☕️", amount: -6.50, type: "expense", date: "Oct 24, 8:45 AM" },
  { id: 5, name: "Netflix", category: "Entertainment", emoji: "🍿", amount: -15.99, type: "expense", date: "Oct 23, 10:00 AM" },
];

export function Home() {
  return (
    <div className="monexa-rebrand mx-phone flex flex-col h-full bg-[var(--mx-bg)] pb-[76px]">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--mx-primary-soft)] border-2 border-[var(--mx-primary)] flex items-center justify-center shrink-0">
            <Mascot mood="happy" size={56} className="mt-2" />
          </div>
          <div>
            <p className="text-[var(--mx-ink-soft)] text-sm font-medium">Good morning,</p>
            <h1 className="mx-display text-2xl font-bold text-[var(--mx-ink)] leading-tight">Hi Alex 👋</h1>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-[var(--mx-bg-elevated)] flex items-center justify-center shadow-[var(--mx-shadow-soft)] relative">
          <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--mx-expense)] rounded-full border-2 border-[var(--mx-bg-elevated)]"></span>
          <span className="text-xl">🔔</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 flex flex-col gap-6 overflow-y-auto pb-40">
        
        {/* Balance Card */}
        <div 
          className="relative p-6 text-white overflow-hidden mx-anim-float"
          style={{ 
            background: "linear-gradient(135deg, var(--mx-primary) 0%, var(--mx-primary-dark) 100%)",
            borderRadius: "var(--mx-card-radius)",
            boxShadow: "var(--mx-shadow)"
          }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-white/80 font-medium flex items-center gap-2">
              Total Balance
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">USD</span>
            </p>
            <h2 className="mx-display text-4xl font-bold tracking-tight">
              $4,285<span className="text-white/70 text-2xl">.60</span>
            </h2>
          </div>

          {/* Income & Expense Summary */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Income</p>
                <p className="font-bold text-white">$6,200.00</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Expenses</p>
                <p className="font-bold text-white">$1,914.40</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)]">Recent Activity</h3>
            <button className="text-[var(--mx-primary)] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
              See All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {TRANSACTIONS.map((tx) => (
              <div 
                key={tx.id} 
                className="bg-[var(--mx-bg-elevated)] p-4 flex items-center gap-4 transition-transform active:scale-95"
                style={{ 
                  borderRadius: "calc(var(--mx-card-radius) * 0.7)",
                  boxShadow: "var(--mx-shadow-soft)"
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ 
                    backgroundColor: tx.type === 'income' ? 'var(--mx-income-soft)' : 'var(--mx-primary-soft)' 
                  }}
                >
                  {tx.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--mx-ink)] truncate">{tx.name}</p>
                  <p className="text-[var(--mx-ink-soft)] text-xs truncate mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p 
                    className="font-bold text-base"
                    style={{ 
                      color: tx.type === 'income' ? 'var(--mx-income)' : 'var(--mx-ink)' 
                    }}
                  >
                    {tx.type === 'income' ? '+' : ''}
                    ${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Chat CTA (Pinned above bottom nav) */}
      <div 
        className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full max-w-[400px] px-6 pt-6 pb-4 bg-gradient-to-t from-[var(--mx-bg)] via-[var(--mx-bg)] to-transparent pointer-events-none"
        style={{ zIndex: 45 }}
      >
        <button 
          className="w-full h-14 text-white font-bold rounded-full flex items-center justify-center gap-3 shadow-[var(--mx-shadow)] transition-transform active:scale-95 pointer-events-auto overflow-hidden relative group"
          style={{ 
            background: "linear-gradient(135deg, var(--mx-primary) 0%, var(--mx-primary-dark) 100%)",
            borderRadius: "100px" 
          }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Mascot mood="happy" size={32} />
          <span className="text-lg">Chat with Monexa ✨</span>
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
