"use client";

import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { HeroMedia } from "@/components/hero-media";
import { FAQ } from "@/components/faq";
import { content } from "@/lib/content";
import { useRouter } from "next/navigation";


export default function HowItWorks() {
  const { howItWorks } = content;
  const router = useRouter();
  const heroImage = content.theme.images.hero;

  return (
    <div>
      {/* Split CTA Section */}
      <section className="section-premium py-20 sm:py-32 lg:py-40">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                Get started with Eudaura today
              </h2>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                Choose your path to join our community of independent healthcare professionals and patients.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Patient Card */}
              <div className="card-premium p-8 text-center group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/signup/patient')}>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">For Patients</h3>
                <p className="text-lg text-foreground/70 mb-6">
                  Book visits with independent licensed doctors who provide personalized, human-centered care.
                </p>
                <ul className="space-y-3 text-sm text-foreground/70 mb-8">
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Book visits with licensed doctors
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    View test results & care plans
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Secure messaging with providers
                  </li>
                </ul>
                <button className="btn-primary w-full">
                  Get Started as Patient
                </button>
              </div>

              {/* Clinician Card */}
              <div className="card-premium p-8 text-center group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/signup/clinician')}>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">For Clinicians</h3>
                <p className="text-lg text-foreground/70 mb-6">
                  Join our network of independent doctors and set your own schedule while maintaining your practice.
                </p>
                <ul className="space-y-3 text-sm text-foreground/70 mb-8">
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Set your own availability
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Get paid for your expertise
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Secure, HIPAA-compliant charting
                  </li>
                </ul>
                <button className="btn-primary w-full">
                  Apply as Clinician
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>
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
