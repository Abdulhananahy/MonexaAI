import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

const expenseCategories = [
  { id: 'food', icon: '🍔', label: 'Food & Dining' },
  { id: 'transport', icon: '🚗', label: 'Transport' },
  { id: 'shopping', icon: '🛍️', label: 'Shopping' },
  { id: 'entertainment', icon: '🍿', label: 'Entertainment' },
  { id: 'bills', icon: '📄', label: 'Bills' },
  { id: 'health', icon: '💊', label: 'Health' },
];

const incomeCategories = [
  { id: 'salary', icon: '💼', label: 'Salary' },
  { id: 'freelance', icon: '💻', label: 'Freelance' },
  { id: 'gifts', icon: '🎁', label: 'Gifts' },
  { id: 'investment', icon: '📈', label: 'Investment' },
];

export function AddTransaction() {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('42.50');
  const [selectedCategory, setSelectedCategory] = useState<string>('food');
  const [note, setNote] = useState('Lunch with Sarah');
  const [isSaving, setIsSaving] = useState(false);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // reset or show success
    }, 1500);
  };

  return (
    <div className="monexa-rebrand mx-phone flex flex-col relative pb-32 min-h-screen">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 flex items-center justify-between">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-[var(--mx-ink)] active:scale-95 transition-transform hover:bg-gray-50">
          <ArrowLeft size={20} />
        </button>
        <h1 className="mx-display text-xl font-bold">New Transaction</h1>
        <div className="w-10"></div>
      </div>

      {/* Type Toggle */}
      <div className="px-6 mb-8">
        <div className="bg-white p-1.5 rounded-full flex gap-1" style={{ boxShadow: 'var(--mx-shadow-soft)' }}>
          <button
            onClick={() => { setType('expense'); setSelectedCategory(expenseCategories[0].id); }}
            className={`flex-1 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 ${type === 'expense' ? 'bg-[var(--mx-expense)] text-white shadow-md mx-anim-bounce-in' : 'text-[var(--mx-ink-soft)] hover:bg-gray-50'}`}
          >
            Expense
          </button>
          <button
            onClick={() => { setType('income'); setSelectedCategory(incomeCategories[0].id); }}
            className={`flex-1 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 ${type === 'income' ? 'bg-[var(--mx-income)] text-white shadow-md mx-anim-bounce-in' : 'text-[var(--mx-ink-soft)] hover:bg-gray-50'}`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="px-6 mb-10 flex flex-col items-center justify-center">
        <span className="text-[var(--mx-ink-soft)] font-medium mb-2">Amount</span>
        <div className="flex items-center justify-center">
          <span className={`text-4xl font-bold mr-1 ${type === 'expense' ? 'text-[var(--mx-expense)]' : 'text-[var(--mx-income)]'}`}>$</span>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mx-display text-6xl font-extrabold text-[var(--mx-ink)] bg-transparent w-[200px] text-center focus:outline-none placeholder:text-gray-300"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 flex-1 bg-white rounded-t-[32px] pt-8 pb-32 shadow-[0_-8px_30px_rgba(76,63,145,0.08)] relative z-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="mx-display text-lg font-bold">Category</h2>
          <button className="text-[var(--mx-primary)] font-bold text-sm flex items-center gap-1 bg-[var(--mx-primary-soft)] px-3 py-1.5 rounded-full active:scale-95 transition-transform hover:opacity-90">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 ${
                  isSelected 
                    ? type === 'expense' 
                      ? 'bg-[var(--mx-expense-soft)] border-2 border-[var(--mx-expense)] shadow-sm'
                      : 'bg-[var(--mx-income-soft)] border-2 border-[var(--mx-income)] shadow-sm'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-[var(--mx-ink-soft)]'
                } ${isSelected ? 'mx-anim-bounce-in' : ''}`}
              >
                <span className="text-3xl mb-2 block transform group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-[var(--mx-ink)]' : ''}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Note Field */}
        <div className="mb-6">
          <h2 className="mx-display text-lg font-bold mb-3">Note</h2>
          <div className="relative">
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              className="w-full bg-gray-50 text-[var(--mx-ink)] border-none rounded-2xl py-4 px-5 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--mx-primary-soft)] transition-shadow"
            />
          </div>
        </div>

      </div>

      {/* Save Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 z-10 pointer-events-none">
        <button 
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg pointer-events-auto transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:opacity-95 ${
            type === 'expense' ? 'bg-[var(--mx-expense)] shadow-[0_8px_20px_rgba(255,107,107,0.3)]' : 'bg-[var(--mx-income)] shadow-[0_8px_20px_rgba(0,200,150,0.3)]'
          }`}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>Save {type === 'expense' ? 'Expense' : 'Income'}</>
          )}
        </button>
      </div>
    </div>
  );
}
