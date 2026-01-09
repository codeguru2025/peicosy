import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Menu, X, Package, Shield, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

import logoUrl from "@/assets/logo.png";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { items, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isAdmin = user?.email?.endsWith("@peicosy.com") || user?.id === "admin"; // Simple check for now

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`
        text-[11px] uppercase tracking-[0.3em] font-light transition-all duration-500
        ${isActive 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'}
      `}>
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/90 backdrop-blur-2xl">
      <div className="container mx-auto px-6 h-32 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-5 group">
          <div className="relative bg-white rounded-2xl p-3 shadow-lg shadow-primary/20 transition-all duration-500 group-hover:shadow-primary/40 group-hover:scale-105">
            <img src={logoUrl} alt="Peicosy" className="h-[84px] w-[84px] object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl font-medium tracking-[0.15em] uppercase text-white leading-none">Peicosy</span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold mt-1">Private Client</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/shop">Collection</NavLink>
          {isAuthenticated && <NavLink href="/orders">Portfolio</NavLink>}
          {isAuthenticated && isAdmin && (
             <NavLink href="/admin">Management</NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => toggleCart(true)} className="relative hover:bg-white/5">
            <ShoppingBag className="w-5 h-5 font-light" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-primary text-primary-foreground border-none">
                {cartCount}
              </Badge>
            )}
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden md:flex text-xs uppercase tracking-widest font-light hover:bg-white/5">
              Logout
            </Button>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button variant="outline" size="sm" className="rounded-full px-8 border-white/20 text-xs uppercase tracking-widest font-light hover:bg-white hover:text-background transition-colors duration-500">Access</Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/5">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] bg-background border-l border-white/5">
              <div className="flex flex-col gap-2 mt-16">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-light text-muted-foreground hover:text-foreground transition-colors duration-500">
                    Collection
                  </div>
                </Link>
                {isAuthenticated && (
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                    <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-light text-muted-foreground hover:text-foreground transition-colors duration-500">
                      Portfolio
                    </div>
                  </Link>
                )}
                {isAuthenticated && isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-light text-muted-foreground hover:text-foreground transition-colors duration-500">
                      Management
                    </div>
                  </Link>
                )}
                <div className="my-8 border-t border-white/5" />
                {isAuthenticated ? (
                  <Button variant="ghost" onClick={() => logout()} className="justify-start text-[11px] uppercase tracking-[0.4em] font-light text-muted-foreground hover:text-foreground hover:bg-transparent">
                    Logout
                  </Button>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full h-14 text-[10px] uppercase tracking-[0.4em] font-bold">Access</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
