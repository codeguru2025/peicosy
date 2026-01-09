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

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: any }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`
        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
        ${isActive 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
      `}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/90 backdrop-blur-2xl">
      <div className="container mx-auto px-6 h-24 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-6 group">
          <img src={logoUrl} alt="Peicosy" className="h-12 w-auto object-contain transition-transform duration-700 ease-in-out group-hover:scale-105" />
          <div className="flex flex-col border-l border-white/10 pl-6">
            <span className="font-serif text-2xl font-light tracking-[0.2em] uppercase text-foreground leading-none">Peicosy</span>
            <span className="text-[9px] uppercase tracking-[0.5em] text-muted-foreground font-medium mt-2">Private Client</span>
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
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    <ShoppingBag className="mr-2 w-5 h-5" /> Shop
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      <Package className="mr-2 w-5 h-5" /> My Orders
                    </Button>
                  </Link>
                )}
                {isAuthenticated && isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg">
                      <LayoutDashboard className="mr-2 w-5 h-5" /> Dashboard
                    </Button>
                  </Link>
                )}
                <div className="my-4 border-t" />
                {isAuthenticated ? (
                  <Button variant="outline" onClick={() => logout()}>
                    <LogOut className="mr-2 w-4 h-4" /> Logout
                  </Button>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Login</Button>
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
