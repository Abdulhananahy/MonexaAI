import React from "react";
import { Home as HomeIcon, Receipt, Plus, PieChart, User } from "lucide-react";
import "./tokens.css";

export type NavTab = "home" | "transactions" | "insights" | "profile";

const LEFT_TABS: { key: NavTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "transactions", label: "History", icon: Receipt },
];

const RIGHT_TABS: { key: NavTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "insights", label: "Insights", icon: PieChart },
  { key: "profile", label: "Profile", icon: User },
];

export function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="monexa-rebrand fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-40">
      <div
        className="relative flex items-center justify-between px-4"
        style={{
          height: 76,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "var(--mx-bg-elevated)",
          boxShadow: "0 -8px 24px -12px rgba(76, 63, 145, 0.22)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        {LEFT_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors"
              style={{ color: isActive ? "var(--mx-primary)" : "var(--mx-ink-soft)" }}
            >
              <Icon size={22} />
              <span className="text-[11px] font-bold">{label}</span>
            </button>
          );
        })}

        {/* Spacer reserved for the raised center button */}
        <div className="w-16 shrink-0" aria-hidden="true" />

        {RIGHT_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors"
              style={{ color: isActive ? "var(--mx-primary)" : "var(--mx-ink-soft)" }}
            >
              <Icon size={22} />
              <span className="text-[11px] font-bold">{label}</span>
            </button>
          );
        })}

        {/* Center raised Add button */}
        <button
          aria-label="Add transaction"
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-transform active:scale-90"
          style={{
            top: -22,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--mx-primary) 0%, var(--mx-primary-dark) 100%)",
            boxShadow: "0 10px 20px -6px rgba(108, 92, 231, 0.55)",
            border: "4px solid var(--mx-bg-elevated)",
          }}
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
