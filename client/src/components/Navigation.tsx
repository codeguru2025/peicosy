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
        text-[11px] uppercase tracking-[0.3em] font-medium transition-all duration-500
        ${isActive 
          ? 'text-primary' 
          : 'text-secondary hover:text-primary'}
      `}>
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-primary/10 bg-white shadow-lg shadow-primary/5">
      <div className="container mx-auto px-4 md:px-6 h-16 md:h-28 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group transition-transform duration-500 hover:scale-105">
          <img src={logoUrl} alt="Peicosy" className="h-10 md:h-20 w-auto object-contain" />
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
        <div className="flex items-center gap-2 md:gap-6">
          <Button variant="ghost" size="icon" onClick={() => toggleCart(true)} className="relative text-secondary hover:bg-primary/10" data-testid="button-cart">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-primary text-white border-none">
                {cartCount}
              </Badge>
            )}
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden md:flex text-xs uppercase tracking-widest font-medium text-secondary hover:bg-primary/10 hover:text-primary">
              Logout
            </Button>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button size="sm" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-widest font-bold shadow-lg shadow-primary/30">Access</Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-secondary hover:bg-primary/10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] bg-white border-l border-primary/10">
              <div className="flex flex-col gap-2 mt-16">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-medium text-secondary hover:text-primary transition-colors duration-500">
                    Collection
                  </div>
                </Link>
                {isAuthenticated && (
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                    <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-medium text-secondary hover:text-primary transition-colors duration-500">
                      Portfolio
                    </div>
                  </Link>
                )}
                {isAuthenticated && isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <div className="py-4 px-2 text-[11px] uppercase tracking-[0.4em] font-medium text-secondary hover:text-primary transition-colors duration-500">
                      Management
                    </div>
                  </Link>
                )}
                <div className="my-8 border-t border-primary/10" />
                {isAuthenticated ? (
                  <Button variant="ghost" onClick={() => logout()} className="justify-start text-[11px] uppercase tracking-[0.4em] font-medium text-secondary hover:text-primary hover:bg-primary/10">
                    Logout
                  </Button>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full h-14 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white">Access</Button>
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
