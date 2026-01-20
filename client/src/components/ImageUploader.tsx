import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Loader2, Star, LayoutTemplate, GripVertical, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ImageRole = 'thumbnail' | 'hero' | 'gallery';

export interface UploadedImage {
  id?: number;
  objectPath: string;
  cdnUrl: string;
  role: ImageRole;
  originalFilename?: string;
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
  isLegacy?: boolean;
  sortOrder: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  allowVideos?: boolean;
  className?: string;
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  allowVideos = true,
  className 
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const ALLOWED_TYPES = allowVideos ? [...IMAGE_TYPES, ...VIDEO_TYPES] : IMAGE_TYPES;

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      const types = allowVideos ? 'JPEG, PNG, GIF, WebP images or MP4, WebM videos' : 'JPEG, PNG, GIF, or WebP images';
      throw new Error(`This file type isn't supported. Please use ${types}.`);
    }

    if (file.size > maxSize) {
      throw new Error(`This file is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }

    const response = await fetch('/api/uploads/request-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unable to prepare upload. Please try again.');
    }

    const { uploadURL, objectPath } = await response.json();

    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('The image couldn\'t be uploaded. Please try again.');
    }

    // Use object path through Express proxy with improved caching (1 year, immutable)
    const imageUrl = objectPath.startsWith('/objects/') 
      ? objectPath 
      : `/objects${objectPath.startsWith('/') ? objectPath : '/' + objectPath}`;
    
    const img = new window.Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });

    return {
      objectPath,
      cdnUrl: imageUrl,
      role: 'gallery',
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      width: dimensions.width,
      height: dimensions.height,
      sortOrder: images.length,
    };
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      setUploadError(`You can add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const newImages: UploadedImage[] = [];
    
    for (const file of fileArray) {
      try {
        const uploaded = await uploadFile(file);
        if (uploaded) {
          if (images.length === 0 && newImages.length === 0) {
            uploaded.role = 'thumbnail';
          }
          newImages.push(uploaded);
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        break;
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    
    setIsUploading(false);
  }, [images, maxImages, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (newImages.length > 0 && !newImages.some(img => img.role === 'thumbnail')) {
      newImages[0].role = 'thumbnail';
    }
    onImagesChange(newImages);
  };

  const setImageRole = (index: number, role: ImageRole) => {
    const newImages = images.map((img, i) => {
      if (i === index) {
        return { ...img, role };
      }
      if (role === 'thumbnail' && img.role === 'thumbnail') {
        return { ...img, role: 'gallery' as ImageRole };
      }
      if (role === 'hero' && img.role === 'hero') {
        return { ...img, role: 'gallery' as ImageRole };
      }
      return img;
    });
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    newImages.forEach((img, i) => img.sortOrder = i);
    onImagesChange(newImages);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="dropzone-images"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-file-upload"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium">Tap to add {allowVideos ? 'images or videos' : 'images'}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {allowVideos 
                  ? `Images (max ${MAX_IMAGE_SIZE / (1024 * 1024)}MB) • Videos (max ${MAX_VIDEO_SIZE / (1024 * 1024)}MB)`
                  : `JPEG, PNG, GIF, WebP (max ${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">{uploadError}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, index) => {
            const isVideo = image.mimeType?.startsWith('video/');
            return (
            <div 
              key={image.objectPath + index} 
              className="relative group rounded-lg overflow-hidden border bg-card"
              style={{ paddingBottom: '100%' }}
              data-testid={`image-preview-${index}`}
            >
              {isVideo ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Play className="w-8 h-8 text-muted-foreground" />
                  <video
                    src={image.cdnUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    muted
                  />
                </div>
              ) : (
                <img
                  src={image.cdnUrl}
                  alt={image.originalFilename || `Product image ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              
              <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex gap-1 flex-wrap">
                {image.role === 'thumbnail' && (
                  <Badge variant="default" className="text-[10px] sm:text-xs bg-primary px-1.5 py-0.5 sm:px-2 sm:py-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Main
                  </Badge>
                )}
                {image.role === 'hero' && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                    <LayoutTemplate className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Hero
                  </Badge>
                )}
                {image.isLegacy && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-background/80 px-1.5 py-0.5 sm:px-2 sm:py-1">
                    Legacy
                  </Badge>
                )}
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 active:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 sm:gap-2 p-1 sm:p-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={(e) => { e.stopPropagation(); setImageRole(index, 'thumbnail'); }}
                    disabled={image.role === 'thumbnail'}
                    title="Set as thumbnail"
                    data-testid={`button-set-thumbnail-${index}`}
                  >
                    <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={(e) => { e.stopPropagation(); setImageRole(index, 'hero'); }}
                    disabled={image.role === 'hero'}
                    title="Set as hero"
                    data-testid={`button-set-hero-${index}`}
                  >
                    <LayoutTemplate className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                      title="Move left"
                      data-testid={`button-move-left-${index}`}
                    >
                      <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 rotate-90" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    title="Remove image"
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length} / {maxImages} {allowVideos ? 'files' : 'images'}. First image becomes the main thumbnail.
      </p>
    </div>
  );
}
