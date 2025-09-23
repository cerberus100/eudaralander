"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Upload, Image as ImageIcon, Settings, Eye, X, Home, Users, Stethoscope, Phone, Shield, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { content } from "@/lib/content";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  lastModified: Date;
}

interface SectionMapping {
  [key: string]: {
    title: string;
    images: string[];
    content: string;
    editable: boolean;
  };
}


export default function Admin() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [sectionMappings, setSectionMappings] = useState<SectionMapping>({});
  const [isDragging, setIsDragging] = useState(false);


  useEffect(() => {
    fetchImages();
    fetchMappings();
  }, []);

  // Clear dragged image state on mount and when window loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setDraggedImage(null);
        setIsDragging(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/admin/mappings');
      if (response.ok) {
        const data = await response.json();
        setSectionMappings(data);
      } else {
        // Initialize with default structure if no mappings exist
        setSectionMappings({
          hero: {
            title: 'Home Hero Section',
            images: [],
            content: 'The future of medicine is presence.',
            editable: false
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
        });
      }
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
      // Initialize with default structure on error too
      setSectionMappings({
        hero: {
          title: 'Hero Section',
          images: [],
          content: 'The future of medicine is presence.',
          editable: false
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
        }
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

      const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        console.log('Drop event triggered');
        const files = Array.from(e.dataTransfer.files);
        console.log('Total files dropped:', files.length);

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        console.log('Image files:', imageFiles.length);

        for (const file of imageFiles) {
          console.log('Processing file:', file.name);
          await uploadImage(file);
        }
      }, [uploadImage]);

  const uploadImage = async (file: File) => {
    console.log('Starting upload for:', file.name, 'Type:', file.type, 'Size:', file.size);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload response:', result);

      if (response.ok) {
        console.log('Upload successful, refreshing images...');
        await fetchImages(); // Refresh the image list
      } else {
        console.error('Upload failed with response:', result);
      }
    } catch (error) {
      console.error('Upload failed with error:', error);
    }
  };

  const deleteImage = async (filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      const response = await fetch(`/api/admin/images/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Also remove this image from any sections that are using it
        await cleanMappingsOfDeletedImage(filename);
        await fetchImages(); // Refresh the image list
      } else {
        console.error('Delete failed:', response.statusText);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const cleanMappingsOfDeletedImage = async (deletedImageUrl: string) => {
    const updatedMappings = { ...sectionMappings };

    // Remove the deleted image from all sections
    Object.keys(updatedMappings).forEach(sectionKey => {
      if (updatedMappings[sectionKey].images.includes(deletedImageUrl)) {
        updatedMappings[sectionKey].images = updatedMappings[sectionKey].images.filter(
          image => image !== deletedImageUrl
        );
      }
    });

    setSectionMappings(updatedMappings);

    try {
      await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMappings),
      });
    } catch (error) {
      console.error('Failed to update mappings after image deletion:', error);
    }
  };

  const deleteAllImages = async () => {
    if (!confirm('Delete ALL images? This will also clear all section assignments.')) return;

    try {
      // Get list of all images
      const imagesToDelete = [...images];

      // Delete each image
      for (const image of imagesToDelete) {
        await fetch(`/api/admin/images/${image.name}`, {
          method: 'DELETE',
        });
      }

      // Clear all section mappings
      const clearedMappings = Object.keys(sectionMappings).reduce((acc, key) => {
        acc[key] = {
          ...sectionMappings[key],
          images: []
        };
        return acc;
      }, {} as SectionMapping);

      setSectionMappings(clearedMappings);
      setImages([]);

      try {
        await fetch('/api/admin/mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clearedMappings),
        });
      } catch (error) {
        console.error('Failed to clear mappings:', error);
      }
    } catch (error) {
      console.error('Failed to delete all images:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageDragStart = (e: React.DragEvent, imageUrl: string) => {
    console.log('🚀 Drag started:', imageUrl);
    console.log('🎯 Event target:', e.target);

    setDraggedImage(imageUrl);
    setIsDragging(true);

    // Set drag properties
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', imageUrl);

    // Set custom drag image
    const img = e.target as HTMLImageElement;
    if (img && img.src) {
      e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
      console.log('🖼️ Drag image set:', img.src);
    }

    console.log('✅ Drag setup completed');
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    console.log('🛑 Drag ended');
    console.log('📍 Drop effect:', e.dataTransfer.dropEffect);
    setDraggedImage(null);
    setIsDragging(false);
  };

  const handleSectionDrop = async (e: React.DragEvent, sectionKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 Section drop triggered for:', sectionKey);
    console.log('📊 Data types available:', e.dataTransfer.types);
    console.log('📝 Text data:', e.dataTransfer.getData('text/plain'));

    const imageUrl = e.dataTransfer.getData('text/plain');
    console.log('📸 Drop received:', imageUrl, 'on section:', sectionKey);

    if (!imageUrl) {
      console.log('❌ No image URL found in drop data');
      return;
    }

    // Prevent duplicate images in the same section
    if (sectionMappings[sectionKey]?.images?.includes(imageUrl)) {
      return;
    }

    const updatedMappings = {
      ...sectionMappings,
      [sectionKey]: {
        ...sectionMappings[sectionKey],
        images: [...(sectionMappings[sectionKey]?.images || []), imageUrl]
      }
    };

    setSectionMappings(updatedMappings);
    setDraggedImage(null);
    setIsDragging(false);

    try {
      await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMappings),
      });
    } catch (error) {
      console.error('Failed to save mappings:', error);
    }
  };

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    console.log('🎯 Section drag over - copy effect set');
  };

  const handleSectionDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Section drag enter - drop zone activated');
  };

  const handleSectionDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeImageFromVisualSection = async (sectionKey: string) => {
    const updatedMappings = {
      ...sectionMappings,
      [sectionKey]: {
        ...sectionMappings[sectionKey],
        images: []
      }
    };

    setSectionMappings(updatedMappings);

    try {
      await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMappings),
      });
    } catch (error) {
      console.error('Failed to save mappings:', error);
    }
  };


  const pages = [
    { id: 'home', title: 'Home', icon: Home, url: '/' },
    { id: 'for-patients', title: 'For Patients', icon: Users, url: '/for-patients' },
    { id: 'for-clinicians', title: 'For Clinicians', icon: Stethoscope, url: '/for-clinicians' },
    { id: 'how-it-works', title: 'How It Works', icon: BookOpen, url: '/how-it-works' },
    { id: 'contact', title: 'Contact', icon: Phone, url: '/contact' },
    { id: 'privacy', title: 'Privacy Policy', icon: Shield, url: '/privacy' },
    { id: 'terms', title: 'Terms of Use', icon: Shield, url: '/terms' }
  ];

  const currentPage = pages.find(page => page.id === activePage);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 select-none ${isDragging ? 'dragging' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Eudaura Live Editor
            </h1>
          <p className="text-lg text-foreground/70">
            Edit your website while seeing exactly how it looks
            </p>
          </div>

        {/* Control Bar */}
        <Card className="card-premium mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Page Navigation */}
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
            <Button
                      key={page.id}
                      variant={activePage === page.id ? "default" : "outline"}
                      className={`flex items-center gap-2 ${activePage === page.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActivePage(page.id)}
                    >
                      <Icon className="w-4 h-4" />
                      {page.title}
            </Button>
                  );
                })}
              </div>

              {/* Edit Controls */}
              <div className="flex items-center gap-2">
            <Button
                  variant="outline"
                  className="btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh Preview
                </Button>
                <Button asChild className="btn-primary">
                  <Link href="/" target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    View Live Site
                  </Link>
            </Button>
          </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery - Fixed at top */}
        <Card className="card-premium mb-8 shadow-lg">
                <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="w-5 h-5 text-primary" />
              Image Gallery - Drag to Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer mb-6 ${
                      isDragOver
                  ? "border-primary bg-primary/5 scale-105"
                        : "border-warm-gray hover:border-primary/50 hover:bg-primary/2"
              }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary/60" />
                    <p className="text-lg font-medium text-foreground mb-2">
                Drop images here or click to upload
                    </p>
              <p className="text-foreground/70">JPG, PNG, SVG, WebP (max 10MB each)</p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                  const imageFiles = files.filter(file => file.type.startsWith('image/'));

                  for (const file of imageFiles) {
                    await uploadImage(file);
                  }
                }}
              />
            </div>

            {images.length > 0 && (
              <>
                {/* Delete All Button */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-foreground/70">
                    {images.length} image{images.length !== 1 ? 's' : ''} available
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllImages}
                    className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete All
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((image) => (
                    <div
                      key={`${image.name}-${image.lastModified}`}
                      className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden shadow-lg group cursor-move hover:scale-105 transition-all duration-300 relative"
                      draggable="true"
                      onDragStart={(e) => {
                        console.log('Drag start event triggered for:', image.url);
                        handleImageDragStart(e, image.url);
                      }}
                      onDragEnd={(e) => {
                        console.log('Drag end event triggered');
                        handleImageDragEnd(e);
                      }}
                      onMouseDown={(_e) => {
                        console.log('Mouse down on draggable div');
                      }}
                      onClick={(e) => {
                        console.log('Click on draggable div - this should not happen during drag');
                        e.preventDefault();
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.name);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110"
                        title={`Delete ${image.name}`}
                      >
                        ×
                      </button>
                      {/* Image name on hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate font-medium">{image.name}</p>
                        <p className="text-xs opacity-75">{formatFileSize(image.size)}</p>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-sm font-medium">Drag me!</span>
                      </div>
                    </div>
                  ))}
                  </div>
              </>
            )}
                </CardContent>
              </Card>

        {/* Visual Section Manager */}
              <Card className="card-premium">
                <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="w-5 h-5 text-primary" />
              Section Manager - {currentPage?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
            <div className="space-y-6">
              {/* Home Page Sections */}
              {activePage === 'home' && (
                <>
                  {/* Hero Section */}
                  <div className="border border-warm-gray/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">Hero Section</h3>
                      <div className="flex gap-2">
                        {sectionMappings.hero?.images.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeImageFromVisualSection('hero')}
                            className="btn-secondary text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                    <div
                      className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                      onDrop={(e) => handleSectionDrop(e, 'hero')}
                      onDragOver={handleSectionDragOver}
                      onDragEnter={handleSectionDragEnter}
                      onDragLeave={handleSectionDragLeave}
                    >
                      {sectionMappings.hero?.images[0] ? (
                        <>
                          <img
                            src={sectionMappings.hero.images[0]}
                            alt="Hero image"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImageFromVisualSection('hero')}
                            className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-all duration-300 hover:scale-110"
                            title="Remove from section"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50">
                          <ImageIcon className="w-16 h-16 mb-4" />
                          <p className="text-lg font-medium">Drop hero image here</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* How It Works Icons */}
                  <div className="border border-warm-gray/30 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-3">How It Works Icons</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { title: "Connect", icon: "Wifi", key: "how-it-works-0" },
                        { title: "Consult", icon: "Stethoscope", key: "how-it-works-1" },
                        { title: "Care Plan", icon: "ClipboardCheck", key: "how-it-works-2" }
                      ].map((step, index) => (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{step.title}</span>
                            {sectionMappings[step.key]?.images.length > 0 && (
                              <button
                                onClick={() => removeImageFromVisualSection(step.key)}
                                className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 hover:scale-110"
                                title="Remove from section"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div
                            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                            onDrop={(e) => handleSectionDrop(e, step.key)}
                            onDragOver={handleSectionDragOver}
                            onDragEnter={handleSectionDragEnter}
                            onDragLeave={handleSectionDragLeave}
                          >
                            {sectionMappings[step.key]?.images[0] ? (
                              <img
                                src={sectionMappings[step.key].images[0]}
                                alt={`${step.title} icon`}
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : (
                              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0" />
                              </svg>
                            )}
                              </div>
                            </div>
                      ))}
                    </div>
                  </div>
            </>
          )}

              {/* For Patients Section */}
              {activePage === 'for-patients' && (
                <div className="border border-warm-gray/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Hero Section</h3>
                    {sectionMappings['patients-hero']?.images.length > 0 && (
                                    <Button
                        variant="outline"
                                      size="sm"
                        onClick={() => removeImageFromVisualSection('patients-hero')}
                        className="btn-secondary text-xs"
                                    >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                                    </Button>
                    )}
                  </div>
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                    onDrop={(e) => handleSectionDrop(e, 'patients-hero')}
                    onDragOver={handleSectionDragOver}
                    onDragEnter={handleSectionDragEnter}
                    onDragLeave={handleSectionDragLeave}
                  >
                    {sectionMappings['patients-hero']?.images[0] ? (
                      <>
                        <img
                          src={sectionMappings['patients-hero'].images[0]}
                          alt="For Patients hero image"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImageFromVisualSection('patients-hero')}
                          className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-all duration-300 hover:scale-110"
                          title="Remove from section"
                        >
                          ×
                        </button>
                                  </>
                                ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50">
                        <ImageIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Drop hero image here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* For Clinicians Section */}
              {activePage === 'for-clinicians' && (
                <div className="border border-warm-gray/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Hero Section</h3>
                    {sectionMappings['clinicians-hero']?.images.length > 0 && (
                                  <Button
                        variant="outline"
                                    size="sm"
                        onClick={() => removeImageFromVisualSection('clinicians-hero')}
                        className="btn-secondary text-xs"
                                  >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                                  </Button>
                                )}
                  </div>
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                    onDrop={(e) => handleSectionDrop(e, 'clinicians-hero')}
                    onDragOver={handleSectionDragOver}
                    onDragEnter={handleSectionDragEnter}
                    onDragLeave={handleSectionDragLeave}
                  >
                    {sectionMappings['clinicians-hero']?.images[0] ? (
                      <>
                        <img
                          src={sectionMappings['clinicians-hero'].images[0]}
                          alt="For Clinicians hero image"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImageFromVisualSection('clinicians-hero')}
                          className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-all duration-300 hover:scale-110"
                          title="Remove from section"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50">
                        <ImageIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Drop hero image here</p>
                              </div>
                            )}
                          </div>
                </div>
              )}

              {/* How It Works Section */}
              {activePage === 'how-it-works' && (
                <div className="border border-warm-gray/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Hero Section</h3>
                    {sectionMappings['howitworks-hero']?.images.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImageFromVisualSection('howitworks-hero')}
                        className="btn-secondary text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                    onDrop={(e) => handleSectionDrop(e, 'howitworks-hero')}
                    onDragOver={handleSectionDragOver}
                    onDragEnter={handleSectionDragEnter}
                    onDragLeave={handleSectionDragLeave}
                  >
                    {sectionMappings['howitworks-hero']?.images[0] ? (
                      <>
                        <img
                          src={sectionMappings['howitworks-hero'].images[0]}
                          alt="How It Works hero image"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImageFromVisualSection('howitworks-hero')}
                          className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-all duration-300 hover:scale-110"
                          title="Remove from section"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50">
                        <ImageIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Drop hero image here</p>
                                    </div>
                    )}
                                </div>
                              </div>
              )}

              {/* Contact Section */}
              {activePage === 'contact' && (
                <div className="border border-warm-gray/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Hero Section</h3>
                    {sectionMappings['contact-hero']?.images.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImageFromVisualSection('contact-hero')}
                        className="btn-secondary text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border-2 border-dashed border-warm-gray hover:border-primary/50 transition-all duration-300"
                    onDrop={(e) => handleSectionDrop(e, 'contact-hero')}
                    onDragOver={handleSectionDragOver}
                    onDragEnter={handleSectionDragEnter}
                    onDragLeave={handleSectionDragLeave}
                  >
                    {sectionMappings['contact-hero']?.images[0] ? (
                      <>
                        <img
                          src={sectionMappings['contact-hero'].images[0]}
                          alt="Contact hero image"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImageFromVisualSection('contact-hero')}
                          className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-all duration-300 hover:scale-110"
                          title="Remove from section"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50">
                        <ImageIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Drop hero image here</p>
                                      </div>
                    )}
                              </div>
                            </div>
                          )}

              {/* Legal Pages - No images needed */}
              {(activePage === 'privacy' || activePage === 'terms') && (
                <div className="border border-warm-gray/30 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3">Legal Pages</h3>
                  <div className="text-center text-foreground/70 bg-background/50 rounded-lg p-8">
                    <p className="text-lg">Legal pages don&apos;t require images</p>
                    <p className="text-sm mt-2">These are text-only pages (Privacy Policy, Terms of Use, etc.)</p>
                  </div>
                </div>
              )}
                  </div>
                </CardContent>
              </Card>

        {/* Live Preview Area */}
        <Card className="card-premium mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Eye className="w-5 h-5 text-primary" />
              Live Preview - {currentPage?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-warm-gray rounded-lg overflow-hidden bg-white">
              <iframe
                src={currentPage?.url || '/'}
                className="w-full h-[400px] border-0"
                title={`Preview of ${currentPage?.title}`}
                onLoad={() => {
                  console.log('Preview loaded for:', currentPage?.url);
                }}
              />
            </div>
          </CardContent>
        </Card>

          {/* Quick Actions */}
        <Card className="card-premium mt-8 shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="btn-primary">
                <Link href="/" target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  View Live Site
                </Link>
                </Button>
                <Button
                  variant="outline"
                  className="btn-secondary"
                  onClick={() => {
                  const dataStr = JSON.stringify(content, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = 'eudaura-content.json';
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                >
                <Settings className="w-4 h-4 mr-2" />
                Export Content
              </Button>
              <Button
                variant="outline"
                className="btn-secondary"
                onClick={() => {
                  if (confirm('Reset all image assignments?')) {
                    setSectionMappings({
                      hero: { title: 'Home Hero Section', images: [], content: 'The future of medicine is presence.', editable: false },
                      'how-it-works-0': { title: 'Connect Icon', images: [], content: '', editable: false },
                      'how-it-works-1': { title: 'Consult Icon', images: [], content: '', editable: false },
                      'how-it-works-2': { title: 'Care Plan Icon', images: [], content: '', editable: false },
                      'patients-hero': { title: 'For Patients Hero', images: [], content: 'Care for everyday life', editable: false },
                      'clinicians-hero': { title: 'For Clinicians Hero', images: [], content: 'Built for providers who care', editable: false },
                      'howitworks-hero': { title: 'How It Works Hero', images: [], content: 'From question to care in minutes', editable: false },
                      'contact-hero': { title: 'Contact Hero', images: [], content: 'Get in Touch', editable: false }
                    });
                  }
                }}
              >
                Reset Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}