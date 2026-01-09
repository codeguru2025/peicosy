import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">404</span>
          <div className="h-[1px] w-12 bg-primary"></div>
        </div>
        <h1 className="font-serif text-5xl font-light mb-6 tracking-tight text-secondary">Page Not Found</h1>
        <p className="text-muted-foreground font-light tracking-wider mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="rounded-full px-10 h-14 text-[10px] uppercase tracking-[0.4em] font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30">
            <ArrowLeft className="w-4 h-4 mr-3" /> Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
