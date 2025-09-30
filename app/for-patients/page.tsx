"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { HeroMedia } from "@/components/hero-media";
import { content } from "@/lib/content";
import { useRouter } from "next/navigation";


export default function ForPatients() {
  const { patients } = content;
  const router = useRouter();
  const heroImage = content.theme.images.hero;

  return (
    <div>
      {/* Inline CTA Banner */}
      <section className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ready to get started?</h2>
              <p className="text-sm text-foreground/70">Join thousands of patients already using Eudaura</p>
            </div>
            <Button
              onClick={() => router.push('/signup/patient')}
              className="btn-primary"
            >
              Sign Up as Patient
            </Button>
          </div>
        </div>
      </section>
      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight">
                  {patients.hero.headline}
                </h1>
                <p className="text-2xl sm:text-3xl text-foreground/70 leading-relaxed">
                  {patients.hero.subhead}
                </p>
              </div>
            </div>
            <div className="relative">
              <HeroMedia
                imageSrc={heroImage}
                imageAlt="Patient receiving care at home"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Services Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-8">
              What we help with
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {patients.services.map((service: string, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/80 leading-relaxed">
                  {service}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* What to Expect Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-12">
              What to expect
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {patients.whatToExpect.map((expectation: string, index: number) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">
                    {expectation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section padding="lg" className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              Connect with an independent licensed clinician today.
            </p>
            <Button size="lg" className="btn-primary">
              {patients.cta.label}
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
