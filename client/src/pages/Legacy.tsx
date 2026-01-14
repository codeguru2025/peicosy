import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Legacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <section 
        className="relative w-full py-16 sm:py-24 md:py-32 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 50%, #9d174d 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 flex items-center justify-center">
          <div 
            className="border-2 border-white/40 rounded-full px-12 sm:px-16 md:px-20 py-4 sm:py-5"
            data-testid="legacy-title-badge"
          >
            <h1 className="text-white text-lg sm:text-xl md:text-2xl tracking-[0.3em] font-light uppercase">
              Our Legacy
            </h1>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
          <article className="max-w-3xl mx-auto space-y-8 text-foreground/90">
            
            <section className="space-y-6" data-testid="section-heritage">
              <p className="text-lg sm:text-xl leading-relaxed">
                Rooted in <span className="font-semibold text-primary">Pedzisai</span>—a name that carries identity, resilience, and vision—PEICOSY is where personal heritage meets modern luxury. The name itself is deliberate: intimate, warm, and inviting. A reminder that true luxury should feel like it was made for you, not the masses.
              </p>
            </section>

            <section className="space-y-6" data-testid="section-philosophy">
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                We exist for those who appreciate detail, discernment, and quiet confidence. For those who understand that luxury is not loud—it is intentional.
              </p>
              
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                From London's most refined ateliers to Africa's style-conscious elite, PEICOSY curates more than products. We curate access. Every piece, every formulation, every delivery is chosen with care, bridging continents through trust, taste, and precision.
              </p>
            </section>

            <section 
              className="py-8 sm:py-10 border-y border-border space-y-4"
              data-testid="section-values"
            >
              <p className="text-base sm:text-lg leading-relaxed text-center italic text-foreground">
                Our legacy is not defined by volume, but by <span className="font-medium">exclusivity</span>.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center italic text-foreground">
                Not by trends, but by <span className="font-medium">timelessness</span>.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center italic text-foreground">
                Not by speed, but by <span className="font-medium">craft</span>.
              </p>
            </section>

            <section className="space-y-6" data-testid="section-promise">
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                PEICOSY is bespoke by nature—designed to feel personal, effortless, and rare. Whether fashion or beauty, logistics or lifestyle, our promise remains the same:
              </p>
              
              <blockquote className="border-l-4 border-primary pl-6 py-2">
                <p className="text-lg sm:text-xl font-medium text-foreground">
                  Luxury, curated with intention. Delivered with care.
                </p>
              </blockquote>
            </section>

            <section 
              className="pt-8 text-center space-y-2"
              data-testid="section-tagline"
            >
              <p className="text-sm sm:text-base text-muted-foreground italic">
                This is not for everyone.
              </p>
              <p className="text-xl sm:text-2xl font-serif font-medium text-primary">
                This is just for you.
              </p>
            </section>

          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
