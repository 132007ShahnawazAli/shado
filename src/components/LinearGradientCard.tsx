import React, { useRef, useMemo, useCallback } from "react";
import ShuffleButton from "./ShuffleButton";
import ExportButton from "./ExportButton";
import ExportModal from './ExportModal';
import { processGradientColors } from "@/lib/colorUtils";

export type LinearGradientCardProps = {
  colors: string[];
  angle?: number;
  className?: string;
  variant?: 'default' | 'smooth';
  key?: string | number;
};

function LinearGradientCard({ 
  colors, 
  angle = 45, 
  className = "", 
  variant = 'default',
  ...props 
}: LinearGradientCardProps) {
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [shuffledColors, setShuffledColors] = React.useState<string[]>([]);
  const [shuffleKey, setShuffleKey] = React.useState(0);
  const width = 800; // or get from props/context if dynamic
  const height = 450;
  const gradientRef = useRef<HTMLDivElement>(null);
  
  // Process colors to ensure they're in a valid format and always an array
  const processedColors = useMemo(() => {
    try {
      const result = processGradientColors(colors);
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Error processing colors:', error);
      return colors; // Fallback to original colors if processing fails
    }
  }, [colors]);

  // Use shuffled colors if available, otherwise use processed colors
  const currentColors = useMemo(() => {
    return shuffledColors.length > 0 ? shuffledColors : processedColors;
  }, [shuffledColors, processedColors]);

  const stops = useMemo(() => {
    if (variant === 'smooth' && currentColors.length >= 3) {
      // For smooth variant, use exactly 3 colors with smooth transitions
      const [color1, color2, color3] = currentColors;
      return [
        `${color1} 0%`,
        `${color2} 50%`,
        `${color3} 100%`
      ];
    }
    // Default variant: use up to 4 colors without position stops
    return currentColors.slice(0, 4);
  }, [variant, currentColors]);

  const gradient = `linear-gradient(${angle}deg, ${stops.join(", ")})`;

  React.useEffect(() => {
    // Reset shuffled colors when original colors change
    setShuffledColors([]);
    setShuffleKey(0);
  }, [colors]);

  const handleShuffle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShuffleKey(prev => prev + 1);
    
    // If colors are already shuffled, reset to original order
    if (shuffledColors.length > 0) {
      setShuffledColors([]);
    } else {
      // Shuffle the colors array
      const shuffled = [...processedColors].sort(() => Math.random() - 0.5);
      setShuffledColors(shuffled);
    }
  }, [processedColors, shuffledColors.length]);

  // handleExport function is removed as per edit hint

  return (
    <div
      ref={gradientRef}
      className={`w-full h-64 rounded-xl shadow-lg border flex items-center justify-center relative group ${className}`}
      style={{ 
        background: gradient,
        transition: "background 0.3s ease-in-out"
      }}
    >
      {/* Optionally show color stops for debugging */}
      {/* <span className="text-xs text-white font-mono bg-black/40 px-2 py-1 rounded">{gradient}</span> */}
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
        <div className="flex justify-end gap-3">
          <ShuffleButton onClick={handleShuffle} aria-label="Shuffle colors" />
          <ExportButton onClick={() => setShowExportModal(true)} aria-label="Export gradient" />
        </div>
      </div>
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          type="linear"
          colors={currentColors}
          angle={angle}
          width={width}
          height={height}
          variant={variant}
        />
      )}
    </div>
  );
}

export default LinearGradientCard;
