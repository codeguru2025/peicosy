import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Plane, CreditCard } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { CartDrawer } from "@/components/CartDrawer";

export default function Home() {
  const { data: featuredProducts } = useProducts({ category: "featured" });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1539109132314-34a936699561?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-6">
              <div className="h-[1px] w-16 bg-primary"></div>
              <span className="text-primary uppercase tracking-[0.6em] text-[10px] font-bold">The Editorial</span>
            </div>
            <h1 className="font-serif text-7xl lg:text-[10rem] font-light leading-[0.9] tracking-tighter">
              Not for Everyone,<br />
              <span className="text-primary italic font-normal ml-8 lg:ml-24">Just for You.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl font-light leading-relaxed tracking-wider">
              Bespoke luxury logistics and curated commerce. Seamlessly bridging the distance between London's finest and South Africa's elite.
            </p>
            <div className="flex flex-col sm:flex-row gap-12 pt-8">
              <Link href="/shop">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-16 h-16 text-[10px] uppercase tracking-[0.4em] font-bold shadow-none transition-all duration-500 hover:scale-105">
                  Enter Boutique
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="ghost" className="text-foreground hover:bg-white/5 rounded-full px-16 h-16 text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-500">
                  Our Legacy
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-20">
          <span className="text-[9px] uppercase tracking-[0.6em] font-light">Descent</span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-40 bg-background">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-center gap-6 mb-20">
            <div className="h-[1px] w-16 bg-white/10"></div>
            <span className="text-muted-foreground uppercase tracking-[0.6em] text-[10px] font-light">The Promise</span>
            <div className="h-[1px] w-16 bg-white/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
      <section className="py-40 bg-white/[0.01]">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-20 gap-8">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] w-12 bg-primary"></div>
                <span className="text-primary uppercase tracking-[0.5em] text-[10px] font-bold">New Acquisitions</span>
              </div>
              <h2 className="font-serif text-5xl font-light tracking-tight">Latest Arrivals</h2>
            </div>
            <Link href="/shop">
              <Button variant="ghost" className="text-[10px] uppercase tracking-[0.4em] font-light hover:bg-white/5 rounded-full px-8 py-6 border border-white/10">
                View Collection <ArrowRight className="w-4 h-4 ml-3" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {featuredProducts ? featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            )) : (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-[2rem] aspect-[3/4] animate-pulse" />
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
    <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-700 group">
      <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-10 group-hover:scale-110 transition-transform duration-700">
        <Icon className="w-8 h-8 font-light" />
      </div>
      <h3 className="font-serif text-2xl font-light mb-6 tracking-wide">{title}</h3>
      <p className="text-muted-foreground font-light leading-relaxed tracking-wide text-sm">{description}</p>
    </div>
  );
}

import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  
  return (
    <div className="group bg-transparent overflow-hidden transition-all duration-700 flex flex-col">
      <div className="aspect-[3/4] relative overflow-hidden bg-white/5 rounded-[2rem]">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute bottom-8 left-8 right-8 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
          <Button className="w-full rounded-full bg-white text-background hover:bg-primary hover:text-white text-[10px] uppercase tracking-[0.3em] font-bold py-6 shadow-2xl" onClick={() => addItem(product)}>
            Request Acquisition
          </Button>
        </div>
      </div>
      <div className="pt-8 flex-1 flex flex-col px-4">
        <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-[0.4em]">{product.brand}</p>
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-serif font-light text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1 tracking-wide">{product.name}</h3>
        </Link>
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="font-light text-muted-foreground tracking-widest text-sm">£{product.price}</span>
        </div>
      </div>
    </div>
  );
}
