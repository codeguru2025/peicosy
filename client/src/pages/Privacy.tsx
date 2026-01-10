import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-secondary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-secondary text-center mb-4">
            Data Privacy Policy
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Your privacy matters to us. This policy explains how we handle your information.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <p className="text-sm text-muted-foreground mb-8">Last updated: January 2026</p>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                PEICOSY ("we", "our", "us") is committed to protecting user privacy and handling personal data responsibly. This Privacy Policy explains how we collect, use, store, and protect information when users access or use the PEICOSY application, website, or related services ("the Platform").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using PEICOSY, you consent to the practices described in this policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect the following categories of information:
              </p>
              
              <h3 className="font-semibold text-secondary mt-6 mb-3">a) Information You Provide Directly</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>User account details</li>
                <li>Profile information</li>
                <li>Communication or support requests</li>
              </ul>

              <h3 className="font-semibold text-secondary mt-6 mb-3">b) Transactional & Usage Data</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>App usage activity</li>
                <li>Payment confirmations (processed via third-party payment providers)</li>
                <li>Device identifiers and log data</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not intentionally collect sensitive personal data unless explicitly required for a specific service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">3. How We Use Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use collected data to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Create and manage user accounts</li>
                <li>Provide and improve PEICOSY services</li>
                <li>Process transactions and confirmations</li>
                <li>Communicate important updates or service notices</li>
                <li>Improve platform performance and security</li>
                <li>Comply with legal or regulatory requirements</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
                We do not sell or trade personal data.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                PEICOSY may integrate with third-party services including payment processors, analytics tools, hosting providers, or communication platforms.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These providers process data strictly to deliver their services and are governed by their own privacy policies.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">5. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement reasonable administrative, technical, and organizational safeguards to protect user data. While we strive to protect information, no system can guarantee absolute security.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Users acknowledge and accept this inherent risk.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">6. User Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Subject to applicable laws, users may request to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access their personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete their account or data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Requests can be made through official PEICOSY support channels.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-light text-secondary mb-4">7. Policy Updates</h2>
              <p className="text-muted-foreground leading-relaxed">
                This Privacy Policy may be updated periodically. Continued use of PEICOSY after updates constitutes acceptance of the revised policy.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
