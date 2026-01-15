import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Legacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <section className="relative w-full py-24 sm:py-32 md:py-40 lg:py-48 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-4">
              <div className="h-px w-12 bg-primary/40" />
              <span 
                className="text-primary uppercase tracking-[0.4em] text-[10px] sm:text-xs font-medium"
                data-testid="legacy-eyebrow"
              >
                The Story
              </span>
              <div className="h-px w-12 bg-primary/40" />
            </div>
            
            <h1 
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-foreground"
              data-testid="legacy-title"
            >
              Where Heritage
              <br />
              <span className="italic text-primary">Meets Luxury</span>
            </h1>
            
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              A story of identity, vision, and the art of curated excellence.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-16 sm:py-20 md:py-24 lg:py-32">
          <article className="max-w-2xl mx-auto">
            
            <section className="mb-16 sm:mb-20" data-testid="section-heritage">
              <div className="space-y-8">
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl leading-snug text-foreground font-light">
                  Rooted in <span className="text-primary font-normal">Pedzisai</span>—a name that carries identity, resilience, and vision.
                </p>
                
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  PEICOSY is where personal heritage meets modern luxury. The name itself is deliberate: intimate, warm, and inviting. A reminder that true luxury should feel like it was made for you, not the masses.
                </p>
              </div>
            </section>

            <div className="w-24 h-px bg-border mx-auto mb-16 sm:mb-20" />

            <section className="mb-16 sm:mb-20" data-testid="section-philosophy">
              <div className="space-y-6">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground font-light tracking-wide">
                  The Philosophy
                </h2>
                
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  We exist for those who appreciate detail, discernment, and quiet confidence. For those who understand that luxury is not loud—it is intentional.
                </p>
                
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  From London's most refined ateliers to Africa's style-conscious elite, PEICOSY curates more than products. We curate <em className="text-foreground not-italic font-medium">access</em>. Every piece, every formulation, every delivery is chosen with care, bridging continents through trust, taste, and precision.
                </p>
              </div>
            </section>

            <section 
              className="py-12 sm:py-16 my-16 sm:my-20 border-y border-primary/20 bg-primary/[0.02]"
              data-testid="section-values"
            >
              <div className="space-y-6 text-center max-w-lg mx-auto">
                <span className="text-primary uppercase tracking-[0.3em] text-[10px] sm:text-xs font-medium">
                  Our Principles
                </span>
                
                <div className="space-y-4 pt-4">
                  <p className="font-serif text-lg sm:text-xl text-foreground italic">
                    Our legacy is not defined by volume,
                    <br />
                    but by <span className="text-primary not-italic font-medium">exclusivity</span>.
                  </p>
                  <p className="font-serif text-lg sm:text-xl text-foreground italic">
                    Not by trends,
                    <br />
                    but by <span className="text-primary not-italic font-medium">timelessness</span>.
                  </p>
                  <p className="font-serif text-lg sm:text-xl text-foreground italic">
                    Not by speed,
                    <br />
                    but by <span className="text-primary not-italic font-medium">craft</span>.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-16 sm:mb-20" data-testid="section-promise">
              <div className="space-y-8">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground font-light tracking-wide">
                  The Promise
                </h2>
                
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  PEICOSY is bespoke by nature—designed to feel personal, effortless, and rare. Whether fashion or beauty, logistics or lifestyle, our promise remains the same:
                </p>
                
                <blockquote className="relative pl-8 border-l-2 border-primary/60">
                  <p className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground leading-snug font-light">
                    Luxury, curated with intention.
                    <br />
                    <span className="text-primary">Delivered with care.</span>
                  </p>
                </blockquote>
              </div>
            </section>

            <div className="w-24 h-px bg-border mx-auto mb-16 sm:mb-20" />

            <section 
              className="text-center space-y-6 pb-8"
              data-testid="section-tagline"
            >
              <p className="text-muted-foreground text-sm sm:text-base tracking-wide">
                This is not for everyone.
              </p>
              
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl text-primary font-light italic">
                This is just for you.
              </p>
              
              <div className="pt-8">
                <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground/60">
                  Est. 2024 · London & Africa
                </span>
              </div>
            </section>

          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
