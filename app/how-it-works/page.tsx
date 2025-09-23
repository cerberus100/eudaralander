"use client";

import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { HeroMedia } from "@/components/hero-media";
import { FAQ } from "@/components/faq";
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

export default function HowItWorks() {
  const { howItWorks } = content;
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

  const heroImage = sectionMappings['howitworks-hero']?.images[0] || content.theme.images.hero;

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight">
                  {howItWorks.hero.headline}
                </h1>
                <p className="text-2xl sm:text-3xl text-foreground/70 leading-relaxed">
                  {howItWorks.hero.subhead}
                </p>
              </div>
            </div>
            <div className="relative">
              <HeroMedia
                imageSrc={heroImage}
                imageAlt="Healthcare consultation process"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Steps Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-16">
              {howItWorks.stepsExpanded.map((step, index: number) => (
                <div key={index} className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-serif font-bold text-foreground mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-foreground/80 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <FAQ items={howItWorks.faq} />
          </div>
        </Container>
      </Section>
    </div>
  );
}
