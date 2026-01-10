import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-secondary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-secondary text-center mb-4">
            Terms of Service
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <p className="text-sm text-muted-foreground mb-8">Last updated: January 2026</p>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using PEICOSY, you agree to these Terms of Service. If you do not agree, you must not use the Platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">2. Platform Purpose</h2>
              <p className="text-muted-foreground leading-relaxed">
                PEICOSY provides digital services, tools, and features designed to facilitate user interaction, transactions, and platform-specific activities.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                PEICOSY does not guarantee outcomes, earnings, or specific results from platform usage.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">3. User Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By using PEICOSY, you confirm that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You are legally capable of entering into binding agreements</li>
                <li>Information provided is accurate and up to date</li>
                <li>You will comply with all applicable laws</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">4. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the platform lawfully and ethically</li>
                <li>Protect account login credentials</li>
                <li>Not misuse, manipulate, or exploit platform features</li>
                <li>Not engage in fraud, impersonation, or harmful conduct</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                PEICOSY reserves the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">5. Payments & Transactions</h2>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed through approved third-party payment providers. PEICOSY does not store full payment credentials.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Transaction failures, delays, or third-party errors are outside PEICOSY's direct control.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All PEICOSY branding, software, content, design, and functionality are the exclusive intellectual property of PEICOSY.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Users may not copy, reproduce, reverse-engineer, or commercially exploit any part of the Platform without written authorization.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To the maximum extent permitted by law, PEICOSY shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Indirect or consequential losses</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>User decisions or actions taken using the Platform</li>
                <li>Third-party service failures</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Use of PEICOSY is at the user's own risk.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                PEICOSY may suspend or terminate access at any time where there is:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Breach of these terms</li>
                <li>Illegal or harmful activity</li>
                <li>Platform security risk</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed and interpreted in accordance with the laws of the applicable operating jurisdiction.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
