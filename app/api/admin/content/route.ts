import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_FILE = join(process.cwd(), 'content', 'eudaura.json');

export async function GET() {
  try {
    const data = await readFile(CONTENT_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading content:', error);
    // During build time, return a basic structure if file doesn't exist
    return NextResponse.json({
      brand: {
        name: "Eudaura",
        tagline: "The future of medicine is presence.",
        subhead: "Independent licensed doctors. Seamless technology.",
        ctaPrimary: "Connect With a Clinician",
        ctaSecondary: "How Eudaura Works",
        platformDisclaimer: "Eudaura is a technology platform. Medical care is provided by independent, licensed clinicians who use the platform."
      },
      theme: {
        colors: {
          sage: "#556B4F",
          olive: "#2E3B2D",
          gold: "#C7A867",
          offwhite: "#F7F5EF",
          ink: "#2E3B2D"
        },
        images: {
          hero: "/images/hero-group.jpg",
          clinician: "/images/clinician-video.jpg",
          patient: "/images/patient-home.jpg",
          community: "/images/community.jpg",
          og: "/images/og.jpg",
          logo: "/logo-eudaura.svg"
        }
      },
      nav: {
        items: [
          { "label": "Home", "href": "/" },
          { "label": "How it Works", "href": "/how-it-works" },
          { "label": "For Patients", "href": "/for-patients" },
          { "label": "For Clinicians", "href": "/for-clinicians" },
          { "label": "Contact", "href": "/contact" }
        ],
        cta: { "label": "Connect", "href": "#connect" }
      },
      home: {
        hero: {
          headline: "The future of medicine is presence.",
          subhead: "Independent licensed doctors. Seamless technology. Eudaura makes healthcare accessible, trustworthy, and human — from anywhere.",
          badges: ["HIPAA-aware", "Independent Doctors", "Human-centered"]
        },
        why: {
          headline: "Healthcare, the way it should be.",
          bullets: [
            "No waiting rooms. No confusing systems.",
            "Independent doctors choose Eudaura for seamless visits.",
            "Technology that feels human — secure, simple, reliable."
          ]
        },
        how: {
          headline: "From question to care in minutes.",
          steps: [
            { "title": "Connect", "desc": "Tap a button to start a secure visit.", "icon": "Wifi" },
            { "title": "Consult", "desc": "Meet with an independent licensed doctor who listens and guides you.", "icon": "Stethoscope" },
            { "title": "Care Plan", "desc": "Get next steps, prescriptions, or referrals — tailored to you.", "icon": "ClipboardCheck" }
          ]
        },
        stories: {
          headline: "Real people. Real presence.",
          quotes: [
            { "quote": "I was seen in minutes, not weeks. The tech just worked.", "author": "Samantha K." },
            { "quote": "Felt personal and calm — exactly what I needed.", "author": "Miguel A." },
            { "quote": "Simple to use and the doctor was fantastic.", "author": "Jordan P." }
          ]
        },
        ctaBand: {
          headline: "Your health, your aura.",
          subhead: "Independent doctors. Real human presence. Technology that brings them together.",
          ctaLabel: "Get Started"
        }
      }
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const content = await request.json();

    // Validate that it's valid JSON
    JSON.stringify(content);

    // Write to file
    await writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));

    return NextResponse.json({ message: 'Content saved successfully' });
  } catch (error) {
    console.error('Error saving content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
