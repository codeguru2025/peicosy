import { useCart } from "@/hooks/use-cart";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCalculateLandedCost, formatZAR } from "@/hooks/use-shipping";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2, Plane, Ship, Info, MapPin } from "lucide-react";

type Country = 'ZA' | 'ZW';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { mutate: calculateCost, data: costData, isPending: isCalculating } = useCalculateLandedCost();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { register, handleSubmit } = useForm<{
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    zip: string;
  }>();
  
  const [shippingMethod, setShippingMethod] = useState<'air' | 'sea'>('air');
  const [country, setCountry] = useState<Country>('ZA');

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/shop");
    }
  }, [items, setLocation]);

  useEffect(() => {
    if (items.length > 0) {
      const subtotal = total();
      const categories = items.map(i => i.product.category);
      const category = categories[0] || 'general';
      
      calculateCost({ subtotal, method: shippingMethod, category });
    }
  }, [items, shippingMethod, total]);

  if (!isAuthenticated) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
         <h1 className="text-2xl font-serif font-bold mb-4 text-secondary">Please login to checkout</h1>
         <Button onClick={() => setLocation("/login")} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">Login</Button>
       </div>
     );
  }

  const onSubmit = (data: any) => {
    createOrder({
      items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      shippingMethod: shippingMethod,
      shippingAddress: {
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: country === 'ZA' ? 'South Africa' : 'Zimbabwe'
      }
    }, {
      onSuccess: () => {
        clearCart();
        setLocation("/orders");
      }
    });
  };

  const shippingCost = costData?.shippingCost ?? (shippingMethod === 'air' ? 50 : 20);
  const customsDuty = costData?.customsDuty ?? (total() * 0.45);
  const grandTotal = costData?.total ?? (total() + shippingCost + customsDuty);
  
  const subtotalZAR = costData?.subtotalZAR ?? 0;
  const shippingCostZAR = costData?.shippingCostZAR ?? 0;
  const customsDutyZAR = costData?.customsDutyZAR ?? 0;
  const grandTotalZAR = costData?.totalZAR ?? 0;
  const exchangeRate = costData?.exchangeRate ?? 23.50;

  const formatCurrency = (amount: number) => {
    if (country === 'ZW') {
      return `$${amount.toFixed(2)} USD`;
    }
    return formatZAR(amount);
  };

  const usdRate = 1.27;
  const displaySubtotal = country === 'ZW' ? total() * usdRate : subtotalZAR || total() * exchangeRate;
  const displayShipping = country === 'ZW' ? shippingCost * usdRate : shippingCostZAR || shippingCost * exchangeRate;
  const displayDuty = country === 'ZW' ? customsDuty * usdRate : customsDutyZAR || customsDuty * exchangeRate;
  const displayTotal = country === 'ZW' ? grandTotal * usdRate : grandTotalZAR || grandTotal * exchangeRate;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Finalize</span>
        </div>
        <h1 className="font-serif text-3xl md:text-5xl font-light mb-12 md:mb-16 tracking-tight text-secondary">Complete Acquisition</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16">
          <div className="lg:col-span-2 space-y-10 md:space-y-12">
            <div className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Delivery Region</h2>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`flex items-center gap-4 border p-5 rounded-2xl cursor-pointer transition-all duration-500 ${country === 'ZA' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white hover:border-primary/30 hover:shadow-md'}`}
                  onClick={() => setCountry('ZA')}
                  data-testid="option-south-africa"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${country === 'ZA' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                    {country === 'ZA' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-serif text-sm md:text-base font-light text-secondary">South Africa</span>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">PayFast • Bank Transfer</p>
                    </div>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-4 border p-5 rounded-2xl cursor-pointer transition-all duration-500 ${country === 'ZW' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white hover:border-primary/30 hover:shadow-md'}`}
                  onClick={() => setCountry('ZW')}
                  data-testid="option-zimbabwe"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${country === 'ZW' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                    {country === 'ZW' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <div>
                      <span className="font-serif text-sm md:text-base font-light text-secondary">Zimbabwe</span>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Paynow • Ecocash</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Delivery Address</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">First Name</Label>
                    <Input id="firstName" {...register("firstName")} required className="h-12 md:h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm" data-testid="input-firstname" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Last Name</Label>
                    <Input id="lastName" {...register("lastName")} required className="h-12 md:h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm" data-testid="input-lastname" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="street" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Street Address</Label>
                  <Input id="street" {...register("street")} required className="h-12 md:h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm" data-testid="input-street" />
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="city" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">City</Label>
                    <Input id="city" {...register("city")} required className="h-12 md:h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm" data-testid="input-city" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="zip" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Postal Code</Label>
                    <Input id="zip" {...register("zip")} required className="h-12 md:h-14 rounded-xl border-border bg-white focus:border-primary shadow-sm" data-testid="input-zip" />
                  </div>
                </div>
                
                <Separator className="my-8 md:my-12 bg-border" />
                
                <div className="space-y-6">
                  <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Logistics Method</h2>
                  <div className="space-y-4">
                    <div 
                      className={`flex items-center space-x-4 border p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-500 ${shippingMethod === 'air' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white hover:border-primary/30 hover:shadow-md'}`}
                      onClick={() => setShippingMethod('air')}
                      data-testid="option-air"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'air' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                        {shippingMethod === 'air' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Plane className="w-5 h-5 text-primary" />
                            <div>
                              <span className="font-serif text-base md:text-lg font-light text-secondary">Air Freight</span>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">5-7 business days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium tracking-widest text-primary text-sm md:text-base">
                              {country === 'ZW' ? `$${(50 * usdRate).toFixed(2)}` : formatZAR(50 * exchangeRate)}
                            </span>
                            <p className="text-[10px] text-muted-foreground">£50.00</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`flex items-center space-x-4 border p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-500 ${shippingMethod === 'sea' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white hover:border-primary/30 hover:shadow-md'}`}
                      onClick={() => setShippingMethod('sea')}
                      data-testid="option-sea"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'sea' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                        {shippingMethod === 'sea' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Ship className="w-5 h-5 text-secondary/60" />
                            <div>
                              <span className="font-serif text-base md:text-lg font-light text-secondary">Sea Freight</span>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">4-6 weeks</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium tracking-widest text-primary text-sm md:text-base">
                              {country === 'ZW' ? `$${(20 * usdRate).toFixed(2)}` : formatZAR(20 * exchangeRate)}
                            </span>
                            <p className="text-[10px] text-muted-foreground">£20.00</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white border border-border rounded-3xl p-6 md:p-10 shadow-lg">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-8">Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-light">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium tracking-widest text-primary">
                      {country === 'ZW' 
                        ? `$${(Number(item.product.price) * item.quantity * usdRate).toFixed(2)}`
                        : formatZAR(Number(item.product.price) * item.quantity * exchangeRate)
                      }
                    </span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-8 bg-border" />
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-medium tracking-widest text-secondary" data-testid="text-subtotal">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      country === 'ZW' ? `$${displaySubtotal.toFixed(2)}` : formatZAR(displaySubtotal)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-light flex items-center gap-2">
                    Logistics
                    <span className="text-[9px] uppercase text-primary">{shippingMethod === 'air' ? 'Air' : 'Sea'}</span>
                  </span>
                  <span className="font-medium tracking-widest text-secondary" data-testid="text-shipping">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      country === 'ZW' ? `$${displayShipping.toFixed(2)}` : formatZAR(displayShipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-light flex items-center gap-2">
                    Duties & Taxes
                    <Info className="w-3 h-3 text-muted-foreground/50" />
                  </span>
                  <span className="font-medium tracking-widest text-secondary" data-testid="text-duties">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      country === 'ZW' ? `$${displayDuty.toFixed(2)}` : formatZAR(displayDuty)
                    )}
                  </span>
                </div>
              </div>
              
              <Separator className="my-8 bg-border" />
              
              <div className="flex justify-between font-serif text-xl md:text-2xl font-bold tracking-wide mb-2 text-primary">
                <span>Total</span>
                <span data-testid="text-total">
                  {isCalculating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    country === 'ZW' ? `$${displayTotal.toFixed(2)}` : formatZAR(displayTotal)
                  )}
                </span>
              </div>
              <div className="flex justify-end text-sm text-muted-foreground mb-4">
                <span>£{grandTotal.toFixed(2)} GBP</span>
              </div>
              
              <p className="text-[9px] text-muted-foreground mb-8 p-3 bg-muted/50 rounded-xl">
                <span className="font-bold uppercase tracking-wider">Landed Cost</span> includes product value, shipping, and estimated {country === 'ZA' ? 'South African' : 'Zimbabwean'} import duties.
              </p>
              
              <Button 
                className="w-full h-14 md:h-16 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30" 
                form="checkout-form"
                type="submit"
                disabled={isPending || isCalculating}
                data-testid="button-place-order"
              >
                {isPending ? "Processing..." : "Confirm Acquisition"}
              </Button>
              
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 text-center mt-6 font-light">
                {country === 'ZW' 
                  ? "Pay via Paynow, Ecocash, or OneMoney"
                  : "Pay via PayFast or bank transfer"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
