"use client";

import { Mail, MessageSquare } from "lucide-react";
import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { HeroMedia } from "@/components/hero-media";
import { ContactForm } from "@/components/contact-form";
import { content } from "@/lib/content";

export default function Contact() {
  const { contact } = content;
  const heroImage = content.theme.images.hero;

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[0.9] tracking-tight">
                  {contact.hero.headline}
                </h1>
                <p className="text-2xl sm:text-3xl text-foreground/70 leading-relaxed">
                  {contact.hero.subhead}
                </p>
              </div>
            </div>
            <div className="relative">
              <HeroMedia
                imageSrc={heroImage}
                imageAlt="Eudaura community support"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Contact Form Section */}
      <Section padding="lg">
        <Container>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4 text-center">
              {contact.form.title}
            </h2>
            <p className="text-xl text-foreground/70 mb-8 text-center">
              {contact.form.subtitle}
            </p>
            <ContactForm />
          </div>
        </Container>
      </Section>

      {/* Alternative Contact Methods */}
      <Section padding="lg">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-8">
              Other ways to reach us
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {contact.altContact.map((contactMethod, index: number) => (
                <div key={index} className="flex items-center justify-center space-x-3 p-6 bg-background/50 rounded-lg">
                  {contactMethod.label === "Support" ? (
                    <Mail className="w-6 h-6 text-primary" />
                  ) : (
                    <MessageSquare className="w-6 h-6 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">{contactMethod.label}</p>
                    <a
                      href={`mailto:${contactMethod.value}`}
                      className="text-primary hover:text-secondary transition-colors"
                    >
                      {contactMethod.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Notice Section */}
      <Section padding="lg" className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-4">
              Important Notice
            </h3>
            <p className="text-foreground/80 leading-relaxed">
              This contact form is for general inquiries only. For medical emergencies,
              please call your local emergency number immediately. Do not include
              protected health information (PHI) in your message.
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}
