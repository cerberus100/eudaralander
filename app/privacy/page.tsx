import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { content } from "@/lib/content";

export default function Privacy() {
  const { legal } = content;

  return (
    <div>
      <Section padding="lg" className="pt-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-8">
              {legal.privacy.headline}
            </h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-foreground/80 leading-relaxed mb-8">
                {legal.privacy.intro}
              </p>

              {legal.privacy.sections.map((section, index: number) => (
                <div key={index} className="mb-8">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                    {section.heading}
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
