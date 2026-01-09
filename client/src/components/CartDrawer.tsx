import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { useExchangeRate, formatZAR } from "@/hooks/use-shipping";

export function CartDrawer() {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, total } = useCart();
  const [, setLocation] = useLocation();
  const exchangeRateQuery = useExchangeRate();
  const exchangeRate = exchangeRateQuery.data?.rate || 23.50;

  const handleCheckout = () => {
    toggleCart(false);
    setLocation("/checkout");
  };

  const totalGBP = total();
  const totalZAR = totalGBP * exchangeRate;

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-white border-l border-border">
        <SheetHeader className="mb-8">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 bg-primary"></div>
            <SheetTitle className="font-serif text-3xl font-light tracking-wide text-secondary">Your Portfolio</SheetTitle>
          </div>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <ShoppingBagIcon className="w-20 h-20 mb-8 text-muted-foreground/20" />
            <p className="text-xl font-serif font-light tracking-wide mb-2 text-secondary">Empty</p>
            <p className="text-sm font-light tracking-wider text-muted-foreground">Your acquisition list awaits.</p>
            <Button variant="outline" className="mt-10 rounded-full px-10 border-border text-[10px] uppercase tracking-[0.3em] text-secondary hover:bg-secondary hover:text-white hover:border-secondary" onClick={() => toggleCart(false)} data-testid="button-continue-shopping">
              Explore Collection
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-6">
              <div className="space-y-8">
                {items.map((item) => {
                  const itemPriceGBP = Number(item.product.price) * item.quantity;
                  const itemPriceZAR = itemPriceGBP * exchangeRate;
                  
                  return (
                    <div key={item.product.id} className="flex gap-6" data-testid={`cart-item-${item.product.id}`}>
                      <div className="h-28 w-28 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-[9px] font-bold text-primary uppercase tracking-[0.4em] mb-1">{item.product.brand}</p>
                          <h4 className="font-serif font-light text-lg line-clamp-1 tracking-wide text-secondary">{item.product.name}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 border border-border rounded-full px-4 py-2">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 text-secondary hover:text-primary transition-colors duration-300"
                              data-testid={`button-decrease-${item.product.id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm w-5 text-center font-medium text-secondary">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 text-secondary hover:text-primary transition-colors duration-300"
                              data-testid={`button-increase-${item.product.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="font-medium tracking-widest text-sm text-secondary block">{formatZAR(itemPriceZAR)}</span>
                              <span className="text-[10px] text-muted-foreground">£{itemPriceGBP.toFixed(2)}</span>
                            </div>
                            <button 
                              onClick={() => removeItem(item.product.id)}
                              className="text-muted-foreground hover:text-primary transition-colors duration-300"
                              data-testid={`button-remove-${item.product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="border-t border-border pt-8 space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif font-light tracking-wide text-secondary">Subtotal</span>
                <div className="text-right">
                  <span className="text-xl font-serif font-light tracking-wide text-secondary block">{formatZAR(totalZAR)}</span>
                  <span className="text-sm text-muted-foreground">£{totalGBP.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center font-light">
                Duties and shipping calculated at checkout
              </p>
              <Button size="lg" className="w-full rounded-full h-16 gap-3 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30" onClick={handleCheckout} data-testid="button-checkout">
                Proceed to Acquisition <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
