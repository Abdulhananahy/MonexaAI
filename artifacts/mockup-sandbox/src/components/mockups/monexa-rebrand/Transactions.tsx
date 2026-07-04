import React, { useState } from 'react';
import { ChevronLeft, Filter, Search, ChevronRight } from 'lucide-react';
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";
import { BottomNav } from "./_shared/BottomNav";

const TRANSACTIONS_DATA = [
  {
    dateGroup: "Today",
    transactions: [
      { id: 1, name: "Whole Foods Market", subcategory: "Groceries", emoji: "🛒", amount: -124.50, type: "expense", time: "14:30" },
      { id: 2, name: "Salary", subcategory: "Direct Deposit", emoji: "💼", amount: 3100.00, type: "income", time: "09:00" },
      { id: 3, name: "Starbucks", subcategory: "Coffee", emoji: "☕️", amount: -5.40, type: "expense", time: "08:15" },
    ]
  },
  {
    dateGroup: "Yesterday",
    transactions: [
      { id: 4, name: "Uber", subcategory: "Transport", emoji: "🚗", amount: -18.20, type: "expense", time: "22:15" },
      { id: 5, name: "Netflix", subcategory: "Subscription", emoji: "🍿", amount: -15.99, type: "expense", time: "10:00" },
      { id: 6, name: "Venmo - dinner", subcategory: "Transfers", emoji: "🍕", amount: -45.00, type: "expense", time: "19:30" },
    ]
  },
  {
    dateGroup: "October 24",
    transactions: [
      { id: 7, name: "Blue Bottle Coffee", subcategory: "Food & Drink", emoji: "☕️", amount: -6.50, type: "expense", time: "08:45" },
      { id: 8, name: "Freelance Client", subcategory: "Design Work", emoji: "💻", amount: 450.00, type: "income", time: "14:00" },
      { id: 9, name: "Chevron", subcategory: "Gas", emoji: "⛽", amount: -42.80, type: "expense", time: "18:20" },
      { id: 10, name: "Target", subcategory: "Home Supplies", emoji: "🎯", amount: -89.99, type: "expense", time: "13:10" },
    ]
  }
];

export function Transactions() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = TRANSACTIONS_DATA.map(group => {
    const filteredTx = group.transactions.filter(tx => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    return { ...group, transactions: filteredTx };
  }).filter(group => group.transactions.length > 0);

  return (
    <div className="monexa-rebrand mx-phone flex flex-col h-full bg-[var(--mx-bg)] overflow-hidden relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between shrink-0 bg-[var(--mx-bg)] z-10">
        <button className="w-10 h-10 rounded-full bg-[var(--mx-bg-elevated)] flex items-center justify-center shadow-[var(--mx-shadow-soft)] transition-transform active:scale-95">
          <ChevronLeft className="w-5 h-5 text-[var(--mx-ink)]" />
        </button>
        <h1 className="mx-display text-2xl font-bold text-[var(--mx-ink)]">Transactions</h1>
        <button className="w-10 h-10 rounded-full bg-[var(--mx-bg-elevated)] flex items-center justify-center shadow-[var(--mx-shadow-soft)] transition-transform active:scale-95">
          <Filter className="w-5 h-5 text-[var(--mx-ink)]" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="px-6 pb-4 shrink-0">
        <div className="relative">
          <Search className="w-5 h-5 text-[var(--mx-ink-soft)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-[var(--mx-bg-elevated)] rounded-full pl-12 pr-4 outline-none text-[var(--mx-ink)] font-medium placeholder:text-[var(--mx-ink-soft)] shadow-[var(--mx-shadow-soft)] border-2 border-transparent focus:border-[var(--mx-primary-soft)] transition-colors"
          />
        </div>
      </div>

      {/* Segmented Filter */}
      <div className="px-6 pb-6 shrink-0 flex gap-2">
        {(['all', 'income', 'expense'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm capitalize transition-all ${
              filter === tab 
                ? 'bg-[var(--mx-primary)] text-white shadow-[var(--mx-shadow-soft)]' 
                : 'bg-[var(--mx-bg-elevated)] text-[var(--mx-ink-soft)] hover:bg-[var(--mx-primary-soft)] hover:text-[var(--mx-primary-dark)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-28 flex flex-col gap-6">
        {filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-12 opacity-80">
            <Mascot mood="thinking" size={120} />
            <div className="text-center">
              <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)] mb-1">No transactions found</h3>
              <p className="text-[var(--mx-ink-soft)] text-sm">Try adjusting your search or filters.</p>
            </div>
            <button 
              onClick={() => { setFilter('all'); setSearchQuery(''); }}
              className="mt-2 text-[var(--mx-primary)] font-bold text-sm bg-[var(--mx-primary-soft)] px-4 py-2 rounded-full"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredData.map((group) => (
            <div key={group.dateGroup} className="flex flex-col gap-3">
              <h3 className="mx-display text-lg font-bold text-[var(--mx-ink-soft)] sticky top-0 bg-gradient-to-b from-[var(--mx-bg)] via-[var(--mx-bg)] to-transparent pt-1 pb-2 z-10">
                {group.dateGroup}
              </h3>
              <div className="flex flex-col gap-3">
                {group.transactions.map((tx) => (
                  <button 
                    key={tx.id} 
                    className="bg-[var(--mx-bg-elevated)] p-4 flex items-center gap-4 transition-transform active:scale-95 w-full text-left group"
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
                      <p className="font-bold text-[var(--mx-ink)] truncate text-base">{tx.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[var(--mx-ink-soft)] text-xs truncate">{tx.subcategory}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--mx-ink-soft)] opacity-50"></span>
                        <span className="text-[var(--mx-ink-soft)] text-xs shrink-0">{tx.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
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
                    <ChevronRight className="w-4 h-4 text-[var(--mx-ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity -ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav active="transactions" />
    </div>
  );
}
