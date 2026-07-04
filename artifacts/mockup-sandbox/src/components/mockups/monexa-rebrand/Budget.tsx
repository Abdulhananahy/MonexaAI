import React, { useState } from "react";
import { ChevronLeft, Edit2, TrendingUp, Coffee, ShoppingBag, Home, Plus, Minus } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Budget() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [isEditing, setIsEditing] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(1200);

  const spent = 820;
  const remaining = budgetLimit - spent;
  const percent = Math.min(100, Math.round((spent / budgetLimit) * 100));
  
  const isOver = spent > budgetLimit;
  const isClose = percent > 80 && !isOver;

  // Categories breakdown
  const categories = [
    { name: "Housing", icon: Home, amount: 450, total: 500, color: "var(--mx-primary)" },
    { name: "Food", icon: Coffee, amount: 200, total: 300, color: "var(--mx-accent)" },
    { name: "Shopping", icon: ShoppingBag, amount: 120, total: 150, color: "var(--mx-expense)" },
    { name: "Transport", icon: TrendingUp, amount: 50, total: 100, color: "var(--mx-income)" },
  ];

  return (
    <div className="monexa-rebrand mx-phone" style={{ 
      backgroundColor: "var(--mx-bg)", 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif" 
    }}>
      <style>{`
        .mx-heading { font-family: 'Baloo 2', cursive; }
        .mx-card { 
          background: white; 
          border-radius: 28px; 
          padding: 24px;
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.05);
        }
        .period-tab {
          flex: 1;
          text-align: center;
          padding: 10px 0;
          font-weight: 600;
          font-size: 14px;
          border-radius: 20px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .period-tab.active {
          background: var(--mx-primary);
          color: white;
        }
        .period-tab:not(.active) {
          color: var(--mx-text-muted);
        }
        .progress-ring-circle {
          transition: stroke-dashoffset 0.5s ease-in-out;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ 
          width: 40, height: 40, borderRadius: 20, border: "1px solid #EBE9F8", 
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "white", cursor: "pointer"
        }}>
          <ChevronLeft size={20} color="var(--mx-text)" />
        </button>
        <h1 className="mx-heading" style={{ margin: 0, fontSize: 20, color: "var(--mx-text)" }}>Budget</h1>
        <div style={{ width: 40 }} /> {/* Spacer */}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Period Selector */}
        <div style={{ 
          display: "flex", 
          background: "white", 
          borderRadius: 24, 
          padding: 4,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}>
          {(["daily", "weekly", "monthly"] as const).map(p => (
            <div 
              key={p} 
              className={`period-tab ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          ))}
        </div>

        {/* Main Budget Card */}
        <div className="mx-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          
          {/* Status badge */}
          <div style={{ 
            position: "absolute", top: 20, right: 20,
            background: isOver ? "rgba(255, 107, 107, 0.1)" : isClose ? "rgba(255, 201, 77, 0.2)" : "rgba(32, 201, 151, 0.1)",
            color: isOver ? "var(--mx-expense)" : isClose ? "#D9A020" : "var(--mx-income)",
            padding: "6px 12px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Baloo 2', cursive"
          }}>
            {isOver ? "Over Budget!" : isClose ? "Almost there!" : "On Track"}
          </div>

          <div style={{ position: "relative", width: 180, height: 180, marginTop: 10 }}>
            {/* SVG Progress Ring */}
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="90" cy="90" r="75" fill="none" stroke="#F4F3FB" strokeWidth="16" strokeLinecap="round" />
              <circle 
                className="progress-ring-circle"
                cx="90" cy="90" r="75" fill="none" 
                stroke={isOver ? "var(--mx-expense)" : isClose ? "var(--mx-accent)" : "var(--mx-primary)"} 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeDasharray={2 * Math.PI * 75}
                strokeDashoffset={2 * Math.PI * 75 * (1 - (Math.min(percent, 100) / 100))}
              />
            </svg>
            
            <div style={{ 
              position: "absolute", inset: 0, 
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" 
            }}>
              <span style={{ fontSize: 14, color: "var(--mx-text-muted)", fontWeight: 500 }}>Spent</span>
              <span className="mx-heading" style={{ fontSize: 32, color: "var(--mx-text)", lineHeight: 1.2 }}>
                ${spent}
              </span>
              <span style={{ fontSize: 13, color: "var(--mx-text-muted)", marginTop: 4 }}>
                of ${budgetLimit}
              </span>
            </div>
          </div>

          <div style={{ width: "100%", marginTop: 24, padding: "16px", background: "#F9F8FD", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: "var(--mx-text-muted)" }}>Remaining</span>
              <span style={{ fontSize: 14, color: "var(--mx-text-muted)" }}>Days Left</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mx-heading" style={{ fontSize: 20, color: remaining < 0 ? "var(--mx-expense)" : "var(--mx-text)" }}>
                ${Math.abs(remaining)}{remaining < 0 ? " over" : ""}
              </span>
              <span className="mx-heading" style={{ fontSize: 20, color: "var(--mx-text)" }}>
                12 Days
              </span>
            </div>
          </div>

        </div>

        {/* Edit Budget Input */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="mx-heading" style={{ margin: 0, fontSize: 18, color: "var(--mx-text)" }}>Monthly Limit</h2>
          
          {isEditing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => setBudgetLimit(prev => Math.max(0, prev - 100))}
                style={{ width: 32, height: 32, borderRadius: 16, background: "#F4F3FB", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mx-text)" }}
              >
                <Minus size={16} />
              </button>
              <span className="mx-heading" style={{ fontSize: 20, width: 60, textAlign: "center", color: "var(--mx-text)" }}>${budgetLimit}</span>
              <button 
                onClick={() => setBudgetLimit(prev => prev + 100)}
                style={{ width: 32, height: 32, borderRadius: 16, background: "#F4F3FB", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mx-text)" }}
              >
                <Plus size={16} />
              </button>
              <button onClick={() => setIsEditing(false)} style={{ background: "var(--mx-primary)", color: "white", border: "none", borderRadius: 16, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mx-heading" style={{ fontSize: 20, color: "var(--mx-primary)" }}>${budgetLimit}</span>
              <button onClick={() => setIsEditing(true)} style={{ background: "none", border: "none", color: "var(--mx-text-muted)", cursor: "pointer", display: "flex" }}>
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mascot Message */}
        <div style={{ 
          background: "white", borderRadius: 24, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}>
          <div style={{ width: 48, height: 48 }}>
            <Mascot mood={isOver ? "thinking" : isClose ? "thinking" : "happy"} />
          </div>
          <div>
            <div className="mx-heading" style={{ fontSize: 16, color: "var(--mx-text)", marginBottom: 2 }}>
              {isOver ? "Oops! Over limit." : isClose ? "Watch out!" : "Looking good!"}
            </div>
            <div style={{ fontSize: 13, color: "var(--mx-text-muted)", lineHeight: 1.4 }}>
              {isOver 
                ? "You've exceeded your budget this period. Let's review expenses." 
                : isClose 
                ? "You're getting close to your budget limit. Tap the brakes on spending."
                : "You're well within your budget. Keep up the great financial habits!"}
            </div>
          </div>
        </div>

        {/* Top Categories Breakdown */}
        <div>
          <h2 className="mx-heading" style={{ margin: "0 0 16px", fontSize: 18, color: "var(--mx-text)" }}>Top Categories</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {categories.map((cat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 16, 
                  background: `${cat.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cat.color
                }}>
                  <cat.icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--mx-text)" }}>{cat.name}</span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--mx-text)" }}>${cat.amount}</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "#F4F3FB", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ 
                      width: `${(cat.amount / cat.total) * 100}%`, 
                      height: "100%", 
                      background: cat.color,
                      borderRadius: 3
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mx-text-muted)", marginTop: 6 }}>
                    ${cat.total - cat.amount} left
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
