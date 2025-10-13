import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { content } from "@/lib/content";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
  keywords: content.seo.keywords,
  authors: [{ name: content.brand.name }],
  creator: content.brand.name,
  metadataBase: new URL("https://eudaura.com"),
  openGraph: {
    title: content.seo.title,
    description: content.seo.description,
    url: "https://eudaura.com",
    siteName: content.brand.name,
    images: [
      {
        url: content.theme.images.og,
        width: 1200,
        height: 630,
        alt: content.brand.name,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: content.seo.title,
    description: content.seo.description,
    images: [content.theme.images.og],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preload" as="image" href="/images/1758654157534-ChatGPT Image Sep 23, 2025, 12_02_31 PM.jpg" />
        <script src="/clear-sw.js" defer></script>
      </head>
      <body className={`${inter.variable} antialiased font-sans bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen`}>
        <Navbar
          items={content.nav.items}
          cta={content.nav.cta}
        />
        <main className="flex-1">{children}</main>
        <Footer
          platformDisclaimer={content.brand.platformDisclaimer}
          privacyHref="/privacy"
          termsHref="/terms"
          brandName={content.brand.name}
          currentYear={currentYear}
        />
        <Toaster />
      </body>
    </html>
  );
}
