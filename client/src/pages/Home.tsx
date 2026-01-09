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
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1539109132314-34a936699561?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-pink"></div>
              <span className="text-pink uppercase tracking-[0.4em] text-xs font-bold">The Collection</span>
            </div>
            <h1 className="font-serif text-6xl lg:text-9xl font-black leading-[1] tracking-tight">
              Not for Everyone,<br />
              <span className="text-pink italic font-normal">Just for You.</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-xl font-light leading-relaxed tracking-wide">
              Bespoke luxury logistics and curated commerce. Seamlessly bridging the distance between London's finest and South Africa's elite.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <Link href="/shop">
                <Button size="lg" className="bg-pink hover:bg-pink/90 text-white rounded-none px-12 h-14 text-sm uppercase tracking-[0.2em] font-bold shadow-2xl">
                  Enter Boutique
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 rounded-none px-12 h-14 text-sm uppercase tracking-[0.2em] font-bold backdrop-blur-sm">
                  Our Legacy
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
          <span className="text-[10px] uppercase tracking-[0.5em]">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-pink to-transparent"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Plane}
              title="Fast & Secure Shipping"
              description="Reliable air and sea freight options with real-time tracking from London to Johannesburg."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Customs Handled"
              description="No surprises. We calculate and handle all duties and taxes upfront so you don't have to."
            />
            <FeatureCard 
              icon={CreditCard}
              title="Transparent Pricing"
              description="See the full landed cost instantly. What you see is exactly what you pay."
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-serif text-3xl font-bold text-ink">Latest Arrivals</h2>
            <Link href="/shop">
              <Button variant="link" className="text-primary gap-2">View All <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts ? featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            )) : (
              // Loading skeletons
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl h-80 animate-pulse" />
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
    <div className="p-8 rounded-2xl bg-card border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  
  return (
    <div className="group bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="aspect-[4/5] relative overflow-hidden bg-muted">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full rounded-full bg-white/90 hover:bg-white text-ink shadow-lg backdrop-blur-sm" onClick={() => addItem(product)}>
            Add to Bag
          </Button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{product.brand}</p>
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-serif font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="font-medium text-lg">£{product.price}</span>
        </div>
      </div>
    </div>
  );
}
