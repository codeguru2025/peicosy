import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Menu, X, Package, Shield, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

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
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-tr-xl rounded-bl-xl flex items-center justify-center text-primary-foreground font-serif font-bold text-lg group-hover:rotate-12 transition-transform">
            P
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-ink">Peicosy</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/shop" icon={ShoppingBag}>Shop</NavLink>
          {isAuthenticated && <NavLink href="/orders" icon={Package}>My Orders</NavLink>}
          {isAuthenticated && isAdmin && (
             <NavLink href="/admin" icon={LayoutDashboard}>Admin</NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => toggleCart(true)} className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-2 border-background">
                {cartCount}
              </Badge>
            )}
          </Button>

          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button size="sm" className="rounded-full px-6 font-medium">Login</Button>
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
