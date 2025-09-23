import Link from "next/link";
import { Container } from "@/components/container";
import { content } from "@/lib/content";

interface FooterProps {
  platformDisclaimer: string;
  privacyHref: string;
  termsHref: string;
  brandName: string;
  currentYear: number;
}

export function Footer({
  platformDisclaimer,
  privacyHref,
  termsHref,
  brandName,
  currentYear
}: FooterProps) {
  return (
    <footer className="bg-gradient-to-br from-secondary via-secondary to-olive text-background relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
      <Container>
        <div className="py-16 sm:py-20 relative z-10">
          {/* Disclaimer */}
          <div className="max-w-5xl mx-auto text-center mb-12">
            <p className="text-base text-background/90 leading-relaxed font-medium">
              {platformDisclaimer}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-12 mb-12">
            <Link
              href={privacyHref}
              className="text-background/80 hover:text-background transition-all duration-300 text-base font-medium relative group"
            >
              Privacy Policy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href={termsHref}
              className="text-background/80 hover:text-background transition-all duration-300 text-base font-medium relative group"
            >
              Terms of Use
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center border-t border-background/20 pt-8">
            <p className="text-base text-background/70 font-medium">
              © {currentYear} {brandName}. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
