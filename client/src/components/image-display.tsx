import { Download, RotateCcw, Plus, ChevronDown, ChevronUp, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState, useRef } from 'react';

interface ImageDisplayProps {
  imageUrl: string;
  isProcessing: boolean;
  editCount: number;
  editHistory?: Array<{
    prompt: string;
    imageUrl: string;
    timestamp: string;
  }>;
  originalUrl: string;
  onReset: () => void;
  onNewImage: () => void;
  onDownload: (scale?: number) => void;
  onRevert: (historyIndex: number) => void;
  isResetting: boolean;
  isReverting: boolean;
  isUpscaling: boolean;
}

// Helper function to create optimized image URLs
function getOptimizedImageUrl(url: string, width?: number, height?: number, quality: number = 80): string {
  if (!url.startsWith('/api/storage/')) {
    return url; // Return original URL if not from our storage
  }
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality !== 80) params.set('q', quality.toString());
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export function ImageDisplay({
  imageUrl,
  isProcessing,
  editCount,
  editHistory = [],
  originalUrl,
  onReset,
  onNewImage,
  onDownload,
  onRevert,
  isResetting,
  isReverting,
  isUpscaling,
}: ImageDisplayProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Touch gesture states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.25);
      // Reset pan when zoom is 100% or less
      if (newZoom <= 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(1) translate(0px, 0px)`;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        const newZoom = Math.max(zoom - 0.25, 0.25);
        setZoom(newZoom);
        // Reset pan when zoom is 100% or less
        if (newZoom <= 1) {
          setPan({ x: 0, y: 0 });
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
      panStartRef.current = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1 && imageRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newPanX = panStartRef.current.x + deltaX;
      const newPanY = panStartRef.current.y + deltaY;
      
      // Apply transform directly to the image for immediate visual feedback
      imageRef.current.style.transform = `scale(${zoom}) translate(${newPanX / zoom}px, ${newPanY / zoom}px)`;
    }
  };

  const handleMouseUp = () => {
    if (isDragging && zoom > 1 && imageRef.current) {
      // Update React state with final position
      const transform = imageRef.current.style.transform;
      const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (translateMatch) {
        const newPanX = parseFloat(translateMatch[1]) * zoom;
        const newPanY = parseFloat(translateMatch[2]) * zoom;
        setPan({ x: newPanX, y: newPanY });
      }
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging && zoom > 1 && imageRef.current) {
      // Update React state with final position when leaving container
      const transform = imageRef.current.style.transform;
      const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (translateMatch) {
        const newPanX = parseFloat(translateMatch[1]) * zoom;
        const newPanY = parseFloat(translateMatch[2]) * zoom;
        setPan({ x: newPanX, y: newPanY });
      }
    }
    setIsDragging(false);
  };

  // Touch event handlers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start immediately for panning when zoomed
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      
      if (zoom > 1) {
        // Start panning immediately when zoomed in
        setIsDragging(true);
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        panStartRef.current = { ...pan };
      }
    } else if (e.touches.length === 2) {
      // Multi-touch - pinch zoom
      e.preventDefault();
      setIsDragging(false);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1 && imageRef.current) {
      // Single touch panning when zoomed in
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      
      const newPanX = panStartRef.current.x + deltaX;
      const newPanY = panStartRef.current.y + deltaY;
      
      imageRef.current.style.transform = `scale(${zoom}) translate(${newPanX / zoom}px, ${newPanY / zoom}px)`;
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      if (currentDistance && lastTouchDistance) {
        const scaleFactor = currentDistance / lastTouchDistance;
        const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.25), 3);
        
        setZoom(newZoom);
        setLastTouchDistance(currentDistance);
        
        // Reset pan when zoom is 100% or less
        if (newZoom <= 1) {
          setPan({ x: 0, y: 0 });
          if (imageRef.current) {
            imageRef.current.style.transform = `scale(${newZoom}) translate(0px, 0px)`;
          }
        } else if (imageRef.current) {
          // Update the transform with new zoom but keep current pan
          const currentPanX = pan.x / zoom;
          const currentPanY = pan.y / zoom;
          imageRef.current.style.transform = `scale(${newZoom}) translate(${currentPanX}px, ${currentPanY}px)`;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging && zoom > 1 && imageRef.current) {
      // Update React state with final position
      const transform = imageRef.current.style.transform;
      const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (translateMatch) {
        const newPanX = parseFloat(translateMatch[1]) * zoom;
        const newPanY = parseFloat(translateMatch[2]) * zoom;
        setPan({ x: newPanX, y: newPanY });
      }
    }

    setIsLongPress(false);
    setIsDragging(false);
    setTouchStart(null);
    setLastTouchDistance(null);
  };
  return (
    <div className="space-y-4">
      {/* Image Container */}
      <div 
        ref={imageContainerRef}
        className="relative bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px]"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      >
        <img
          ref={imageRef}
          src={getOptimizedImageUrl(imageUrl, 1200, 800, 85)}
          alt="Current editing image"
          className="max-w-full max-h-[600px] object-contain"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'transform 200ms ease-out'
          }}
          onDoubleClick={handleZoomReset}
          draggable={false}
        />

        {/* Image Controls Overlay */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <div className="flex space-x-1 bg-white/90 backdrop-blur-sm rounded-md p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="h-8 w-8 p-0 text-gray-700 hover:bg-gray-100"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomReset}
              disabled={zoom === 1}
              className="h-8 px-2 text-xs text-gray-700 hover:bg-gray-100"
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="h-8 w-8 p-0 text-gray-700 hover:bg-gray-100"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onReset}
            disabled={isProcessing || isResetting}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing || isUpscaling}
                className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
              >
                <Download className="w-4 h-4" />
                {isUpscaling && (
                  <div className="ml-1 animate-spin w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full"></div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onDownload(2)}>
                Download 2x Enhanced
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(4)}>
                Download 4x Enhanced
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-3 border-white/30 border-t-white rounded-full mx-auto mb-3"></div>
              <p className="text-sm font-medium">
                {isUpscaling ? 'AI is upscaling your image for download...' : 'AI is editing your image...'}
              </p>
              <p className="text-xs text-white/80 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isProcessing || isResetting}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Original
        </Button>
        <Button
          variant="outline"
          onClick={onNewImage}
          disabled={isProcessing}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Image
        </Button>
      </div>

      {/* Edit History */}
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <div className="bg-muted rounded-xl p-4 border border-border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full p-0 h-auto justify-between">
              <div className="flex items-center justify-between text-sm w-full">
                <span className="text-muted-foreground">Edits made:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{editCount}</span>
                  {editCount > 0 && (
                    isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            {editHistory.length > 0 && (
              <div className="space-y-3">
                {/* Original Image */}
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                  <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getOptimizedImageUrl(originalUrl, 64, 64, 70)}
                      alt="Original image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Original Image</p>
                    <p className="text-xs text-muted-foreground">Starting point</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRevert(-1)}
                    disabled={isProcessing || isReverting}
                    className="flex-shrink-0"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Revert
                  </Button>
                </div>

                {/* Edit History Items */}
                {editHistory.map((edit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                    <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getOptimizedImageUrl(edit.imageUrl, 64, 64, 70)}
                        alt={`Edit ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Edit {index + 1}</p>
                      <p className="text-xs text-muted-foreground truncate">{edit.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(edit.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {index < editHistory.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRevert(index)}
                        disabled={isProcessing || isReverting}
                        className="flex-shrink-0"
                      >
                        <Undo2 className="w-3 h-3 mr-1" />
                        Revert
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
