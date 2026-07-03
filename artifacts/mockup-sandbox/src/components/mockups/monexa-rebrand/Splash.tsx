import React, { useEffect, useState } from "react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

export function Splash() {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="monexa-rebrand mx-phone flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, var(--mx-primary-soft) 0%, var(--mx-primary) 100%)",
      }}
    >
      {/* Decorative background circles */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "var(--mx-gold)", top: "-100px", left: "-150px" }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "white", bottom: "-50px", right: "-100px" }}
      />

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-8">
        <div className="mb-6 mx-anim-float">
          <Mascot mood="waving" size={160} />
        </div>

        <h1 
          className="mx-display text-5xl font-bold tracking-tight mb-3 mx-anim-bounce-in text-white"
          style={{ textShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        >
          Monexa
        </h1>
        
        <p 
          className="text-lg font-medium text-white/90 text-center mx-anim-bounce-in"
          style={{ animationDelay: "150ms" }}
        >
          Your money, made friendly 💜
        </p>
      </div>

      <div className="w-full px-12 pb-16 z-10">
        <div className="w-full h-3 rounded-full overflow-hidden bg-white/20 p-0.5">
          <div 
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ 
              background: "var(--mx-gold)",
              width: `${Math.min(100, loadingProgress)}%`,
              boxShadow: "0 0 10px var(--mx-gold)"
            }}
          />
        </div>
        <p className="text-center text-white/70 text-sm mt-4 font-medium animate-pulse">
          Waking up Momo...
        </p>
      </div>
    </div>
  );
}
