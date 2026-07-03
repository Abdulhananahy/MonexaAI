import React, { useState } from "react";
import { ChevronLeft, MoreHorizontal, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Insights() {
  const [timeRange, setTimeRange] = useState("This Month");

  const categories = [
    { name: "Food & Dining", amount: 485.20, color: "var(--mx-primary)", percentage: 42 },
    { name: "Shopping", amount: 210.50, color: "var(--mx-expense)", percentage: 18 },
    { name: "Transportation", amount: 145.00, color: "var(--mx-gold)", percentage: 12 },
    { name: "Entertainment", amount: 110.00, color: "#9D8AF2", percentage: 9 }, // Lighter primary
    { name: "Bills & Utilities", amount: 220.00, color: "var(--mx-ink-soft)", percentage: 19 },
  ];

  const totalSpent = categories.reduce((acc, cat) => acc + cat.amount, 0);

  // Simple sparkline data (Balance over time)
  const sparklineData = [1200, 1150, 1300, 1050, 1400, 1350, 1800, 1600, 1950, 1850, 2100, 2450];
  const sparklineMax = Math.max(...sparklineData);
  const sparklineMin = Math.min(...sparklineData);
  const sparklineHeight = 60;
  const sparklineWidth = 300;
  
  const sparklinePoints = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * sparklineWidth;
    const y = sparklineHeight - ((val - sparklineMin) / (sparklineMax - sparklineMin)) * sparklineHeight;
    return `${x},${y}`;
  }).join(" ");

  // Pie chart conic gradient
  let cumulativePercentage = 0;
  const conicStops = categories.map((cat) => {
    const start = cumulativePercentage;
    const end = cumulativePercentage + cat.percentage;
    cumulativePercentage = end;
    return `${cat.color} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div className="monexa-rebrand mx-phone pb-24 bg-[var(--mx-bg)] font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[var(--mx-bg)]/90 backdrop-blur-md z-10">
        <button className="w-10 h-10 rounded-full bg-[var(--mx-bg-elevated)] shadow-[var(--mx-shadow-soft)] flex items-center justify-center text-[var(--mx-ink)] active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="mx-display text-xl font-bold text-[var(--mx-ink)]">Insights</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--mx-ink)] active:scale-95 transition-transform">
          <MoreHorizontal size={24} />
        </button>
      </header>

      <main className="px-6 flex flex-col gap-6">
        
        {/* Title & Time Range */}
        <div className="flex flex-col gap-2">
          <h2 className="mx-display text-3xl font-extrabold text-[var(--mx-ink)] tracking-tight">
            Your Money Story 📊
          </h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[var(--mx-ink-soft)] font-medium">Overview of your spending habits.</p>
            <div className="flex items-center gap-1.5 bg-[var(--mx-bg-elevated)] px-3 py-1.5 rounded-full shadow-[var(--mx-shadow-soft)] text-sm font-semibold text-[var(--mx-primary)]">
              <Calendar size={14} />
              {timeRange}
            </div>
          </div>
        </div>

        {/* Total Spent Summary Card */}
        <div 
          className="bg-[var(--mx-bg-elevated)] p-6 flex items-center justify-between shadow-[var(--mx-shadow)] relative overflow-hidden"
          style={{ borderRadius: "var(--mx-card-radius)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--mx-primary-soft)] rounded-full -mr-10 -mt-10 opacity-50 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-[var(--mx-ink-soft)] font-medium mb-1">Total Spent</p>
            <h3 className="mx-display text-4xl font-bold text-[var(--mx-ink)]">${totalSpent.toFixed(2)}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-[var(--mx-expense)] text-sm font-bold bg-[var(--mx-expense-soft)] px-2 py-1 rounded-lg w-max">
              <TrendingUp size={16} />
              +12.5% vs last month
            </div>
          </div>
          <div className="relative z-10 w-20 h-20 flex-shrink-0 bg-[var(--mx-bg)] rounded-full flex items-center justify-center shadow-inner">
            <Mascot mood="thinking" size={90} className="mt-4 mx-anim-float" />
          </div>
        </div>

        {/* Category Breakdown (Donut Chart) */}
        <div 
          className="bg-[var(--mx-bg-elevated)] p-6 shadow-[var(--mx-shadow-soft)]"
          style={{ borderRadius: "var(--mx-card-radius)" }}
        >
          <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)] mb-6">Spending Breakdown</h3>
          
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <div 
                className="w-full h-full rounded-full mx-anim-bounce-in"
                style={{
                  background: `conic-gradient(${conicStops})`,
                  animationDelay: "0.1s"
                }}
              />
              {/* Inner circle for donut hole */}
              <div className="absolute inset-[20%] bg-[var(--mx-bg-elevated)] rounded-full flex items-center justify-center shadow-inner">
                <span className="mx-display font-bold text-lg text-[var(--mx-ink)]">
                  {categories[0].percentage}%
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1">
              {categories.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-[var(--mx-ink)] font-medium truncate max-w-[80px]">{cat.name}</span>
                  </div>
                  <span className="text-[var(--mx-ink-soft)] font-semibold">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div 
          className="bg-[var(--mx-bg-elevated)] p-6 shadow-[var(--mx-shadow-soft)]"
          style={{ borderRadius: "var(--mx-card-radius)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)]">Top Categories</h3>
            <button className="text-[var(--mx-primary)] text-sm font-bold">See All</button>
          </div>

          <div className="flex flex-col gap-4">
            {categories.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[var(--mx-ink)]">{cat.name}</span>
                  <span className="font-bold text-[var(--mx-ink)]">${cat.amount.toFixed(2)}</span>
                </div>
                <div className="w-full h-3 bg-[var(--mx-bg)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${cat.percentage * 2}%`, // Scaled for visual effect
                      backgroundColor: cat.color,
                      transition: "width 1s ease-out"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Over Time (Sparkline) */}
        <div 
          className="bg-[var(--mx-bg-elevated)] p-6 shadow-[var(--mx-shadow-soft)]"
          style={{ borderRadius: "var(--mx-card-radius)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)]">Balance Trend</h3>
          </div>
          <p className="text-sm text-[var(--mx-ink-soft)] mb-6 font-medium">Your balance has increased by <strong className="text-[var(--mx-income)]">$1,250</strong> this year ✨</p>
          
          <div className="w-full h-[100px] relative mt-2 flex items-end">
            <svg viewBox={`0 0 ${sparklineWidth} ${sparklineHeight + 20}`} className="w-full h-full overflow-visible drop-shadow-md">
              {/* Grid lines */}
              <line x1="0" y1="20" x2={sparklineWidth} y2="20" stroke="var(--mx-bg)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="0" y1={sparklineHeight + 20} x2={sparklineWidth} y2={sparklineHeight + 20} stroke="var(--mx-bg)" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* Sparkline gradient fill */}
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--mx-income)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--mx-income)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon 
                points={`0,${sparklineHeight + 20} ${sparklinePoints.split(" ").map(p => { const [x,y] = p.split(","); return `${x},${Number(y)+20}`}).join(" ")} ${sparklineWidth},${sparklineHeight + 20}`} 
                fill="url(#sparkline-gradient)" 
                className="mx-anim-bounce-in"
              />
              
              {/* Sparkline line */}
              <polyline
                points={sparklinePoints.split(" ").map(p => { const [x,y] = p.split(","); return `${x},${Number(y)+20}`}).join(" ")}
                fill="none"
                stroke="var(--mx-income)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-anim-float"
                style={{ animationDuration: '6s' }}
              />
              
              {/* Data points (dots) */}
              {sparklinePoints.split(" ").map((p, i) => {
                const [x, y] = p.split(",");
                // Only show a few dots
                if (i === 0 || i === Math.floor(sparklineData.length / 2) || i === sparklineData.length - 1) {
                  return (
                    <circle key={i} cx={x} cy={Number(y)+20} r="4" fill="white" stroke="var(--mx-income)" strokeWidth="3" />
                  );
                }
                return null;
              })}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-[var(--mx-ink-soft)] font-bold mt-2 uppercase tracking-wider">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>

      </main>
    </div>
  );
}
