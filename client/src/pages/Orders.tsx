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
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h1 className="font-serif text-3xl font-bold">My Orders</h1>
             <p className="text-muted-foreground">Track and manage your recent purchases.</p>
          </div>
        </div>

        <div className="space-y-6">
          {orders?.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Looks like you haven't made any purchases yet.</p>
              <Button onClick={() => setLocation("/shop")}>Start Shopping</Button>
            </div>
          ) : (
            orders?.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Order #{order.id}</span>
                    <span className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-bold text-lg">£{order.totalAmount}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-4">
                     {order.items?.map((item: any) => (
                       <div key={item.id} className="flex gap-4">
                         <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                           {/* Assuming item.product exists in the join */}
                           {/* <img src={item.product?.imageUrl} className="w-full h-full object-cover" /> */}
                           <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">Img</div>
                         </div>
                         <div className="flex-1">
                           <h4 className="font-medium">Product ID: {item.productId}</h4>
                           <p className="text-sm text-muted-foreground">Qty: {item.quantity} x £{item.priceAtPurchase}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Action Buttons based on status */}
                   <div className="mt-6 pt-6 border-t flex justify-end gap-2">
                     {order.status === 'pending_payment' && (
                       <Button variant="default" className="gap-2">
                         <Upload className="w-4 h-4" /> Upload Proof of Payment
                       </Button>
                     )}
                     <Button variant="outline">View Details</Button>
                   </div>
                </CardContent>
              </Card>
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
    pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending_verification: "bg-blue-100 text-blue-800 border-blue-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    arrived: "bg-indigo-100 text-indigo-800 border-indigo-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const labels: Record<string, string> = {
    pending_payment: "Pending Payment",
    pending_verification: "Verifying",
    confirmed: "Confirmed",
    shipped: "Shipped",
    arrived: "Arrived in SA",
    completed: "Completed"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.completed}`}>
      {labels[status] || status}
    </span>
  );
}
