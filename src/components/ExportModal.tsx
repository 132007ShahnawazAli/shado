import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import { processGradientColors, toCssColor } from '@/lib/colorUtils';
import { exportGradientToCanvas } from '@/lib/exportGradient';
import { Download } from 'lucide-react';

type FormatType = 'PNG' | 'JPG' | 'WEBP';
type ScaleFactor = 1 | 2 | 3;

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'linear' | 'blob';
  colors: string[];
  angle?: number;
  width: number;
  height: number;
  variant?: string;
  blobs?: Array<{ path: string; color: string }>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  type,
  colors,
  angle = 90,
  width,
  height,
  variant,
  blobs,
}) => {
  const [scale, setScale] = useState<ScaleFactor>(1);
  const [format, setFormat] = useState<FormatType>('PNG');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState('');

  // Calculate dimensions based on scale
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  
  // Get the element to render (use a ref to avoid re-renders)
  const elementToRender = useRef<HTMLElement | SVGElement | HTMLDivElement | null>(null);

  // Update estimated size when settings change
  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    
    // More accurate size estimation based on format and content complexity
    const baseSize = width * height * scale * scale * 4; // 4 bytes per pixel (RGBA)
    let estimatedBytes = baseSize;

    // Adjust based on format compression and content type
    // Gradients with smooth transitions compress better than photos
    if (format === 'JPG') {
      // JPG is great for photos but can cause banding in gradients
      estimatedBytes *= 0.15; // ~85% compression for gradients
    } else if (format === 'WEBP') {
      // WEBP provides better quality than JPG for gradients
      estimatedBytes *= 0.2; // ~80% compression
    } else {
      // PNG is lossless but larger, especially for gradients
      // Simple gradients compress very well with PNG
      estimatedBytes *= 0.3; // ~70% compression for simple gradients
    }

    // Add a small size buffer for safety
    estimatedBytes *= 1.2;

    // Format size with appropriate units
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${Math.round(bytes)} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    setEstimatedSize(formatSize(estimatedBytes));
  }, [width, height, scale, format]);
  
  // Apply dithering to reduce banding in 8-bit formats
  const applyDithering = async (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D,
    format: FormatType
  ) => {
    if (format === 'PNG') return; // No dithering needed for PNG
    
    // Only apply dithering for 8-bit formats (JPG, WEBP)
    try {
      // Simple ordered dithering to reduce banding
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply a very subtle noise to break up banding
      for (let i = 0; i < data.length; i += 4) {
        // Skip alpha channel
        for (let c = 0; c < 3; c++) {
          // Add a small amount of noise (±2)
          const noise = (Math.random() - 0.5) * 4;
          data[i + c] = Math.max(0, Math.min(255, data[i + c] + noise));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.warn('Error applying dithering:', error);
    }
  };

  // Process element styles for export
  const prepareElementForExport = (element: HTMLElement): HTMLElement => {
    // Create a deep clone of the element
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Process all elements in the clone
    const processElement = (el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      // List of style properties that may contain colors or gradients
      const colorProps = [
        'backgroundColor',
        'color',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'boxShadow',
        'textShadow',
        'backgroundImage',
      ];
      colorProps.forEach((prop) => {
        const val = style.getPropertyValue(prop);
        if (val) {
          try {
            // For gradients, process all colors in the string
            if (prop === 'backgroundImage' && val.includes('gradient')) {
              el.style.backgroundImage = processGradientColors(val) as string;
            } else {
              el.style.setProperty(prop, toCssColor(val));
            }
          } catch (error) {
            console.warn(`Error processing ${prop}:`, error);
            // Fallback to magenta for visibility
            el.style.setProperty(prop, 'rgb(255,0,255)');
          }
        }
      });
    };
    
    // Process the element and all its children
    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        processElement(node as HTMLElement);
        node.childNodes.forEach(processNode);
      }
    };
    
    processNode(clone);
    return clone;
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      await exportGradientToCanvas({
        type,
        colors,
        angle,
        width,
        height,
        scale,
        format: format.toLowerCase(),
        variant,
        blobs,
        fileName: `gradient-${type}`,
        onComplete: () => setExportProgress(100),
      });
      setIsExporting(false);
      setExportProgress(100);
      setTimeout(() => {
        setExportProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-medium text-gray-900 dark:text-white tracking-tight">Export Options</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 transition-colors"
              disabled={isExporting}
              aria-label="Close export modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scale Options */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Scale</h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setScale(value)}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-400/30
                    ${scale === value
                      ? 'bg-black/80 text-white border-black/80'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}
                  `}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>

          {/* Format Options */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Format</h3>
            <div className="flex gap-2">
              {(['PNG', 'JPG', 'WEBP'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-400/30
                    ${format === fmt
                      ? 'bg-black/80 text-white border-black/80'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}
                  `}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Dimensions</div>
              <div className="font-normal text-gray-900 dark:text-white text-sm">{scaledWidth} × {scaledHeight}px</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Estimated Size</div>
              <div className="font-normal text-gray-900 dark:text-white text-sm">{estimatedSize}</div>
            </div>
          </div>

          {/* Progress Bar & Export Button */}
          <div className="flex flex-col gap-2">
            {isExporting && (
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black/80 transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all
                bg-black/80 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-indigo-400/30
                ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
