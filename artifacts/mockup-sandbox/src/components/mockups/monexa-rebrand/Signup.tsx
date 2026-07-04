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

          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              className="w-full py-3.5 px-4 flex items-center justify-center gap-3 rounded-[var(--mx-card-radius)] font-bold text-base transition-transform hover:scale-[1.02] active:scale-[0.98] bg-[var(--mx-bg-elevated)]"
              style={{ color: 'var(--mx-ink)', boxShadow: 'var(--mx-shadow-soft)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.95 11.95 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full py-3.5 px-4 flex items-center justify-center gap-3 rounded-[var(--mx-card-radius)] font-bold text-base text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--mx-ink)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.87-.17 1.7-.85 3.08-.79 1.71.09 3 .87 3.85 2.15-3.44 2.06-2.87 6.28.44 7.9-.5 1.24-1.13 2.44-2.45 3.91zM12.03 7.25c-.14-2.11 1.7-3.85 3.66-4.02.28 2.16-1.94 3.87-3.66 4.02z" />
              </svg>
              Continue with Apple
            </button>
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
