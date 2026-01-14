import { Link } from "wouter";
import { Mail, Phone, Globe } from "lucide-react";
import logoUrl from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-secondary text-white pt-32 pb-16">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
          <div className="space-y-8 col-span-1 md:col-span-2">
            <div className="flex items-center gap-5">
              <div className="bg-white rounded-2xl p-3 shadow-lg">
                <img src={logoUrl} alt="Peicosy" className="h-16 w-16 object-contain" />
              </div>
              <h3 className="font-serif text-3xl font-medium tracking-[0.15em] uppercase text-white">Peicosy</h3>
            </div>
            <p className="text-white/70 max-w-sm font-light leading-relaxed tracking-wide">
              An exclusive bridge between London's luxury heritage and South Africa's private client landscape. Discrete, secure, and bespoke.
            </p>
            <div className="space-y-3 pt-4">
              <a href="mailto:infor@peicosy.com" className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors duration-300">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-light tracking-wider">infor@peicosy.com</span>
              </a>
              <a href="tel:+447770123806" className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors duration-300">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-light tracking-wider">+44 7770 123806</span>
              </a>
              <a href="https://www.peicosy.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors duration-300">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-light tracking-wider">www.peicosy.com</span>
              </a>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Registry</h4>
            <ul className="space-y-4 text-sm font-light tracking-wider text-white/70">
              <li><Link href="/shop" className="hover:text-primary transition-colors duration-300">The Collection</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors duration-300">Portfolio</Link></li>
              <li><Link href="/legacy" className="hover:text-primary transition-colors duration-300">Our Legacy</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Concierge</h4>
            <ul className="space-y-4 text-sm font-light tracking-wider text-white/70">
              <li><Link href="/contact" className="hover:text-primary transition-colors duration-300">Private Inquiry</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors duration-300">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors duration-300">Data Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-light">© {new Date().getFullYear()} Peicosy Private Client. All Rights Reserved.</p>
          <div className="text-center md:text-right">
            <p className="font-serif italic text-primary text-xl mb-2 font-light tracking-wide">Not for Everyone, Just for You</p>
            <p className="text-[9px] uppercase tracking-[0.5em] text-white/40">Peicosy Private Client</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
