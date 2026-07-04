import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Check } from 'lucide-react';
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="monexa-rebrand mx-phone flex flex-col min-h-screen px-6 py-12 relative overflow-hidden bg-[var(--mx-bg)]">
      {/* Background decorations */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full opacity-30" style={{ background: 'var(--mx-gold-soft)' }} />
      <div className="absolute bottom-[-30px] left-[-30px] w-64 h-64 rounded-full opacity-40 pointer-events-none" style={{ background: 'var(--mx-primary-soft)' }} />

      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="mx-anim-float mb-4">
            <Mascot mood="happy" size={80} />
          </div>
          <h1 className="mx-display text-4xl font-bold text-center mb-2" style={{ color: 'var(--mx-ink)' }}>
            Join Monexa
          </h1>
          <p className="text-center font-medium opacity-80" style={{ color: 'var(--mx-ink-soft)' }}>
            Your personal AI money buddy ✨
          </p>
        </div>

        <form className="flex flex-col gap-4 w-full mx-anim-bounce-in" style={{ animationDelay: '0.1s' }} onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>Full Name</label>
            <div 
              className="flex items-center px-4 py-3.5 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
              style={{ boxShadow: 'var(--mx-shadow-soft)' }}
            >
              <Sparkles className="w-5 h-5 mr-3 opacity-40" style={{ color: 'var(--mx-ink)' }} />
              <input 
                type="text" 
                placeholder="e.g. Alex Johnson" 
                className="bg-transparent border-none outline-none w-full text-base font-medium placeholder-opacity-40 placeholder-[var(--mx-ink-soft)] text-[var(--mx-ink)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>Email Address</label>
            <div 
              className="flex items-center px-4 py-3.5 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
              style={{ boxShadow: 'var(--mx-shadow-soft)' }}
            >
              <Mail className="w-5 h-5 mr-3 opacity-40" style={{ color: 'var(--mx-ink)' }} />
              <input 
                type="email" 
                placeholder="you@awesome.com" 
                className="bg-transparent border-none outline-none w-full text-base font-medium placeholder-opacity-40 placeholder-[var(--mx-ink-soft)] text-[var(--mx-ink)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>Password</label>
            <div 
              className="flex items-center px-4 py-3.5 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
              style={{ boxShadow: 'var(--mx-shadow-soft)' }}
            >
              <Lock className="w-5 h-5 mr-3 opacity-40" style={{ color: 'var(--mx-ink)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="bg-transparent border-none outline-none w-full text-base font-medium placeholder-opacity-40 placeholder-[var(--mx-ink-soft)] text-[var(--mx-ink)]"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--mx-ink)' }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-2 mb-2 ml-1">
            <button 
              type="button"
              onClick={() => setAgreed(!agreed)}
              className="mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0"
              style={{ 
                borderColor: agreed ? 'var(--mx-primary)' : 'var(--mx-ink-soft)',
                backgroundColor: agreed ? 'var(--mx-primary)' : 'transparent',
                opacity: agreed ? 1 : 0.5
              }}
            >
              {agreed && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            <p className="text-sm leading-tight font-medium" style={{ color: 'var(--mx-ink-soft)' }}>
              I agree to the <a href="#" className="font-bold hover:underline" style={{ color: 'var(--mx-primary)' }}>Terms of Service</a> and <a href="#" className="font-bold hover:underline" style={{ color: 'var(--mx-primary)' }}>Privacy Policy</a>.
            </p>
          </div>

          <button 
            type="submit"
            className="w-full mt-2 py-4 px-6 flex items-center justify-center gap-2 rounded-[var(--mx-card-radius)] text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'var(--mx-primary)', 
              boxShadow: '0 8px 24px -8px var(--mx-primary)'
            }}
          >
            Create Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-6 mx-anim-bounce-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center w-full max-w-[280px]">
            <div className="h-[2px] flex-1 opacity-10" style={{ background: 'var(--mx-ink)' }}></div>
            <span className="px-4 text-sm font-bold opacity-40" style={{ color: 'var(--mx-ink)' }}>OR</span>
            <div className="h-[2px] flex-1 opacity-10" style={{ background: 'var(--mx-ink)' }}></div>
          </div>
          
          <div className="flex justify-center w-full">
            <button 
              className="text-base font-medium px-4 py-2" 
              style={{ color: 'var(--mx-ink-soft)' }}
            >
              Already have an account?{" "}
              <span className="font-bold" style={{ color: 'var(--mx-primary)' }}>
                Log in
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
