import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  onLoadStart?: () => void;
  loading?: 'lazy' | 'eager';
  rootMargin?: string;
}

export function OptimizedImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  onClick,
  onLoad,
  onError,
  onLoadStart,
  loading = 'lazy',
  rootMargin = '50px'
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      setCurrentSrc(src);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            setCurrentSrc(src);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, loading, rootMargin, isInView]);

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setImageState('error');
    onError?.();
  };

  const handleImageLoadStart = () => {
    setImageState('loading');
    onLoadStart?.();
  };

  return (
    <div className="relative w-full h-full">
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={currentSrc || undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onLoadStart={handleImageLoadStart}
        onClick={onClick}
        style={{
          visibility: isInView ? 'visible' : 'hidden'
        }}
      />
      
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}