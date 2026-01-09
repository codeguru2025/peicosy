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
      <section className="relative overflow-hidden bg-navy text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pink/20 text-pink border border-pink/30 text-sm font-medium backdrop-blur-sm">
              Premium Logistics & Commerce
            </span>
            <h1 className="font-serif text-5xl lg:text-7xl font-bold leading-tight">
              Curated Luxury from <span className="text-pink">UK to SA</span>.
            </h1>
            <p className="text-xl text-gray-300 max-w-lg">
              Shop exclusive brands with transparent landed costs. We handle customs, duties, and secure delivery to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/shop">
                <Button size="lg" className="bg-pink hover:bg-pink/90 text-white rounded-full px-8 h-12 text-lg">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 rounded-full px-8 h-12 text-lg">
                  How it Works
                </Button>
              </Link>
            </div>
          </div>
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
