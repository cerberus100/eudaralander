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
    return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
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
