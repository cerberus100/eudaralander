import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const MAPPINGS_FILE = join(process.cwd(), 'data', 'section-mappings.json');

export async function GET() {
  try {
    // Ensure data directory exists
    await mkdir(join(process.cwd(), 'data'), { recursive: true });

    try {
      const data = await readFile(MAPPINGS_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } catch (_error) {
      // Return default mappings if file doesn't exist
          const defaultMappings = {
            hero: {
              title: 'Home Hero Section',
              images: [],
              content: 'The future of medicine is presence.',
              editable: false
            },
            'hero-image': {
              title: 'Hero Background Image',
              images: [],
              content: '',
              editable: false
            },
            testimonials: {
              title: 'Testimonials Section',
              images: [],
              content: 'Real people. Real presence.',
              editable: true
            },
            'how-it-works': {
              title: 'How It Works Icons',
              images: [],
              content: 'From question to care in minutes.',
              editable: true
            },
            'how-it-works-0': {
              title: 'Connect Icon',
              images: [],
              content: '',
              editable: false
            },
            'how-it-works-1': {
              title: 'Consult Icon',
              images: [],
              content: '',
              editable: false
            },
            'how-it-works-2': {
              title: 'Care Plan Icon',
              images: [],
              content: '',
              editable: false
            },
            'patients-hero': {
              title: 'For Patients Hero',
              images: [],
              content: 'Care for everyday life',
              editable: false
            },
            'clinicians-hero': {
              title: 'For Clinicians Hero',
              images: [],
              content: 'Built for providers who care',
              editable: false
            },
            'howitworks-hero': {
              title: 'How It Works Hero',
              images: [],
              content: 'From question to care in minutes',
              editable: false
            },
            'contact-hero': {
              title: 'Contact Hero',
              images: [],
              content: 'Get in Touch',
              editable: false
            }
          };
      return NextResponse.json(defaultMappings);
    }
  } catch (error) {
    console.error('Error reading mappings:', error);
    return NextResponse.json({ error: 'Failed to read mappings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const mappings = await request.json();

    // Ensure data directory exists
    await mkdir(join(process.cwd(), 'data'), { recursive: true });

    // Save mappings to file
    await writeFile(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));

    return NextResponse.json({ message: 'Mappings saved successfully' });
  } catch (error) {
    console.error('Error saving mappings:', error);
    return NextResponse.json({ error: 'Failed to save mappings' }, { status: 500 });
  }
}
