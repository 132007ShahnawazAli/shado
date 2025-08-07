import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { processGradientColors, toCssColor } from '@/lib/colorUtils';

type GradientType = 'linear' | 'radial' | 'conic';

interface GradientPreviewProps {
  width: number;
  height: number;
  colors: string[];
  type?: GradientType;
  angle?: number;
  className?: string;
  minPreviewSize?: number;
  maxPreviewSize?: number;
  maxWidth?: number | string;
  onSizeChange?: (width: number, height: number) => void;
}

const GradientPreview = React.forwardRef<HTMLDivElement, GradientPreviewProps>(({
  width,
  height,
  colors,
  type = 'linear',
  angle = 90,
  className = '',
  minPreviewSize = 100,
  maxPreviewSize = 400,
  maxWidth = '100%',
  onSizeChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Calculate the preview dimensions while maintaining aspect ratio
  const previewDimensions = useMemo(() => {
    if (!width || !height) return { width: 0, height: 0 };
    
    const aspectRatio = width / height;
    let previewWidth = Math.min(width, maxPreviewSize);
    let previewHeight = previewWidth / aspectRatio;
    
    // Ensure minimum size
    if (previewHeight < minPreviewSize) {
      previewHeight = minPreviewSize;
      previewWidth = previewHeight * aspectRatio;
    }
    
    // Ensure it fits within max size
    if (previewHeight > maxPreviewSize) {
      previewHeight = maxPreviewSize;
      previewWidth = previewHeight * aspectRatio;
    }
    
    return {
      width: Math.round(previewWidth),
      height: Math.round(previewHeight),
    };
  }, [width, height, minPreviewSize, maxPreviewSize]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Process gradient colors for consistent handling
  const processedColors = useMemo(() => processGradientColors(colors), [colors]);

  // Calculate gradient style based on type
  const gradientStyle = useMemo(() => {
    if (type === 'linear') {
      return {
        background: `linear-gradient(${angle}deg, ${processedColors.join(', ')})`,
      };
    } else if (type === 'radial') {
      return {
        background: `radial-gradient(circle at center, ${processedColors.join(', ')})`,
      };
    } else {
      // conic
      return {
        background: `conic-gradient(from ${angle}deg, ${processedColors.join(', ')})`,
      };
    }
  }, [type, angle, colors]);

  // Calculate blur intensity based on preview size (larger preview = more blur)
  const blurIntensity = useMemo(() => {
    const size = Math.max(previewDimensions.width, previewDimensions.height);
    // Base blur + additional blur based on size (capped at 20px)
    return Math.min(20, 8 + (size / 100));
  }, [previewDimensions]);

  // Calculate glow effect
  const glowStyle = useMemo(() => ({
    boxShadow: isHovered 
      ? `0 0 ${blurIntensity * 2}px ${colors[0]}33` 
      : 'none',
    transition: 'box-shadow 0.3s ease-in-out',
  }), [isHovered, colors, blurIntensity]);

  // Calculate aspect ratio
  const aspectRatio = width / height;
  
  // Calculate dimensions that fit within max constraints
  const calculateDimensions = useCallback(() => {
    let containerWidth = typeof maxWidth === 'number' 
      ? Math.min(width, maxWidth as number) 
      : width;
    
    if (typeof maxWidth === 'string' && maxWidth.endsWith('%')) {
      const percent = parseFloat(maxWidth) / 100;
      containerWidth = window.innerWidth * percent;
    }
    
    // Ensure we respect maxPreviewSize
    containerWidth = Math.min(containerWidth, maxPreviewSize);
    
    // Calculate height based on aspect ratio
    const containerHeight = containerWidth / aspectRatio;
    
    // Ensure we respect min/max size constraints
    const finalWidth = Math.max(minPreviewSize, Math.min(containerWidth, maxPreviewSize));
    const finalHeight = finalWidth / aspectRatio;
    
    return { width: finalWidth, height: finalHeight };
  }, [width, height, maxWidth, maxPreviewSize, minPreviewSize, aspectRatio]);
  
  const { width: containerWidth, height: containerHeight } = calculateDimensions();
  
  // Notify parent of size changes
  useEffect(() => {
    onSizeChange?.(containerWidth, containerHeight);
  }, [containerWidth, containerHeight, onSizeChange]);

  return (
    <div 
      ref={(node) => {
        // Forward the ref to both the forwarded ref and the local ref
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        containerRef.current = node;
      }}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: '100%',
        maxWidth,
        aspectRatio: `${width} / ${height}`,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${width}-${height}-${colors.join('-')}`}
          className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 w-full h-full"
          style={{
            ...gradientStyle,
            ...glowStyle,
            width: '100%',
            height: '100%',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            } 
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Grid pattern overlay (subtle) */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              width: '100%',
              height: '100%',
            }}
          />
          
          {/* Dimension overlay (shown on hover) */}
          {isHovered && (
            <motion.div 
              className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              {width} × {height}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

GradientPreview.displayName = 'GradientPreview';

export default GradientPreview;
