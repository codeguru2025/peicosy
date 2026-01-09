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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
             {/* Abstract luxury pattern or gradient */}
             <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink/30 via-navy to-navy animate-pulse" style={{ animationDuration: "8s" }}></div>
        </div>
        
        <div className="relative z-10">
          <h1 className="font-serif text-4xl font-bold">Peicosy</h1>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="font-serif text-5xl font-bold leading-tight">
            Bridging Luxury Across Borders
          </h2>
          <p className="text-lg text-gray-300">
            Seamless commerce and logistics connecting the UK and South Africa. 
            Exclusive products, handled with care.
          </p>
          <div className="pt-8">
            <p className="font-serif italic text-pink text-xl">Not for Everyone, Just for You</p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          Created by Chibikhulu
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2 lg:hidden">
            <h1 className="font-serif text-3xl font-bold text-ink">Peicosy</h1>
            <p className="text-muted-foreground">Luxury Commerce</p>
          </div>

          <Card className="border-0 shadow-2xl shadow-navy/5">
            <CardContent className="pt-8 pb-8 px-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Welcome Back</h3>
                <p className="text-muted-foreground">Sign in to access your exclusive account</p>
              </div>

              <Button 
                className="w-full h-12 text-base font-medium bg-navy hover:bg-navy/90"
                onClick={() => window.location.href = "/api/login"}
              >
                Continue with Replit Auth <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Secure Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Global Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <span className="font-serif font-bold text-lg text-primary">£</span>
                  <span>Transparent Costs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
