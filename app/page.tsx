"use client";

import { Container } from "@/components/container";
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

export default function Home() {
  const { home } = content;
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

  const heroImage = sectionMappings.hero?.images[0] || content.theme.images.hero;

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight">
                  {home.hero.headline}
                </h1>
                <p className="text-2xl sm:text-3xl text-foreground/70 leading-relaxed">
                  {home.hero.subhead}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {home.hero.badges.map((badge, index) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl">
                <img
                  src={heroImage}
                  alt="Healthcare professionals providing care"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Section */}
      <section className="section-premium py-24 sm:py-40 lg:py-48">
        <Container>
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-12 leading-tight">
              {home.why.headline}
            </h2>
            <div className="space-y-6 text-xl sm:text-2xl text-foreground/70 leading-relaxed">
              {home.why.bullets.map((bullet, index) => (
                <p key={index} className="font-medium">{bullet}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-24 sm:py-40 lg:py-48">
        <Container>
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {home.how.headline}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {home.how.steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">{step.title}</h3>
                <p className="text-lg text-foreground/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="section-premium py-24 sm:py-40 lg:py-48">
        <Container>
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {home.stories.headline}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {home.stories.quotes.map((quote, index) => (
              <div key={index} className="card-premium rounded-lg p-6">
                <blockquote className="text-lg text-foreground mb-4">
                  &ldquo;{quote.quote}&rdquo;
                </blockquote>
                <cite className="text-foreground/70 font-medium">— {quote.author}</cite>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Band */}
      <section className="py-24 sm:py-40 lg:py-48 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        <Container>
          <div className="text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {home.ctaBand.headline}
            </h2>
            <p className="text-2xl sm:text-3xl text-foreground/70 mb-12 max-w-4xl mx-auto leading-relaxed">
              {home.ctaBand.subhead}
            </p>
            <a href="#connect" className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 py-4 text-lg">
              {home.ctaBand.ctaLabel}
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}