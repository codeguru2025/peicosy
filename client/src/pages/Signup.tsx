import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, User, Loader2, Mail, UserCircle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logoUrl from "@/assets/logo.png";

export default function Signup() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }
    
    if (username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/register", { 
        username, 
        password,
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome to Peicosy!",
        description: "Your account has been created successfully",
      });
      
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Could not create account",
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
            Join<br />
            <span className="italic">Our</span><br />
            Circle
          </h2>
          <p className="text-lg text-white/80 font-light leading-relaxed tracking-wide">
            Become a private client and access London's finest luxury goods delivered to South Africa.
          </p>
          <div className="pt-12">
            <p className="font-serif italic text-white text-2xl font-light tracking-wide">Not for Everyone, Just for You</p>
          </div>
        </div>

        <div className="relative z-10 text-[9px] uppercase tracking-[0.5em] text-white/40">
          Crafted by Chibikhulu
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4 lg:hidden">
            <img src={logoUrl} alt="Peicosy" className="h-20 mx-auto object-contain" />
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Private Client</p>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-[1px] w-12 bg-primary"></div>
                <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Register</span>
                <div className="h-[1px] w-12 bg-primary"></div>
              </div>
              <h3 className="font-serif text-4xl font-light tracking-wide text-secondary">Create Account</h3>
              <p className="text-muted-foreground font-light tracking-wider text-sm">Join our exclusive private client service</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="pl-12 h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                      data-testid="input-first-name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Email <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-12 h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Username <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="pl-12 h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-username"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="pl-12 h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-password"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Minimum 6 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Confirm Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-12 h-12 rounded-xl border-border bg-white focus:border-primary shadow-sm"
                    data-testid="input-confirm-password"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30"
                data-testid="button-signup"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center text-xs">
              <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Global Logistics</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
                <span className="font-serif text-xl text-primary font-light">R</span>
                <span className="text-muted-foreground font-light tracking-wider text-[10px]">Landed Costs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
