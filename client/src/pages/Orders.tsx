import { useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Upload, FileCheck, Loader2, MapPin, Truck, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadingOrderId) return;

    setIsUploading(true);
    try {
      // Get presigned URL for upload
      const presignedRes = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `payment-proof-${uploadingOrderId}-${Date.now()}.${selectedFile.name.split('.').pop()}`,
          size: selectedFile.size,
          contentType: selectedFile.type,
        }),
        credentials: 'include',
      });

      if (!presignedRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, objectPath } = await presignedRes.json();

      // Upload file directly to the presigned URL
      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      // Construct the public URL for the uploaded file
      const publicUrl = `${window.location.origin}${objectPath}`;

      // Update order status with proof URL
      updateStatus({
        id: uploadingOrderId,
        status: 'pending_verification',
        proofOfPaymentUrl: publicUrl,
      }, {
        onSuccess: () => {
          toast({ title: "Payment Submitted", description: "Your proof of payment has been uploaded for verification." });
          setUploadingOrderId(null);
          setSelectedFile(null);
        }
      });

    } catch (error) {
      toast({ title: "Upload Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const getOrderProgress = (status: string) => {
    const steps = ['pending_payment', 'pending_verification', 'confirmed', 'shipped', 'arrived', 'completed'];
    const currentIndex = steps.indexOf(status);
    return { steps, currentIndex };
  };

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
            orders?.map((order: any) => {
              const { steps, currentIndex } = getOrderProgress(order.status);
              
              return (
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

                  {/* Order Progress Tracker */}
                  <div className="px-8 py-6 border-b border-border bg-muted/10">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                      {[
                        { key: 'pending_payment', icon: Upload, label: 'Payment' },
                        { key: 'pending_verification', icon: FileCheck, label: 'Verification' },
                        { key: 'confirmed', icon: CheckCircle, label: 'Confirmed' },
                        { key: 'shipped', icon: Truck, label: 'In Transit' },
                        { key: 'arrived', icon: MapPin, label: 'Arrived' },
                      ].map((step, idx) => {
                        const isCompleted = steps.indexOf(order.status) >= steps.indexOf(step.key);
                        const isCurrent = order.status === step.key;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                              <step.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[8px] uppercase tracking-[0.2em] font-bold ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="space-y-6">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-6">
                          <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground/50 uppercase tracking-widest">Item</div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold mb-1">{item.product?.brand || 'Item'}</p>
                            <p className="font-serif text-lg text-secondary">{item.product?.name || `Product #${item.productId}`}</p>
                            <p className="text-muted-foreground font-light tracking-wider">Qty: {item.quantity} × £{item.priceAtPurchase}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mt-8 p-6 bg-muted/30 rounded-2xl">
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-4">Landed Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping ({order.shippingMethod})</span>
                          <span className="text-secondary">£{order.shippingCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customs & Duties</span>
                          <span className="text-secondary">£{order.customsDuty}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-border">
                          <span className="text-secondary">Total</span>
                          <span className="text-secondary">£{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                     
                    <div className="mt-10 pt-8 border-t border-border flex flex-wrap justify-end gap-4">
                      {order.status === 'pending_payment' && (
                        <Button 
                          className="gap-3 rounded-full px-8 text-[10px] uppercase tracking-[0.3em] font-bold bg-primary hover:bg-primary/90 text-white" 
                          onClick={() => setUploadingOrderId(order.id)}
                          data-testid={`button-upload-${order.id}`}
                        >
                          <Upload className="w-4 h-4" /> Submit Payment
                        </Button>
                      )}
                      {order.proofOfPaymentUrl && (
                        <Button variant="outline" className="gap-2 rounded-full px-6 border-green-500/30 text-green-600" asChild>
                          <a href={order.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer">
                            <FileCheck className="w-4 h-4" /> Payment Submitted
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Payment Dialog */}
      <Dialog open={!!uploadingOrderId} onOpenChange={() => { setUploadingOrderId(null); setSelectedFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light text-secondary">Submit Proof of Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground">
              Please upload a screenshot or PDF of your payment confirmation. We'll verify your payment within 24 hours.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
            
            <div 
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileCheck className="w-12 h-12 mx-auto text-green-500" />
                  <p className="text-sm font-medium text-secondary">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Click to select file</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG, or PDF up to 10MB</p>
                </div>
              )}
            </div>

            <Button 
              className="w-full rounded-full h-12 bg-primary hover:bg-primary/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              data-testid="button-confirm-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                'Submit Payment Proof'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    ready_collection: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    completed: "bg-secondary/10 text-secondary border-secondary/30",
  };

  const labels: Record<string, string> = {
    pending_payment: "Awaiting Payment",
    pending_verification: "Verifying",
    confirmed: "Confirmed",
    shipped: "In Transit",
    arrived: "Arrived in SA",
    ready_collection: "Ready for Collection",
    completed: "Completed"
  };

  return (
    <span className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] border ${styles[status] || styles.completed}`}>
      {labels[status] || status}
    </span>
  );
}
