import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useOrders } from "@/hooks/use-orders";
import { CartDrawer } from "@/components/CartDrawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Clock, Truck, CheckCircle, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Orders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const [, setLocation] = useLocation();

  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      <div className="container mx-auto px-8 py-24 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-12 bg-primary"></div>
              <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Your Archive</span>
            </div>
            <h1 className="font-serif text-5xl font-light tracking-tight">Acquisition Portfolio</h1>
            <p className="text-muted-foreground font-light tracking-wide mt-4">Track and manage your recent acquisitions.</p>
          </div>
        </div>

        <div className="space-y-8">
          {orders?.length === 0 ? (
            <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5">
              <Package className="w-20 h-20 mx-auto text-muted-foreground/20 mb-8" />
              <h3 className="font-serif text-3xl font-light mb-4 tracking-wide">No Acquisitions</h3>
              <p className="text-muted-foreground font-light tracking-wider mb-10">Your portfolio awaits its first piece.</p>
              <Button onClick={() => setLocation("/shop")} className="rounded-full px-12 h-14 text-[10px] uppercase tracking-[0.4em] font-bold" data-testid="button-start-shopping">
                Explore Collection
              </Button>
            </div>
          ) : (
            orders?.map((order: any) => (
              <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden" data-testid={`order-${order.id}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 border-b border-white/5">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-light">Portfolio #{order.id}</span>
                    <span className="font-serif text-lg font-light">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-serif text-xl font-light tracking-widest">£{order.totalAmount}</span>
                  </div>
                </div>
                <div className="p-8">
                   <div className="space-y-6">
                     {order.items?.map((item: any) => (
                       <div key={item.id} className="flex gap-6">
                         <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                           <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground/30 uppercase tracking-widest">Item</div>
                         </div>
                         <div className="flex-1 flex flex-col justify-center">
                           <p className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold mb-1">Item #{item.productId}</p>
                           <p className="text-muted-foreground font-light tracking-wider">Qty: {item.quantity} × £{item.priceAtPurchase}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-10 pt-8 border-t border-white/5 flex justify-end gap-4">
                     {order.status === 'pending_payment' && (
                       <Button className="gap-3 rounded-full px-8 text-[10px] uppercase tracking-[0.3em] font-bold" data-testid={`button-upload-${order.id}`}>
                         <Upload className="w-4 h-4" /> Submit Payment
                       </Button>
                     )}
                     <Button variant="ghost" className="rounded-full px-8 border border-white/10 text-[10px] uppercase tracking-[0.3em] font-light hover:bg-white/5" data-testid={`button-details-${order.id}`}>
                       View Details
                     </Button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_payment: "bg-primary/10 text-primary border-primary/20",
    pending_verification: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
    shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    arrived: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    completed: "bg-white/10 text-white/60 border-white/20",
  };

  const labels: Record<string, string> = {
    pending_payment: "Awaiting Payment",
    pending_verification: "Verifying",
    confirmed: "Confirmed",
    shipped: "In Transit",
    arrived: "Arrived in SA",
    completed: "Completed"
  };

  return (
    <span className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] border ${styles[status] || styles.completed}`}>
      {labels[status] || status}
    </span>
  );
}
