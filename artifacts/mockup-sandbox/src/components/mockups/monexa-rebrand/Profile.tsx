import React from 'react';
import { 
  User, 
  Settings, 
  Tags, 
  PieChart, 
  Crown, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  CalendarDays,
  Activity
} from 'lucide-react';
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Profile() {
  return (
    <div className="monexa-rebrand mx-phone flex flex-col h-full bg-[var(--mx-bg)] overflow-hidden">
      <style>{`
        .profile-row:active {
          transform: scale(0.98);
        }
      `}</style>
      
      {/* Header Area */}
      <header className="px-6 pt-12 pb-6 flex flex-col items-center text-center relative">
        <div className="w-24 h-24 rounded-full bg-[var(--mx-primary-soft)] border-4 border-white shadow-[var(--mx-shadow-soft)] flex items-center justify-center overflow-hidden mb-4 relative z-10">
          <Mascot mood="happy" size={80} className="mt-4" />
        </div>
        
        <h1 className="mx-display text-2xl font-bold text-[var(--mx-ink)] mb-1">Alex Johnson</h1>
        <p className="text-[var(--mx-ink-soft)] font-medium mb-3">alex@example.com</p>
        
        <div className="bg-[#FFC94D]/20 text-[#D49A11] px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm shadow-sm border border-[#FFC94D]/30">
          <Crown className="w-4 h-4" />
          Pro Plan
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6">
        
        {/* Stats Card */}
        <div 
          className="p-5 flex items-center justify-between mx-anim-float"
          style={{ 
            background: "white",
            borderRadius: "var(--mx-card-radius)",
            boxShadow: "var(--mx-shadow-soft)"
          }}
        >
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-[var(--mx-primary-soft)] text-[var(--mx-primary)] flex items-center justify-center mb-2">
              <CalendarDays className="w-5 h-5" />
            </div>
            <p className="text-[var(--mx-ink-soft)] text-xs font-medium mb-1">Member Since</p>
            <p className="font-bold text-[var(--mx-ink)]">Oct 2023</p>
          </div>
          
          <div className="w-px h-12 bg-[var(--mx-border)]"></div>
          
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-[var(--mx-income-soft)] text-[var(--mx-income)] flex items-center justify-center mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-[var(--mx-ink-soft)] text-xs font-medium mb-1">Transactions</p>
            <p className="font-bold text-[var(--mx-ink)]">1,284</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-3">
          <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)] mb-1">Account</h3>
          
          <SettingRow icon={<User />} label="Personal Info" />
          <SettingRow icon={<Settings />} label="Preferences" />
          <SettingRow icon={<Tags />} label="Categories" />
          <SettingRow icon={<PieChart />} label="Budget" />
          
          <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)] mt-3 mb-1">Support & More</h3>
          
          <SettingRow 
            icon={<Crown />} 
            label="Manage Subscription" 
            badge="Pro"
            iconColor="#D49A11"
            iconBg="#FFC94D20" 
          />
          <SettingRow icon={<HelpCircle />} label="Help & Support" />
          
          <button className="profile-row bg-white p-4 flex items-center gap-4 mt-2 transition-transform active:scale-95 text-left w-full"
            style={{ 
              borderRadius: "calc(var(--mx-card-radius) * 0.7)",
              boxShadow: "var(--mx-shadow-soft)"
            }}>
            <div className="w-10 h-10 rounded-full bg-[var(--mx-expense-soft)] text-[var(--mx-expense)] flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="flex-1 font-bold text-[var(--mx-expense)]">Log Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function SettingRow({ icon, label, badge, iconBg = "var(--mx-bg-elevated)", iconColor = "var(--mx-primary)" }: { icon: React.ReactNode, label: string, badge?: string, iconBg?: string, iconColor?: string }) {
  return (
    <button className="profile-row bg-white p-3 pr-4 flex items-center gap-4 transition-transform active:scale-95 text-left w-full"
      style={{ 
        borderRadius: "calc(var(--mx-card-radius) * 0.7)",
        boxShadow: "var(--mx-shadow-soft)"
      }}>
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ 
          backgroundColor: iconBg,
          color: iconColor
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>
      <span className="flex-1 font-bold text-[var(--mx-ink)]">{label}</span>
      {badge && (
        <span className="bg-[#FFC94D]/20 text-[#D49A11] px-2 py-0.5 rounded text-xs font-bold mr-2">
          {badge}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-[var(--mx-ink-soft)] shrink-0" />
    </button>
  );
}
