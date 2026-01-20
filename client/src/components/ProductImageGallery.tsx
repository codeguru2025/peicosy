import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/hooks/use-products";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  mainImageUrl?: string;
}

export function ProductImageGallery({ images, productName, mainImageUrl }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const allImages = images.length > 0 
    ? images.sort((a, b) => {
        if (a.role === 'thumbnail') return -1;
        if (b.role === 'thumbnail') return 1;
        if (a.role === 'hero') return -1;
        if (b.role === 'hero') return 1;
        return a.sortOrder - b.sortOrder;
      })
    : mainImageUrl 
      ? [{ id: 0, cdnUrl: mainImageUrl, role: 'thumbnail' as const, mimeType: 'image/jpeg', sortOrder: 0, isLegacy: true, productId: 0, objectPath: '', createdAt: '' }]
      : [];

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-3xl flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const currentImage = allImages[selectedIndex];
  const isVideo = currentImage?.mimeType?.startsWith('video/');

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-muted rounded-3xl overflow-hidden shadow-2xl group">
        {isVideo ? (
          <video
            src={currentImage.cdnUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
            poster={allImages.find(img => img.role === 'thumbnail')?.cdnUrl}
            data-testid="product-video"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={currentImage.cdnUrl}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
            loading={selectedIndex === 0 ? "eager" : "lazy"}
            data-testid="main-product-image"
          />
        )}
        
        {allImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
              onClick={goToPrevious}
              data-testid="button-previous-image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
              onClick={goToNext}
              data-testid="button-next-image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {!isVideo && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
            onClick={() => setIsZoomed(true)}
            data-testid="button-zoom-image"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}
        
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-medium">
              {selectedIndex + 1} / {allImages.length}
            </span>
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allImages.map((image, index) => {
            const isVideoThumb = image.mimeType?.startsWith('video/');
            return (
              <button
                key={image.id || index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all relative",
                  selectedIndex === index 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-transparent hover:border-muted-foreground/30"
                )}
                data-testid={`thumbnail-${index}`}
              >
                {isVideoThumb ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={image.cdnUrl}
                    alt={`${productName} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {isZoomed && !isVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
          data-testid="zoom-modal"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white"
            onClick={() => setIsZoomed(false)}
            data-testid="button-close-zoom"
          >
            <X className="h-6 w-6" />
          </Button>
          
          {allImages.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          
          <img
            src={currentImage.cdnUrl}
            alt={`${productName} - Full size`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
