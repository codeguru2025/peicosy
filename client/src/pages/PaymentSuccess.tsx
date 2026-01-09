import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const orderId = params.get("order_id");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-8 py-24 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg border-border shadow-2xl text-center">
          <CardContent className="p-12 space-y-8">
            <div className="flex justify-center">
              <div className="p-6 bg-green-100 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-light text-secondary">Payment Successful</h1>
              <p className="text-muted-foreground">
                Thank you for your order! Your payment has been processed successfully.
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  Order Reference: <span className="font-bold text-secondary">#{orderId}</span>
                </p>
              )}
            </div>
            
            <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-center gap-3 text-secondary">
                <Package className="w-5 h-5 text-primary" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Your order is being prepared for shipping</li>
                <li>• You'll receive tracking information via email</li>
                <li>• Estimated delivery: 5-7 business days (Air) or 4-6 weeks (Sea)</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button
                className="w-full h-14 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white"
                onClick={() => setLocation("/orders")}
                data-testid="button-view-orders"
              >
                View My Orders <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold"
                onClick={() => setLocation("/shop")}
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
