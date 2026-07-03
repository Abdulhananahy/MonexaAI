import React, { useState } from "react";
import { ArrowRight, BarChart3, MessageCircle, Wallet } from "lucide-react";
import "./_shared/tokens.css";
import { Mascot } from "./_shared/Mascot";

const SLIDES = [
  {
    id: 1,
    title: "Track spending effortlessly",
    description: "Add expenses in seconds and keep your budget in check without the headache. 💰",
    icon: <Wallet className="w-12 h-12 text-[var(--mx-primary)]" />,
    mascotMood: "happy" as const,
  },
  {
    id: 2,
    title: "Meet Momo, your AI guide",
    description: "Chat with Momo anytime for personalized financial advice and tips. ✨",
    icon: <MessageCircle className="w-12 h-12 text-[var(--mx-primary)]" />,
    mascotMood: "waving" as const,
  },
  {
    id: 3,
    title: "See your money story",
    description: "Beautiful charts and insights to help you understand where your money goes. 📊",
    icon: <BarChart3 className="w-12 h-12 text-[var(--mx-primary)]" />,
    mascotMood: "celebrating" as const,
  }
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const nextSlide = () => {
    if (!isLastSlide) {
      setCurrentSlide(s => s + 1);
    }
  };

  const skip = () => {
    setCurrentSlide(SLIDES.length - 1);
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="monexa-rebrand mx-phone flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mt-2 h-10">
        {!isLastSlide ? (
          <button 
            onClick={skip}
            className="text-[var(--mx-ink-soft)] font-medium px-4 py-2 hover:bg-[var(--mx-primary-soft)] rounded-full transition-colors"
          >
            Skip
          </button>
        ) : (
          <div /> // Spacer
        )}
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="relative w-64 h-64 flex items-center justify-center mb-10 mx-anim-float">
          {/* Abstract background blobs */}
          <div className="absolute inset-0 bg-[var(--mx-primary-soft)] rounded-full blur-2xl opacity-60"></div>
          <div className="absolute w-40 h-40 bg-[var(--mx-gold-soft)] rounded-full blur-xl opacity-70 translate-x-10 translate-y-10"></div>
          
          <div className="relative z-10 mx-anim-bounce-in" key={`mascot-${currentSlide}`}>
            <Mascot mood={slide.mascotMood} size={180} />
          </div>
          
          {/* Floating Icon */}
          <div className="absolute -bottom-4 -right-4 bg-[var(--mx-bg-elevated)] p-4 rounded-2xl shadow-[var(--mx-shadow-soft)] rotate-12 mx-anim-wiggle" key={`icon-${currentSlide}`}>
            {slide.icon}
          </div>
        </div>

        <div className="text-center space-y-4 px-4 min-h-[140px]" key={`text-${currentSlide}`}>
          <h1 className="mx-display text-3xl font-bold leading-tight text-[var(--mx-ink)] mx-anim-bounce-in" style={{ animationDelay: "100ms" }}>
            {slide.title}
          </h1>
          <p className="text-[var(--mx-ink-soft)] text-lg leading-relaxed mx-anim-bounce-in" style={{ animationDelay: "150ms" }}>
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pb-8 pt-4">
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide 
                  ? "w-8 bg-[var(--mx-primary)]" 
                  : "w-2 bg-[var(--mx-primary-soft)]"
              }`}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide}
          className="w-full bg-[var(--mx-primary)] text-white font-bold text-lg py-4 rounded-[var(--mx-card-radius)] shadow-[var(--mx-shadow)] hover:bg-[var(--mx-primary-dark)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isLastSlide ? "Get Started" : "Next"}
          {!isLastSlide && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
