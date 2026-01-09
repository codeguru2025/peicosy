import { useCart } from "@/hooks/use-cart";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCreateOrder } from "@/hooks/use-orders";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/shop");
    }
  }, [items, setLocation]);

  if (!isAuthenticated) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4">
         <h1 className="text-2xl font-serif font-bold mb-4">Please login to checkout</h1>
         <Button onClick={() => setLocation("/login")}>Login</Button>
       </div>
     );
  }

  const onSubmit = (data: any) => {
    createOrder({
      items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      shippingMethod: data.shippingMethod,
      shippingAddress: {
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: 'South Africa'
      }
    }, {
      onSuccess: () => {
        clearCart();
        setLocation("/orders");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-8 py-24 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Finalize</span>
        </div>
        <h1 className="font-serif text-5xl font-light mb-16 tracking-tight">Complete Acquisition</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-8">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Delivery Address</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground">First Name</Label>
                    <Input id="firstName" {...register("firstName")} required className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/30" data-testid="input-firstname" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground">Last Name</Label>
                    <Input id="lastName" {...register("lastName")} required className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/30" data-testid="input-lastname" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="street" className="text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground">Street Address</Label>
                  <Input id="street" {...register("street")} required className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/30" data-testid="input-street" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="city" className="text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground">City</Label>
                    <Input id="city" {...register("city")} required className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/30" data-testid="input-city" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="zip" className="text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground">Postal Code</Label>
                    <Input id="zip" {...register("zip")} required className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/30" data-testid="input-zip" />
                  </div>
                </div>
                
                <Separator className="my-12 bg-white/5" />
                
                <div className="space-y-6">
                  <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">Logistics Method</h2>
                  <RadioGroup defaultValue="air" {...register("shippingMethod")}>
                    <div className="flex items-center space-x-4 border border-white/10 p-6 rounded-2xl cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all duration-500">
                      <RadioGroupItem value="air" id="air" data-testid="radio-air" />
                      <Label htmlFor="air" className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-serif text-lg font-light">Air Freight</span>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">5-7 business days</p>
                          </div>
                          <span className="font-light tracking-widest">£25.00</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-4 border border-white/10 p-6 rounded-2xl cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all duration-500">
                      <RadioGroupItem value="sea" id="sea" data-testid="radio-sea" />
                      <Label htmlFor="sea" className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-serif text-lg font-light">Sea Freight</span>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">4-6 weeks</p>
                          </div>
                          <span className="font-light tracking-widest">£10.00</span>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </form>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-8">Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-light">{item.product.name} × {item.quantity}</span>
                    <span className="font-light tracking-widest">£{(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-8 bg-white/5" />
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-light tracking-widest">£{total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Logistics</span>
                  <span className="font-light tracking-widest">£25.00</span> 
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Duties & Taxes</span>
                  <span className="font-light tracking-widest">£15.00</span>
                </div>
              </div>
              
              <Separator className="my-8 bg-white/5" />
              
              <div className="flex justify-between font-serif text-2xl font-light tracking-wide mb-10">
                <span>Total</span>
                <span>£{(total() + 40).toFixed(2)}</span>
              </div>
              
              <Button 
                className="w-full h-16 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-500 hover:scale-[1.02]" 
                form="checkout-form"
                type="submit"
                disabled={isPending}
                data-testid="button-place-order"
              >
                {isPending ? "Processing..." : "Confirm Acquisition"}
              </Button>
              
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40 text-center mt-6 font-light">
                By proceeding, you accept our terms of service.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
