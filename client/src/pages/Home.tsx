import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Plane, CreditCard } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { CartDrawer } from "@/components/CartDrawer";
import { useState } from "react";

export default function Home() {
  const { data: featuredProducts } = useProducts({ category: "featured" });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] md:min-h-[100vh] flex items-center overflow-hidden">
        {/* Vibrant gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 md:top-20 md:right-20 w-48 md:w-96 h-48 md:h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 w-32 md:w-64 h-32 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-5 md:px-8 relative z-10">
          <div className="max-w-5xl space-y-6 md:space-y-10">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="h-[2px] w-10 md:w-20 bg-white"></div>
              <span className="text-white uppercase tracking-[0.4em] md:tracking-[0.6em] text-[10px] md:text-xs font-bold">The Editorial</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[9rem] font-light leading-[1] md:leading-[0.95] tracking-tight">
              <span className="text-white">Not for</span><br />
              <span className="text-white">Everyone,</span><br />
              <span className="text-white/90 italic font-normal text-5xl sm:text-6xl md:text-8xl lg:text-[10rem]">Just for You.</span>
            </h1>
            <p className="text-base md:text-xl text-white/80 max-w-xl font-light leading-relaxed tracking-wide">
              Bespoke luxury logistics and curated commerce. Seamlessly bridging the distance between London's finest and South Africa's elite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-4 md:pt-8">
              <Link href="/shop">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 rounded-full px-8 md:px-14 h-12 md:h-16 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold shadow-2xl transition-all duration-500 hover:scale-105" data-testid="button-enter-boutique">
                  Enter Boutique
                </Button>
              </Link>
              <Link href="/legacy">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/50 hover:bg-white/10 hover:border-white rounded-full px-8 md:px-14 h-12 md:h-16 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold backdrop-blur-sm transition-all duration-500" data-testid="button-our-legacy">
                  Our Legacy
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 md:gap-4">
          <span className="text-white/60 text-[9px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.5em] font-light">Scroll</span>
          <div className="w-[1px] h-10 md:h-16 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-40 bg-background">
        <div className="container mx-auto px-5 md:px-8">
          <div className="flex items-center justify-center gap-3 md:gap-6 mb-10 md:mb-20">
            <div className="h-[1px] w-8 md:w-16 bg-primary/30"></div>
            <span className="text-primary uppercase tracking-[0.4em] md:tracking-[0.6em] text-[9px] md:text-[10px] font-bold">The Promise</span>
            <div className="h-[1px] w-8 md:w-16 bg-primary/30"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard 
              icon={Plane}
              title="Secure Logistics"
              description="Bespoke air and sea freight with real-time tracking from London to Johannesburg."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Customs Concierge"
              description="Full duty and tax calculation handled discreetly. No surprises upon arrival."
            />
            <FeatureCard 
              icon={CreditCard}
              title="Landed Transparency"
              description="Complete cost visibility from the moment of selection. What you see is what you pay."
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-40 bg-muted/30">
        <div className="container mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 md:mb-20 gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="h-[1px] w-8 md:w-12 bg-primary"></div>
                <span className="text-primary uppercase tracking-[0.4em] md:tracking-[0.5em] text-[9px] md:text-[10px] font-bold">New Acquisitions</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-light tracking-tight text-secondary">Latest Arrivals</h2>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-medium rounded-full px-6 md:px-8 py-4 md:py-6 border-secondary/20 text-secondary hover:bg-secondary hover:text-white transition-all duration-500" data-testid="button-view-collection">
                View Collection <ArrowRight className="w-3 md:w-4 h-3 md:h-4 ml-2 md:ml-3" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
            {featuredProducts ? featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            )) : (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-[2rem] aspect-[3/4] animate-pulse shadow-lg" />
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-12 rounded-3xl bg-white border border-border/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-700 group">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-700">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-serif text-2xl font-light mb-6 tracking-wide text-secondary">{title}</h3>
      <p className="text-muted-foreground font-light leading-relaxed tracking-wide text-sm">{description}</p>
    </div>
  );
}

import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [imageError, setImageError] = useState(false);
  
  const handleCardClick = () => {
    setLocation(`/product/${product.id}`);
  };
  
  return (
    <div 
      className="group bg-white rounded-[2rem] overflow-hidden transition-all duration-700 flex flex-col shadow-lg hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
      onClick={handleCardClick}
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-muted">
        {!imageError && product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-serif">{product.brand?.charAt(0) || 'P'}</span>
              </div>
              <span className="text-xs uppercase tracking-widest">{product.brand}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute bottom-8 left-8 right-8 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
          <Button 
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold py-6 shadow-2xl" 
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            Acquire
          </Button>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-[0.4em]">{product.brand}</p>
        <h3 className="font-serif font-light text-xl mb-2 text-secondary group-hover:text-primary transition-colors line-clamp-1 tracking-wide">{product.name}</h3>
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="font-medium text-secondary tracking-widest text-sm">£{product.price}</span>
        </div>
      </div>
    </div>
  );
}
