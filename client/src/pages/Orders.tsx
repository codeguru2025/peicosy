import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useOrders } from "@/hooks/use-orders";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Orders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const [, setLocation] = useLocation();

  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            <h1 className="font-serif text-5xl font-light tracking-tight text-secondary">Acquisition Portfolio</h1>
            <p className="text-muted-foreground font-light tracking-wide mt-4">Track and manage your recent acquisitions.</p>
          </div>
        </div>

        <div className="space-y-8">
          {orders?.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border border-border shadow-lg">
              <Package className="w-20 h-20 mx-auto text-muted-foreground/30 mb-8" />
              <h3 className="font-serif text-3xl font-light mb-4 tracking-wide text-secondary">No Acquisitions</h3>
              <p className="text-muted-foreground font-light tracking-wider mb-10">Your portfolio awaits its first piece.</p>
              <Button onClick={() => setLocation("/shop")} className="rounded-full px-12 h-14 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30" data-testid="button-start-shopping">
                Explore Collection
              </Button>
            </div>
          ) : (
            orders?.map((order: any) => (
              <div key={order.id} className="bg-white border border-border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500" data-testid={`order-${order.id}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 border-b border-border bg-muted/30">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-light">Portfolio #{order.id}</span>
                    <span className="font-serif text-lg font-light text-secondary">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-serif text-xl font-light tracking-widest text-secondary">£{order.totalAmount}</span>
                  </div>
                </div>
                <div className="p-8">
                   <div className="space-y-6">
                     {order.items?.map((item: any) => (
                       <div key={item.id} className="flex gap-6">
                         <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0">
                           <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground/50 uppercase tracking-widest">Item</div>
                         </div>
                         <div className="flex-1 flex flex-col justify-center">
                           <p className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold mb-1">Item #{item.productId}</p>
                           <p className="text-muted-foreground font-light tracking-wider">Qty: {item.quantity} × £{item.priceAtPurchase}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-10 pt-8 border-t border-border flex justify-end gap-4">
                     {order.status === 'pending_payment' && (
                       <Button className="gap-3 rounded-full px-8 text-[10px] uppercase tracking-[0.3em] font-bold bg-primary hover:bg-primary/90 text-white" data-testid={`button-upload-${order.id}`}>
                         <Upload className="w-4 h-4" /> Submit Payment
                       </Button>
                     )}
                     <Button variant="outline" className="rounded-full px-8 border-border text-[10px] uppercase tracking-[0.3em] font-medium text-secondary hover:bg-secondary hover:text-white hover:border-secondary" data-testid={`button-details-${order.id}`}>
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
    pending_payment: "bg-primary/10 text-primary border-primary/30",
    pending_verification: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    confirmed: "bg-green-500/10 text-green-600 border-green-500/30",
    shipped: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    arrived: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    completed: "bg-secondary/10 text-secondary border-secondary/30",
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
