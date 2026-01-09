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
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <h1 className="font-serif text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...register("firstName")} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" {...register("street")} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register("city")} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input id="zip" {...register("zip")} required />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <Label>Shipping Method</Label>
                    <RadioGroup defaultValue="air" {...register("shippingMethod")}>
                      <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="air" id="air" />
                        <Label htmlFor="air" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span>Air Freight (5-7 days)</span>
                            <span className="font-bold">£25.00</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="sea" id="sea" />
                        <Label htmlFor="sea" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span>Sea Freight (4-6 weeks)</span>
                            <span className="font-bold">£10.00</span>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product.name} x {item.quantity}</span>
                    <span>£{(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>£{total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping (Est.)</span>
                  <span>£25.00</span> 
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customs & Duties (Est.)</span>
                  <span>£15.00</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg font-serif">
                  <span>Total</span>
                  <span>£{(total() + 40).toFixed(2)}</span>
                </div>
                
                <Button 
                  className="w-full h-12 text-lg mt-4 bg-primary hover:bg-primary/90" 
                  form="checkout-form"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "Processing..." : "Place Order"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  By placing this order, you agree to our Terms of Service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
