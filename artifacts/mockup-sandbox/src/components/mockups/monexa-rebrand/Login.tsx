import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="monexa-rebrand mx-phone flex flex-col min-h-screen px-6 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full opacity-30" style={{ background: 'var(--mx-gold-soft)' }} />
      <div className="absolute bottom-[-30px] left-[-30px] w-64 h-64 rounded-full opacity-40 pointer-events-none" style={{ background: 'var(--mx-primary-soft)' }} />

      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex flex-col items-center mt-8 mb-10">
          <div className="mx-anim-float mb-4">
            <Mascot mood={isLogin ? "happy" : "waving"} size={100} />
          </div>
          <h1 className="mx-display text-4xl font-bold text-center mb-2" style={{ color: 'var(--mx-ink)' }}>
            {isLogin ? "Welcome back" : "Join Monexa"}
          </h1>
          <p className="text-center font-medium opacity-80" style={{ color: 'var(--mx-ink-soft)' }}>
            {isLogin ? "Ready to crush your goals today? 🎯" : "Your personal AI money buddy ✨"}
          </p>
        </div>

        <form className="flex flex-col gap-5 w-full mx-anim-bounce-in" style={{ animationDelay: '0.1s' }} onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>First Name</label>
              <div 
                className="flex items-center px-4 py-4 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
                style={{ boxShadow: 'var(--mx-shadow-soft)' }}
              >
                <Sparkles className="w-5 h-5 mr-3 opacity-40" style={{ color: 'var(--mx-ink)' }} />
                <input 
                  type="text" 
                  placeholder="e.g. Alex" 
                  className="bg-transparent border-none outline-none w-full text-base font-medium placeholder-opacity-40 placeholder-[var(--mx-ink-soft)] text-[var(--mx-ink)]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>Email Address</label>
            <div 
              className="flex items-center px-4 py-4 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-2" style={{ color: 'var(--mx-ink)' }}>Password</label>
            <div 
              className="flex items-center px-4 py-4 rounded-[var(--mx-card-radius)] border-2 border-transparent transition-all focus-within:border-[var(--mx-primary)] bg-[var(--mx-bg-elevated)]"
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
            {isLogin && (
              <div className="flex justify-end mt-1">
                <button type="button" className="text-sm font-bold hover:underline" style={{ color: 'var(--mx-primary)' }}>
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full mt-4 py-4 px-6 flex items-center justify-center gap-2 rounded-[var(--mx-card-radius)] text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'var(--mx-primary)', 
              boxShadow: '0 8px 24px -8px var(--mx-primary)'
            }}
          >
            {isLogin ? "Log In" : "Create Account"}
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
              onClick={() => setIsLogin(!isLogin)}
              className="text-base font-medium px-4 py-2" 
              style={{ color: 'var(--mx-ink-soft)' }}
            >
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span className="font-bold" style={{ color: 'var(--mx-primary)' }}>
                {isLogin ? "Sign up" : "Log in"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Social proof footer */}
      <div className="mt-auto pt-8 flex items-center justify-center pb-4 mx-anim-bounce-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex -space-x-3 mr-3">
          <div className="w-8 h-8 rounded-full border-2 bg-blue-100 flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--mx-bg)' }}>👨</div>
          <div className="w-8 h-8 rounded-full border-2 bg-pink-100 flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--mx-bg)' }}>👩</div>
          <div className="w-8 h-8 rounded-full border-2 bg-green-100 flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--mx-bg)' }}>🙋‍♂️</div>
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--mx-ink-soft)' }}>
          Join <strong style={{ color: 'var(--mx-ink)' }}>10,000+</strong> happy savers!
        </p>
      </div>
    </div>
  );
}
