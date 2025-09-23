import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const imagesDir = join(process.cwd(), 'public/images');
    const files = await readdir(imagesDir);

    const imageFiles = await Promise.all(
      files
        .filter(file => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
        .map(async (file) => {
          const filePath = join(imagesDir, file);
          const stats = await stat(filePath);

          return {
            name: file,
            url: `/images/${file}`,
            size: stats.size,
            lastModified: stats.mtime
          };
        })
    );

    // Sort by last modified (newest first)
    imageFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return NextResponse.json(imageFiles);
  } catch (error) {
    console.error('Error reading images:', error);
    return NextResponse.json({ error: 'Failed to read images' }, { status: 500 });
  }
}
