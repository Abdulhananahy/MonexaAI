import React, { useState } from "react";
import { ChevronLeft, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

const DEFAULT_EXPENSES = [
  { id: "e1", name: "Food & Dining", emoji: "🍔", color: "bg-orange-100 text-orange-600" },
  { id: "e2", name: "Groceries", emoji: "🛒", color: "bg-green-100 text-green-600" },
  { id: "e3", name: "Transport", emoji: "🚗", color: "bg-blue-100 text-blue-600" },
  { id: "e4", name: "Shopping", emoji: "🛍️", color: "bg-pink-100 text-pink-600" },
  { id: "e5", name: "Entertainment", emoji: "🎬", color: "bg-purple-100 text-purple-600" },
  { id: "e6", name: "Bills", emoji: "📄", color: "bg-red-100 text-red-600" },
  { id: "e7", name: "Health", emoji: "💊", color: "bg-teal-100 text-teal-600" },
  { id: "e8", name: "Other", emoji: "📦", color: "bg-gray-200 text-gray-700" },
];

const DEFAULT_INCOME = [
  { id: "i1", name: "Salary", emoji: "💰", color: "bg-emerald-100 text-emerald-600" },
  { id: "i2", name: "Freelance", emoji: "💻", color: "bg-indigo-100 text-indigo-600" },
  { id: "i3", name: "Investments", emoji: "📈", color: "bg-cyan-100 text-cyan-600" },
  { id: "i4", name: "Gifts", emoji: "🎁", color: "bg-rose-100 text-rose-600" },
  { id: "i5", name: "Other", emoji: "💵", color: "bg-gray-200 text-gray-700" },
];

export function Categories() {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const categories = activeTab === "expense" ? DEFAULT_EXPENSES : DEFAULT_INCOME;

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="monexa-rebrand mx-phone relative bg-[var(--color-bg)] overflow-hidden flex flex-col font-sans">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pop-in {
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-white sticky top-0 z-10 rounded-b-[32px] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold font-display text-[var(--color-text)]">Categories</h1>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity shadow-md">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl relative">
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
            style={{ left: activeTab === "expense" ? "4px" : "calc(50% + 0px)" }}
          />
          <button 
            className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${activeTab === "expense" ? "text-gray-900" : "text-gray-500"}`}
            onClick={() => setActiveTab("expense")}
          >
            Expenses
          </button>
          <button 
            className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${activeTab === "income" ? "text-gray-900" : "text-gray-500"}`}
            onClick={() => setActiveTab("income")}
          >
            Income
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-6 pb-24" onClick={() => setOpenMenuId(null)}>
        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 pop-in">
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center rounded-full bg-[var(--color-accent)]/20">
            <Mascot mood="happy" className="w-12 h-12" />
          </div>
          <div>
            <h3 className="font-display font-bold text-gray-900 leading-tight">Organize your flow</h3>
            <p className="text-sm text-gray-500 leading-snug mt-1">
              Custom categories help Momo track your money better!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, i) => (
            <div 
              key={cat.id} 
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative group transition-transform active:scale-95 flex flex-col items-center text-center gap-3 pop-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <button 
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
                onClick={(e) => toggleMenu(cat.id, e)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Menu Dropdown */}
              {openMenuId === cat.id && (
                <div className="absolute top-10 right-3 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-32 z-20 pop-in" style={{ animationDuration: '0.2s' }}>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${cat.color}`}>
                {cat.emoji}
              </div>
              <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
            </div>
          ))}

          {/* Add New Tile */}
          <button className="rounded-3xl p-5 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center gap-3 active:scale-95 pop-in" style={{ animationDelay: `${categories.length * 0.05}s` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-gray-400 bg-white shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-500 text-sm">Add New</span>
          </button>
        </div>
      </div>
    </div>
  );
}
