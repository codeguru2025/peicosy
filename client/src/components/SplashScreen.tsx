import { useEffect, useState } from "react";
import logoUrl from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-secondary transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center space-y-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl animate-pulse">
          <img 
            src={logoUrl} 
            alt="Peicosy" 
            className="h-24 w-24 object-contain"
          />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.15em] uppercase text-white">
            Peicosy
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/60 font-light">
            Private Client
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <p className="font-serif italic text-white/80 text-lg font-light tracking-wide mt-8">
          Not for Everyone, Just for You
        </p>
      </div>
      
      <div className="absolute bottom-8 text-[9px] uppercase tracking-[0.5em] text-white/30">
        Crafted by Chibikhulu
      </div>
    </div>
  );
}
