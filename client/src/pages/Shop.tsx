import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { CartDrawer } from "@/components/CartDrawer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

export default function Shop() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts({ search });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <CartDrawer />
      
      {/* Editorial Header */}
      <div className="pt-32 pb-20 px-8 bg-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-[1px] w-16 bg-primary"></div>
            <span className="text-primary uppercase tracking-[0.6em] text-[10px] font-bold">The Registry</span>
            <div className="h-[1px] w-16 bg-primary"></div>
          </div>
          <h1 className="font-serif text-6xl lg:text-8xl font-light mb-8 tracking-tight text-secondary">The Collection</h1>
          <p className="text-muted-foreground max-w-xl mx-auto font-light leading-relaxed tracking-wide">
            Hand-selected acquisitions from London's most distinguished ateliers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-8 pb-32 flex-1">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-8 mb-20 items-center justify-between -mt-8">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search the archive..." 
              className="pl-14 h-14 rounded-full border-border bg-white text-sm tracking-wider placeholder:text-muted-foreground/50 focus:border-primary shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
             {['All', 'Fashion', 'Tech', 'Home', 'Beauty'].map(cat => (
               <Button 
                 key={cat} 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full border-border text-[10px] uppercase tracking-[0.3em] px-8 py-5 text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all duration-500"
                 data-testid={`button-category-${cat.toLowerCase()}`}
               >
                 {cat}
               </Button>
             ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] aspect-[3/4] animate-pulse shadow-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {products?.length === 0 && (
          <div className="text-center py-32">
             <p className="text-muted-foreground text-lg font-light tracking-wider">No acquisitions match your inquiry.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

import { Product } from "@shared/schema";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  
  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden transition-all duration-700 flex flex-col shadow-lg hover:shadow-2xl hover:shadow-primary/10" data-testid={`card-product-${product.id}`}>
      <div className="aspect-[3/4] relative overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute bottom-8 left-8 right-8 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
          <Button 
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold py-6 shadow-2xl" 
            onClick={() => addItem(product)}
            data-testid={`button-add-${product.id}`}
          >
            Acquire
          </Button>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-[0.4em]">{product.brand}</p>
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-serif font-light text-xl mb-2 text-secondary group-hover:text-primary transition-colors line-clamp-1 tracking-wide">{product.name}</h3>
        </Link>
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="font-medium text-secondary tracking-widest text-sm">£{product.price}</span>
        </div>
      </div>
    </div>
  );
}
