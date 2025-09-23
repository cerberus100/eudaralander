"use client";

import { CheckCircle, Shield, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { HeroMedia } from "@/components/hero-media";
import { content } from "@/lib/content";
import { useState, useEffect } from "react";

interface SectionMapping {
  [key: string]: {
    title: string;
    images: string[];
    content: string;
    editable: boolean;
  };
}

export default function ForClinicians() {
  const { clinicians } = content;
  const [sectionMappings, setSectionMappings] = useState<SectionMapping>({});

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/admin/mappings');
      if (response.ok) {
        const data = await response.json();
        setSectionMappings(data);
      }
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
    }
  };

  const heroImage = sectionMappings['clinicians-hero']?.images[0] || content.theme.images.hero;


  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight">
                  {clinicians.hero.headline}
                </h1>
                <p className="text-2xl sm:text-3xl text-foreground/70 leading-relaxed">
                  {clinicians.hero.subhead}
                </p>
              </div>
            </div>
            <div className="relative">
              <HeroMedia
                imageSrc={heroImage}
                imageAlt="Healthcare professional using telehealth technology"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Value Proposition Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-8">
              Built for providers who care
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {clinicians.value.map((value: string, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/80 leading-relaxed">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {clinicians.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/70">
                      {feature.desc}
                    </p>
                  </div>
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
              Ready to deliver great care?
            </h2>
            <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              Join independent clinicians who are building their practice with Eudaura.
            </p>
            <Button size="lg" className="btn-primary">
              {clinicians.cta.label}
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
