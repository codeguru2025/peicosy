import { useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Upload, FileCheck, Loader2, MapPin, Truck, CheckCircle, CreditCard, Smartphone, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods, usePaynowWebPayment, usePaynowMobilePayment } from "@/hooks/use-payment";

export default function Orders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: paymentMethods } = usePaymentMethods();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutate: initiatePaynowWeb, isPending: isInitiatingWeb } = usePaynowWebPayment();
  const { mutate: initiatePaynowMobile, isPending: isInitiatingMobile } = usePaynowMobilePayment();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  const [paynowOrderId, setPaynowOrderId] = useState<number | null>(null);
  const [paynowMethod, setPaynowMethod] = useState<'web' | 'ecocash' | 'onemoney'>('web');
  const [phoneNumber, setPhoneNumber] = useState('');
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

      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      const publicUrl = `${window.location.origin}${objectPath}`;

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
      toast({ title: "Upload Unsuccessful", description: "We couldn't upload your payment proof. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaynowPayment = () => {
    if (!paynowOrderId) return;

    if (paynowMethod === 'web') {
      initiatePaynowWeb(paynowOrderId, {
        onSuccess: (data: any) => {
          if (data.success && data.redirectUrl) {
            window.open(data.redirectUrl, '_blank');
            toast({ 
              title: "Payment Started", 
              description: "Complete your payment in the new tab. Your order will be updated automatically." 
            });
            setPaynowOrderId(null);
          } else {
            toast({ 
              title: "Payment Issue", 
              description: data.message || "Unable to start payment. Please try again.", 
              variant: "destructive" 
            });
          }
        },
        onError: () => {
          toast({ 
            title: "Payment Issue", 
            description: "Something went wrong. Please try again or use another payment method.", 
            variant: "destructive" 
          });
        }
      });
    } else {
      if (!phoneNumber || phoneNumber.length < 9) {
        toast({ 
          title: "Phone Number Required", 
          description: "Please enter a valid mobile number.", 
          variant: "destructive" 
        });
        return;
      }

      initiatePaynowMobile({
        orderId: paynowOrderId,
        phone: phoneNumber,
        method: paynowMethod as 'ecocash' | 'onemoney',
      }, {
        onSuccess: (data: any) => {
          if (data.success) {
            toast({ 
              title: "Payment Request Sent", 
              description: data.instructions || `Check your ${paynowMethod === 'ecocash' ? 'Ecocash' : 'OneMoney'} phone for a payment prompt.`
            });
            setPaynowOrderId(null);
            setPhoneNumber('');
          } else {
            toast({ 
              title: "Payment Issue", 
              description: data.message || "Unable to send payment request. Please try again.", 
              variant: "destructive" 
            });
          }
        },
        onError: () => {
          toast({ 
            title: "Payment Issue", 
            description: "Something went wrong. Please try again.", 
            variant: "destructive" 
          });
        }
      });
    }
  };

  const getOrderProgress = (status: string) => {
    const steps = ['pending_payment', 'pending_verification', 'confirmed', 'shipped', 'arrived', 'completed'];
    const currentIndex = steps.indexOf(status);
    return { steps, currentIndex };
  };

  const isZimbabweOrder = (order: any) => {
    const address = order.shippingAddress;
    return address?.country === 'Zimbabwe';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 md:mb-16 gap-6 md:gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="h-[1px] w-12 bg-primary"></div>
              <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Your Archive</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light tracking-tight text-secondary">Acquisition Portfolio</h1>
            <p className="text-muted-foreground font-light tracking-wide mt-4">Track and manage your recent acquisitions.</p>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {orders?.length === 0 ? (
            <div className="text-center py-20 md:py-32 bg-white rounded-3xl border border-border shadow-lg">
              <Package className="w-16 md:w-20 h-16 md:h-20 mx-auto text-muted-foreground/30 mb-6 md:mb-8" />
              <h3 className="font-serif text-2xl md:text-3xl font-light mb-4 tracking-wide text-secondary">No Acquisitions</h3>
              <p className="text-muted-foreground font-light tracking-wider mb-8 md:mb-10">Your portfolio awaits its first piece.</p>
              <Button onClick={() => setLocation("/shop")} className="rounded-full px-10 md:px-12 h-12 md:h-14 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30" data-testid="button-start-shopping">
                Explore Collection
              </Button>
            </div>
          ) : (
            orders?.map((order: any) => {
              const { steps, currentIndex } = getOrderProgress(order.status);
              const isZim = isZimbabweOrder(order);
              
              return (
                <div key={order.id} className="bg-white border border-border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500" data-testid={`order-${order.id}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-6 md:p-8 border-b border-border bg-muted/30">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-light">Portfolio #{order.id}</span>
                        {isZim && (
                          <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Zimbabwe</span>
                        )}
                      </div>
                      <span className="font-serif text-lg font-light text-secondary">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-serif text-lg md:text-xl font-light tracking-widest text-secondary">£{order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="px-6 md:px-8 py-4 md:py-6 border-b border-border bg-muted/10 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[400px] max-w-2xl mx-auto">
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
                            <div className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                              <step.icon className="w-3 md:w-4 h-3 md:h-4" />
                            </div>
                            <span className={`text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-bold ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="space-y-4 md:space-y-6">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 md:gap-6">
                          <div className="w-16 md:w-20 h-16 md:h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground/50 uppercase tracking-widest">Item</div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold mb-1">{item.product?.brand || 'Item'}</p>
                            <p className="font-serif text-base md:text-lg text-secondary">{item.product?.name || `Product #${item.productId}`}</p>
                            <p className="text-muted-foreground font-light tracking-wider text-sm">Qty: {item.quantity} × £{item.priceAtPurchase}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 md:mt-8 p-4 md:p-6 bg-muted/30 rounded-2xl">
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
                     
                    <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-border flex flex-wrap justify-end gap-3 md:gap-4">
                      {order.status === 'pending_payment' && (
                        <>
                          {isZim && paymentMethods?.paynow && (
                            <Button 
                              className="gap-2 md:gap-3 rounded-full px-6 md:px-8 text-[10px] uppercase tracking-[0.3em] font-bold bg-green-600 hover:bg-green-700 text-white" 
                              onClick={() => setPaynowOrderId(order.id)}
                              data-testid={`button-paynow-${order.id}`}
                            >
                              <Smartphone className="w-4 h-4" /> Pay with Paynow
                            </Button>
                          )}
                          <Button 
                            variant={isZim ? "outline" : "default"}
                            className={`gap-2 md:gap-3 rounded-full px-6 md:px-8 text-[10px] uppercase tracking-[0.3em] font-bold ${!isZim ? 'bg-primary hover:bg-primary/90 text-white' : ''}`}
                            onClick={() => setUploadingOrderId(order.id)}
                            data-testid={`button-upload-${order.id}`}
                          >
                            <Upload className="w-4 h-4" /> {isZim ? 'Bank Transfer' : 'Submit Payment'}
                          </Button>
                        </>
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

      <Dialog open={!!paynowOrderId} onOpenChange={() => { setPaynowOrderId(null); setPhoneNumber(''); setPaynowMethod('web'); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light text-secondary">Pay with Paynow</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground">
              Choose your preferred payment method for Zimbabwe.
            </p>
            
            <div className="space-y-3">
              <div 
                className={`flex items-center gap-4 border p-4 rounded-xl cursor-pointer transition-all ${paynowMethod === 'web' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                onClick={() => setPaynowMethod('web')}
                data-testid="paynow-option-web"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paynowMethod === 'web' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {paynowMethod === 'web' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-secondary">Web Checkout</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Ecocash via browser</p>
                </div>
              </div>
              
              <div 
                className={`flex items-center gap-4 border p-4 rounded-xl cursor-pointer transition-all ${paynowMethod === 'ecocash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                onClick={() => setPaynowMethod('ecocash')}
                data-testid="paynow-option-ecocash"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paynowMethod === 'ecocash' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {paynowMethod === 'ecocash' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-secondary">Ecocash</p>
                  <p className="text-xs text-muted-foreground">Pay directly from your phone</p>
                </div>
              </div>
              
              <div 
                className={`flex items-center gap-4 border p-4 rounded-xl cursor-pointer transition-all ${paynowMethod === 'onemoney' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                onClick={() => setPaynowMethod('onemoney')}
                data-testid="paynow-option-onemoney"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paynowMethod === 'onemoney' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {paynowMethod === 'onemoney' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-secondary">OneMoney</p>
                  <p className="text-xs text-muted-foreground">Pay directly from your phone</p>
                </div>
              </div>
            </div>

            {(paynowMethod === 'ecocash' || paynowMethod === 'onemoney') && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
                  Mobile Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 0777123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 rounded-xl"
                  data-testid="input-phone"
                />
              </div>
            )}

            <Button 
              className="w-full rounded-full h-12 bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase tracking-[0.3em] font-bold gap-2"
              onClick={handlePaynowPayment}
              disabled={isInitiatingWeb || isInitiatingMobile}
              data-testid="button-confirm-paynow"
            >
              {(isInitiatingWeb || isInitiatingMobile) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : paynowMethod === 'web' ? (
                <>
                  <ExternalLink className="w-4 h-4" /> Continue to Paynow
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" /> Send Payment Request
                </>
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
    arrived: "Arrived",
    ready_collection: "Ready for Collection",
    completed: "Completed"
  };

  return (
    <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] border ${styles[status] || styles.completed}`}>
      {labels[status] || status}
    </span>
  );
}
