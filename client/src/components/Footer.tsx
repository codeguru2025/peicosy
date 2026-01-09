import { Link } from "wouter";
import logoUrl from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-navy text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Peicosy" className="h-8 w-auto object-contain" />
              <h3 className="font-serif text-2xl font-bold">Peicosy</h3>
            </div>
            <p className="text-gray-400 max-w-xs">
              Luxury commerce and logistics connecting the UK and South Africa.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-pink">Shop</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop?category=fashion" className="hover:text-white transition-colors">Fashion</Link></li>
              <li><Link href="/shop?category=tech" className="hover:text-white transition-colors">Tech</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-pink">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/orders" className="hover:text-white transition-colors">Order Status</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-pink">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Peicosy. All rights reserved.</p>
          <div className="text-center md:text-right">
            <p className="font-serif italic text-pink text-lg mb-1">Not for Everyone, Just for You</p>
            <p className="text-xs text-gray-600">Created by Chibikhulu</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
