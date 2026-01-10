import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  fill?: boolean;
  priority?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3C/svg%3E";

export function OptimizedImage({
  src,
  alt,
  className,
  aspectRatio = 'square',
  fill = false,
  priority = false,
  fallbackSrc = PLACEHOLDER_SVG,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        !fill && aspectClasses[aspectRatio],
        fill && 'w-full h-full',
        className
      )}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}

interface ProductImageGalleryProps {
  images: Array<{
    id?: number;
    cdnUrl: string;
    role: string;
    originalFilename?: string;
  }>;
  productName: string;
  className?: string;
}

export function ProductImageGallery({ images, productName, className }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const sortedImages = [...images].sort((a, b) => {
    if (a.role === 'thumbnail') return -1;
    if (b.role === 'thumbnail') return 1;
    if (a.role === 'hero') return -1;
    if (b.role === 'hero') return 1;
    return 0;
  });

  if (sortedImages.length === 0) {
    return (
      <OptimizedImage
        src=""
        alt={productName}
        className={cn('rounded-xl', className)}
      />
    );
  }

  const mainImage = sortedImages[selectedIndex];

  return (
    <div className={cn('space-y-4', className)}>
      <OptimizedImage
        src={mainImage.cdnUrl}
        alt={`${productName} - ${mainImage.role}`}
        className="rounded-xl"
        priority
      />
      
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                selectedIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
              )}
              data-testid={`gallery-thumb-${index}`}
            >
              <OptimizedImage
                src={image.cdnUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
