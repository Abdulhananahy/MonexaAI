import React, { useState } from "react";
import { Check, X, Tag } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot, ConfettiBurst } from "./_shared/Mascot";

export function Upgrade() {
  const [selectedTier, setSelectedTier] = useState<string>("pro");
  const [promoCode, setPromoCode] = useState("");

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Just the basics to get started.",
      features: [
        { text: "10 AI messages per day", included: true },
        { text: "Basic transaction tracking", included: true },
        { text: "Visual spending charts", included: false },
        { text: "Data export", included: false },
      ],
      popular: false,
    },
    {
      id: "starter",
      name: "Starter",
      price: "$3",
      period: "/mo",
      description: "Perfect for everyday budgeters.",
      features: [
        { text: "50 AI messages per day", included: true },
        { text: "Basic transaction tracking", included: true },
        { text: "Visual spending charts", included: true },
        { text: "Data export", included: false },
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$9",
      period: "/mo",
      description: "For true financial mastery.",
      features: [
        { text: "Unlimited AI messages", included: true },
        { text: "Advanced transaction tracking", included: true },
        { text: "Visual spending charts", included: true },
        { text: "Data export (CSV, PDF)", included: true },
      ],
      popular: true,
    },
  ];

  return (
    <div className="monexa-rebrand mx-phone relative min-h-screen bg-[var(--mx-bg)] pb-12 overflow-hidden">
      {/* Confetti Background */}
      <ConfettiBurst count={30} />

      {/* Header Section */}
      <div className="px-6 pt-12 pb-6 flex flex-col items-center text-center relative z-10">
        <div className="mx-anim-bounce-in">
          <Mascot mood="celebrating" size={140} className="mx-anim-float" />
        </div>
        <h1 className="mx-display text-3xl font-bold text-[var(--mx-ink)] mt-4 mb-2 leading-tight">
          Unlock your full money story ✨
        </h1>
        <p className="text-[var(--mx-ink-soft)] text-sm">
          Choose the plan that fits your financial journey.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="px-5 space-y-4 relative z-10">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            onClick={() => setSelectedTier(tier.id)}
            className={`relative rounded-[var(--mx-card-radius)] p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedTier === tier.id ? "scale-[1.02]" : "scale-100 opacity-90 hover:opacity-100"
            }`}
            style={{
              background: "var(--mx-bg-elevated)",
              boxShadow: selectedTier === tier.id ? "var(--mx-shadow)" : "var(--mx-shadow-soft)",
              border: tier.popular
                ? `2px solid var(--mx-gold)`
                : selectedTier === tier.id
                ? `2px solid var(--mx-primary)`
                : `2px solid transparent`,
            }}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-[var(--mx-gold)] text-[var(--mx-ink)] text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                Most Popular
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="mx-display text-xl font-bold text-[var(--mx-ink)]">{tier.name}</h3>
                <p className="text-[var(--mx-ink-soft)] text-xs mt-1">{tier.description}</p>
              </div>
              <div className="text-right">
                <span className="mx-display text-2xl font-bold text-[var(--mx-primary)]">{tier.price}</span>
                {tier.period && <span className="text-[var(--mx-ink-soft)] text-sm">{tier.period}</span>}
              </div>
            </div>

            <ul className="space-y-2 mt-4 pt-4 border-t border-[var(--mx-bg)]">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  {feature.included ? (
                    <div className="w-5 h-5 rounded-full bg-[var(--mx-income-soft)] text-[var(--mx-income)] flex items-center justify-center mr-3 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[var(--mx-expense-soft)] text-[var(--mx-expense)] flex items-center justify-center mr-3 shrink-0 opacity-50">
                      <X size={12} strokeWidth={3} />
                    </div>
                  )}
                  <span className={feature.included ? "text-[var(--mx-ink)]" : "text-[var(--mx-ink-soft)] opacity-75 line-through decoration-[var(--mx-ink-soft)]"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Promo Code & Checkout */}
      <div className="px-5 mt-8 mb-6 relative z-10">
        <div className="bg-[var(--mx-bg-elevated)] rounded-2xl p-2 flex items-center shadow-[var(--mx-shadow-soft)] mb-6">
          <div className="pl-3 pr-2 text-[var(--mx-ink-soft)]">
            <Tag size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Have a promo code?" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[var(--mx-ink)] text-sm placeholder-[var(--mx-ink-soft)] h-10"
          />
          <button className="bg-[var(--mx-primary-soft)] text-[var(--mx-primary-dark)] px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95">
            Apply
          </button>
        </div>

        <button className="w-full bg-[var(--mx-primary)] text-white h-14 rounded-2xl font-bold text-lg shadow-[var(--mx-shadow)] transition-transform active:scale-95 flex items-center justify-center gap-2">
          Continue with {tiers.find(t => t.id === selectedTier)?.name}
        </button>
        
        <p className="text-center text-[var(--mx-ink-soft)] text-xs mt-4">
          Cancel anytime. Terms and conditions apply.
        </p>
      </div>
    </div>
  );
}
