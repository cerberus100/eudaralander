"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { content } from "@/lib/content";

interface NavItem {
  label: string;
  href: string;
}

interface NavCTA {
  label: string;
  href: string;
}

interface NavbarProps {
  items: NavItem[];
  cta: NavCTA;
}

export function Navbar({ items, cta }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-warm-gray/30 shadow-sm">
      <Container>
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-3 group transition-all duration-300">
            <div className="relative transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo-eudaura.svg"
                alt="Eudaura"
                width={40}
                height={40}
                className="h-10 w-10 drop-shadow-sm"
              />
            </div>
            <span className="text-xl font-serif font-bold text-foreground tracking-tight">
              <span className="text-premium">{content.brand.name}</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" className="btn-secondary">
                <Link href="/admin">Admin</Link>
              </Button>
              <Button asChild className="btn-primary">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </nav>
  );
}
