import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useSearch } from "wouter";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

export default function PaymentCancel() {
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
              <div className="p-6 bg-red-100 rounded-full">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-light text-secondary">Payment Cancelled</h1>
              <p className="text-muted-foreground">
                Your payment was not completed. Don't worry, your order is still saved.
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  Order Reference: <span className="font-bold text-secondary">#{orderId}</span>
                </p>
              )}
            </div>
            
            <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-center gap-3 text-secondary">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium">You can still complete your order</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Visit your orders page to retry payment or upload proof of bank transfer.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button
                className="w-full h-14 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white"
                onClick={() => setLocation("/orders")}
                data-testid="button-view-orders"
              >
                Go to My Orders
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold"
                onClick={() => setLocation("/shop")}
                data-testid="button-back-to-shop"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to Shop
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
