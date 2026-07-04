import React, { useState } from "react";
import { ChevronLeft, Globe, Moon, Wallet, BellRing, Mail, MessageSquare, ChevronRight, Check } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Preferences() {
  const [darkMode, setDarkMode] = useState(false);
  const [budget, setBudget] = useState("2,500");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [toggles, setToggles] = useState({
    budgetAlerts: true,
    weeklySummary: false,
    transactionReminders: true,
  });

  return (
    <div className="monexa-rebrand mx-phone relative flex flex-col h-full bg-[#FFFDF9] overflow-hidden text-[#2D3436]">
      <style>{`
        .mx-glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px rgba(108, 92, 231, 0.05);
        }
        
        .mx-switch-bg {
          transition: background-color 0.3s ease;
        }
        .mx-switch-knob {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center px-6 pt-12 pb-4 z-10 bg-[#FFFDF9]/90 backdrop-blur-md sticky top-0">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#2D3436] hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-['Baloo_2'] text-2xl font-bold text-[#2D3436] ml-4">Preferences</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 scrollbar-hide relative z-0">
        
        {/* Playful top section */}
        <div className="flex items-center justify-between mx-glass-card rounded-[28px] p-5 relative overflow-hidden bg-gradient-to-br from-[#6C5CE7]/10 to-[#FFC94D]/10">
          <div>
            <h2 className="font-['Baloo_2'] text-xl font-bold text-[#2D3436] mb-1">Make it yours!</h2>
            <p className="text-sm text-[#2D3436]/60 font-['Inter']">Customize your experience</p>
          </div>
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 transform scale-150 origin-bottom right-[-10px]">
              <Mascot mood="happy" />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <section>
          <h3 className="font-['Baloo_2'] text-lg font-bold text-[#2D3436] mb-3 px-2">General</h3>
          <div className="bg-white rounded-[28px] p-2 shadow-sm border border-gray-100/50">
            {/* Currency Selector */}
            <div 
              className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors relative"
              onClick={() => setCurrencyOpen(!currencyOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7]">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-['Inter'] font-semibold text-[#2D3436]">Currency</p>
                  <p className="font-['Inter'] text-xs text-[#2D3436]/50">USD - US Dollar</p>
                </div>
              </div>
              <ChevronRight size={20} className={`text-gray-400 transition-transform ${currencyOpen ? 'rotate-90' : ''}`} />
              
              {/* Fake Currency Dropdown Hint */}
              {currencyOpen && (
                <div className="absolute top-[110%] right-0 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#6C5CE7]/5 text-[#6C5CE7]">
                    <span className="font-['Inter'] font-semibold text-sm">USD</span>
                    <Check size={16} />
                  </div>
                  <div className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-[#2D3436]">
                    <span className="font-['Inter'] font-medium text-sm">EUR</span>
                  </div>
                  <div className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-[#2D3436]">
                    <span className="font-['Inter'] font-medium text-sm">GBP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 mx-4"></div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2D3436]/5 flex items-center justify-center text-[#2D3436]">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="font-['Inter'] font-semibold text-[#2D3436]">Dark Mode</p>
                  <p className="font-['Inter'] text-xs text-[#2D3436]/50">Easier on the eyes</p>
                </div>
              </div>
              <button 
                className={`w-12 h-6 rounded-full p-1 mx-switch-bg ${darkMode ? 'bg-[#6C5CE7]' : 'bg-gray-200'}`}
                onClick={() => setDarkMode(!darkMode)}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-switch-knob shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Budget Settings */}
        <section>
          <h3 className="font-['Baloo_2'] text-lg font-bold text-[#2D3436] mb-3 px-2">Budgeting</h3>
          <div className="bg-white rounded-[28px] p-4 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FFC94D]/20 flex items-center justify-center text-[#E5B545]">
                <Wallet size={20} />
              </div>
              <div>
                <p className="font-['Inter'] font-semibold text-[#2D3436]">Monthly Budget</p>
                <p className="font-['Inter'] text-xs text-[#2D3436]/50">Quick-set your limit</p>
              </div>
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#2D3436]">$</span>
              <input 
                type="text" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#FFFDF9] border-2 border-[#6C5CE7]/10 rounded-2xl py-3 pl-8 pr-4 font-['Baloo_2'] text-2xl font-bold text-[#2D3436] focus:outline-none focus:border-[#6C5CE7] transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#6C5CE7] text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#5A4AD1] transition-colors">
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="font-['Baloo_2'] text-lg font-bold text-[#2D3436] mb-3 px-2">Notifications</h3>
          <div className="bg-white rounded-[28px] p-2 shadow-sm border border-gray-100/50">
            
            <div className="flex items-center justify-between p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF7675]/10 flex items-center justify-center text-[#FF7675]">
                  <BellRing size={20} />
                </div>
                <div>
                  <p className="font-['Inter'] font-semibold text-[#2D3436]">Budget Alerts</p>
                  <p className="font-['Inter'] text-xs text-[#2D3436]/50">When near your limit</p>
                </div>
              </div>
              <button 
                className={`w-12 h-6 rounded-full p-1 mx-switch-bg ${toggles.budgetAlerts ? 'bg-[#6C5CE7]' : 'bg-gray-200'}`}
                onClick={() => setToggles({...toggles, budgetAlerts: !toggles.budgetAlerts})}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-switch-knob shadow-sm ${toggles.budgetAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="h-px bg-gray-100 mx-4"></div>

            <div className="flex items-center justify-between p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B894]/10 flex items-center justify-center text-[#00B894]">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-['Inter'] font-semibold text-[#2D3436]">Weekly Summary</p>
                  <p className="font-['Inter'] text-xs text-[#2D3436]/50">Email report on Mondays</p>
                </div>
              </div>
              <button 
                className={`w-12 h-6 rounded-full p-1 mx-switch-bg ${toggles.weeklySummary ? 'bg-[#6C5CE7]' : 'bg-gray-200'}`}
                onClick={() => setToggles({...toggles, weeklySummary: !toggles.weeklySummary})}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-switch-knob shadow-sm ${toggles.weeklySummary ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="h-px bg-gray-100 mx-4"></div>

            <div className="flex items-center justify-between p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0984E3]/10 flex items-center justify-center text-[#0984E3]">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-['Inter'] font-semibold text-[#2D3436]">Transaction Reminders</p>
                  <p className="font-['Inter'] text-xs text-[#2D3436]/50">Push notifications</p>
                </div>
              </div>
              <button 
                className={`w-12 h-6 rounded-full p-1 mx-switch-bg ${toggles.transactionReminders ? 'bg-[#6C5CE7]' : 'bg-gray-200'}`}
                onClick={() => setToggles({...toggles, transactionReminders: !toggles.transactionReminders})}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-switch-knob shadow-sm ${toggles.transactionReminders ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
