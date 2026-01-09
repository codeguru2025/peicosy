import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe } from "lucide-react";
import { SiGoogle, SiGithub, SiApple } from "react-icons/si";
import { useLocation } from "wouter";
import logoUrl from "@/assets/logo.png";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Side - Editorial Brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <img src={logoUrl} alt="Peicosy" className="h-16 w-auto object-contain" />
        </div>

        <div className="relative z-10 max-w-lg space-y-10">
          <h2 className="font-serif text-7xl font-light leading-[0.95] tracking-tighter text-white">
            Bridging<br />
            <span className="italic">Luxury</span><br />
            Across Borders
          </h2>
          <p className="text-lg text-white/80 font-light leading-relaxed tracking-wide">
            A private client service connecting London's finest acquisitions to South Africa's discerning elite.
          </p>
          <div className="pt-12">
            <p className="font-serif italic text-white text-2xl font-light tracking-wide">Not for Everyone, Just for You</p>
          </div>
        </div>

        <div className="relative z-10 text-[9px] uppercase tracking-[0.5em] text-white/40">
          Crafted by Chibikhulu
        </div>
      </div>

      {/* Right Side - Access Portal */}
      <div className="flex flex-col items-center justify-center p-12 bg-background">
        <div className="w-full max-w-md space-y-12">
          <div className="text-center space-y-4 lg:hidden">
            <img src={logoUrl} alt="Peicosy" className="h-20 mx-auto object-contain" />
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Private Client</p>
          </div>

          <div className="space-y-10">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-[1px] w-12 bg-primary"></div>
                <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Access</span>
                <div className="h-[1px] w-12 bg-primary"></div>
              </div>
              <h3 className="font-serif text-4xl font-light tracking-wide text-secondary">Welcome Back</h3>
              <p className="text-muted-foreground font-light tracking-wider text-sm">Sign in to your private portfolio</p>
            </div>

            {/* OAuth Login Options */}
            <div className="space-y-4">
              <Button 
                className="w-full h-14 text-sm font-medium bg-white border border-border text-secondary hover:bg-muted hover:border-primary/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={handleLogin}
                data-testid="button-login-google"
              >
                <SiGoogle className="w-5 h-5 mr-3 text-[#4285F4]" />
                Continue with Google
              </Button>
              
              <Button 
                className="w-full h-14 text-sm font-medium bg-[#24292F] text-white hover:bg-[#24292F]/90 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={handleLogin}
                data-testid="button-login-github"
              >
                <SiGithub className="w-5 h-5 mr-3" />
                Continue with GitHub
              </Button>
              
              <Button 
                className="w-full h-14 text-sm font-medium bg-black text-white hover:bg-black/90 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={handleLogin}
                data-testid="button-login-apple"
              >
                <SiApple className="w-5 h-5 mr-3" />
                Continue with Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em]">
                <span className="bg-background px-6 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              className="w-full h-16 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white rounded-full transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30"
              onClick={handleLogin}
              data-testid="button-login"
            >
              Email / Password <ArrowRight className="ml-3 w-4 h-4" />
            </Button>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Global Logistics</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                <span className="font-serif text-xl text-primary font-light">£</span>
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Landed Costs</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 tracking-wider">
              Secure authentication powered by Replit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
