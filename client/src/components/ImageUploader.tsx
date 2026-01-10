import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Loader2, Star, LayoutTemplate, GripVertical } from 'lucide-react';
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
  className?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  className 
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`This file type isn't supported. Please use JPEG, PNG, GIF, or WebP images.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`This image is too large. Please use images under ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
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

    const cdnUrl = `/objects${objectPath.startsWith('/') ? objectPath : '/' + objectPath}`;
    
    const img = new window.Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });

    return {
      objectPath,
      cdnUrl,
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
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
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
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop images here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                JPEG, PNG, GIF, WebP (max {MAX_FILE_SIZE / (1024 * 1024)}MB each)
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">{uploadError}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.objectPath + index} 
              className="relative group rounded-lg overflow-hidden border bg-card"
              data-testid={`image-preview-${index}`}
            >
              <div className="aspect-square">
                <img
                  src={image.cdnUrl}
                  alt={image.originalFilename || `Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="absolute top-2 left-2 flex gap-1">
                {image.role === 'thumbnail' && (
                  <Badge variant="default" className="text-xs bg-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Main
                  </Badge>
                )}
                {image.role === 'hero' && (
                  <Badge variant="secondary" className="text-xs">
                    <LayoutTemplate className="w-3 h-3 mr-1" />
                    Hero
                  </Badge>
                )}
                {image.isLegacy && (
                  <Badge variant="outline" className="text-xs bg-background/80">
                    Legacy
                  </Badge>
                )}
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setImageRole(index, 'thumbnail'); }}
                    disabled={image.role === 'thumbnail'}
                    title="Set as thumbnail"
                    data-testid={`button-set-thumbnail-${index}`}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setImageRole(index, 'hero'); }}
                    disabled={image.role === 'hero'}
                    title="Set as hero"
                    data-testid={`button-set-hero-${index}`}
                  >
                    <LayoutTemplate className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                      title="Move left"
                      data-testid={`button-move-left-${index}`}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    title="Remove image"
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length} / {maxImages} images. First image becomes the main thumbnail.
      </p>
    </div>
  );
}
