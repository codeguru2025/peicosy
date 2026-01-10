import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, User, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logoUrl from "@/assets/logo.png";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Details",
        description: "Please enter your username and password to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.firstName || username}`,
      });
      
      if (data.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    } catch (err: any) {
      toast({
        title: "Unable to Sign In",
        description: "The username or password you entered doesn't match our records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        </div>
        
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
          Peicosy Private Client
        </div>
      </div>

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

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="pl-12 h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-username"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-12 h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-password"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30"
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline" data-testid="link-signup">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Global Logistics</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500">
                <span className="font-serif text-xl text-primary font-light">R</span>
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Landed Costs</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 tracking-wider">
              Private client access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
