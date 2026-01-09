import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useCalculateLandedCost } from "@/hooks/use-shipping";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { ShoppingBag, ArrowLeft, Truck, Shield, Globe, Minus, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductDetails() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const { data: product, isLoading } = useProduct(productId);
  const { mutate: calculateCost, data: costData, isPending: isCalculating } = useCalculateLandedCost();
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);

  // Calculate landed cost when product loads
  useEffect(() => {
    if (product) {
      calculateCost({
        subtotal: Number(product.price),
        method: 'air',
        category: product.category,
      });
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-3xl text-secondary mb-4">Product Not Found</h1>
            <Button onClick={() => setLocation("/shop")} className="rounded-full">Back to Shop</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  // Use API calculated landed cost or fallback to estimates
  const shippingEstimate = costData?.shippingCost ?? 50;
  const dutyEstimate = costData?.customsDuty ?? (Number(product.price) * 0.45);
  const landedCost = costData?.total ?? (Number(product.price) + shippingEstimate + dutyEstimate);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      <div className="container mx-auto px-8 py-12 flex-1">
        <button 
          onClick={() => setLocation("/shop")} 
          className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Back to Collection</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute top-6 left-6">
              <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[9px] uppercase tracking-[0.4em] font-bold text-secondary">
                {product.category}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold mb-3">{product.brand}</p>
              <h1 className="font-serif text-4xl lg:text-5xl font-light text-secondary tracking-tight mb-6">{product.name}</h1>
              <p className="text-muted-foreground font-light leading-relaxed tracking-wide">{product.description}</p>
            </div>

            <div className="border-t border-b border-border py-8 space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-4xl text-secondary">£{product.price}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">GBP</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Stock: <span className={`font-medium ${Number(product.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {Number(product.stock) > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </p>
            </div>

            {/* Landed Cost Preview */}
            <div className="bg-muted/30 border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold flex items-center gap-2">
                <Globe className="w-4 h-4" /> Estimated Landed Cost to SA
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="text-secondary">£{product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping (Air)</span>
                  <span className="text-secondary">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : `£${shippingEstimate.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duties & Taxes</span>
                  <span className="text-secondary">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : `£${dutyEstimate.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-border">
                  <span className="text-secondary">Est. Total</span>
                  <span className="text-primary font-serif text-lg">
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : `£${landedCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/60">
                Final cost calculated at checkout based on your selections.
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Quantity</span>
                <div className="flex items-center gap-4 border border-border rounded-full px-4 py-2">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="text-muted-foreground hover:text-secondary transition-colors"
                    data-testid="button-decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-secondary" data-testid="quantity-display">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(Number(product.stock), q + 1))}
                    className="text-muted-foreground hover:text-secondary transition-colors"
                    data-testid="button-increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button 
                className="w-full h-16 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-500 hover:scale-[1.02] shadow-lg shadow-primary/30 gap-3"
                onClick={handleAddToCart}
                disabled={Number(product.stock) < 1}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Portfolio
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl">
                <Truck className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary">UK-SA Shipping</p>
                  <p className="text-[10px] text-muted-foreground">5-7 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary">Authenticity</p>
                  <p className="text-[10px] text-muted-foreground">Verified genuine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
