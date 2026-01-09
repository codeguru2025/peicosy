import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Side - Editorial Brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-background overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background"></div>
        </div>
        
        <div className="relative z-10">
          <span className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-foreground">Peicosy</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-10">
          <h2 className="font-serif text-7xl font-light leading-[0.95] tracking-tighter">
            Bridging<br />
            <span className="text-primary italic">Luxury</span><br />
            Across Borders
          </h2>
          <p className="text-lg text-muted-foreground font-light leading-relaxed tracking-wide">
            A private client service connecting London's finest acquisitions to South Africa's discerning elite.
          </p>
          <div className="pt-12">
            <p className="font-serif italic text-primary text-2xl font-light tracking-wide">Not for Everyone, Just for You</p>
          </div>
        </div>

        <div className="relative z-10 text-[9px] uppercase tracking-[0.5em] text-muted-foreground/30">
          Crafted by Chibikhulu
        </div>
      </div>

      {/* Right Side - Access Portal */}
      <div className="flex flex-col items-center justify-center p-12 bg-background">
        <div className="w-full max-w-md space-y-16">
          <div className="text-center space-y-4 lg:hidden">
            <span className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-foreground">Peicosy</span>
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Private Client</p>
          </div>

          <div className="space-y-12">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-[1px] w-12 bg-primary"></div>
                <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Access</span>
                <div className="h-[1px] w-12 bg-primary"></div>
              </div>
              <h3 className="font-serif text-4xl font-light tracking-wide">Welcome Back</h3>
              <p className="text-muted-foreground font-light tracking-wider text-sm">Enter your private portfolio</p>
            </div>

            <Button 
              className="w-full h-16 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 rounded-full transition-all duration-500 hover:scale-[1.02]"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Continue with Replit <ArrowRight className="ml-3 w-4 h-4" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em]">
                <span className="bg-background px-6 text-muted-foreground/50">Secure Access</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                <Globe className="w-6 h-6 text-primary" />
                <span className="text-muted-foreground font-light tracking-wider">Global Logistics</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-serif text-2xl text-primary font-light">£</span>
                <span className="text-muted-foreground font-light tracking-wider">Landed Costs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
