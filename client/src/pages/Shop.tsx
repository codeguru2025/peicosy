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
      
      <div className="bg-navy py-12 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Our Collection</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Discover hand-picked items from top UK retailers, ready to be shipped directly to you.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search brands, products..." 
              className="pl-10 rounded-full border-muted-foreground/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
             {['All', 'Fashion', 'Tech', 'Home', 'Beauty'].map(cat => (
               <Button key={cat} variant="outline" size="sm" className="rounded-full border-muted-foreground/20">
                 {cat}
               </Button>
             ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {products?.length === 0 && (
          <div className="text-center py-20">
             <p className="text-muted-foreground text-lg">No products found matching your search.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// Reusing ProductCard for consistency (could extract to component file)
import { Product } from "@shared/schema";

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
