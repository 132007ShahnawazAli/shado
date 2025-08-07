"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import ShuffleButton from "./ShuffleButton";
import ExportButton from "./ExportButton";
import ExportModal from './ExportModal';
import { cn } from "@/lib/utils";
import { processGradientColors } from "@/lib/colorUtils";

export type BlurryBlobCardProps = {
  colors: string[];
  className?: string;
  variant?: "light" | "dark" | "random";
  key?: string | number;
};

const regions = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

type Region = (typeof regions)[number] | "center";

function getRegionOffset(
  region: Region,
  containerWidth: number,
  containerHeight: number
) {
  const offsetRange = 0.2; // 20% random offset
  const baseOffsets = {
    center: { x: 0.5, y: 0.5 },
    "top-left": { x: 0.25, y: 0.25 },
    "top-right": { x: 0.75, y: 0.25 },
    "bottom-left": { x: 0.25, y: 0.75 },
    "bottom-right": { x: 0.75, y: 0.75 },
  };
  const base = baseOffsets[region];
  return {
    x: (base.x + (Math.random() - 0.5) * offsetRange) * containerWidth,
    y: (base.y + (Math.random() - 0.5) * offsetRange) * containerHeight,
  };
}

type VariantStyle = {
  backgroundColor: string;
  blendMode: string;
  opacity: number;
};

function getVariantStyles(variant: BlurryBlobCardProps["variant"], colors: string[]): VariantStyle {
  switch (variant) {
    case "light":
      return { backgroundColor: "inherit", blendMode: "normal", opacity: 1 };
    case "dark":
      return { backgroundColor: "#0A0A0A", blendMode: "lighten", opacity: 1 };
    case "random":
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return { backgroundColor: randomColor, blendMode: "normal", opacity: 1 };
    default:
      return { backgroundColor: "#FFFFFF", blendMode: "multiply", opacity: 1 }
  }
}

function generateBlobPath(x: number, y: number, size: number) {
  const radius = size / 2;
  return `M ${x} ${y} m ${-radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
}

function BlurryBlobCard({ 
  colors: originalColors, 
  className = "", 
  variant = "dark",
  ...props 
}: BlurryBlobCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobs, setBlobs] = useState<Array<{ path: string; color: string }>>([]);
  
  // Process colors to ensure they're in a valid format and always an array
  const colors = useMemo(() => {
    try {
      const processed = processGradientColors(originalColors);
      return Array.isArray(processed) ? processed : [processed];
    } catch (error) {
      console.error('Error processing colors:', error);
      return originalColors; // Fallback to original colors if processing fails
    }
  }, [originalColors]);

  const [bgStyle, setBgStyle] = useState(getVariantStyles(variant, colors));
  const [showExportModal, setShowExportModal] = useState(false);
  const width = 800; // or get from props/context if dynamic
  const height = 450;

  const generateBlobs = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const blobSize = Math.max(width, height) * 0.8;

    const blobRegions: Region[] = ["center", ...Array.from(regions).sort(() => Math.random() - 0.5)];
    const usedColors = colors.slice(0, Math.min(colors.length, 4));
    const newBlobs = blobRegions.slice(0, usedColors.length).map((region, idx) => {
      const { x, y } = getRegionOffset(region, width, height);
      return {
        path: generateBlobPath(x, y, blobSize),
        color: usedColors[idx]
      };
    });

    setBlobs(newBlobs);
    setBgStyle(getVariantStyles(variant, colors));
  }, [colors, variant]);

  useEffect(() => {
    generateBlobs();
    const resizeObserver = new ResizeObserver(generateBlobs);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [generateBlobs]);

  const handleShuffle = () => {
    generateBlobs();
  };

  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-64 rounded-lg shadow-lg border flex items-center justify-center relative group",
        className
      )}
      style={{ overflow: 'hidden' }}
    >
      <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden">
        <div className="absolute inset-0 w-full h-full rounded-lg transition-colors duration-300" style={bgStyle} />
        <svg ref={svgRef} className="absolute inset-0 w-full h-full rounded-lg pointer-events-none">
          {blobs.map((blob, index) => (
            <path
              key={index}
              d={blob.path}
              fill={blob.color}
              style={{
                filter: "blur(40px)",
                mixBlendMode: bgStyle.blendMode as React.CSSProperties["mixBlendMode"],
                opacity: bgStyle.opacity
              }}
            />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
        <div className="flex justify-end gap-3">
          <ShuffleButton onClick={handleShuffle} aria-label="Shuffle blobs" />
          <ExportButton onClick={() => setShowExportModal(true)} aria-label="Export gradient" />
        </div>
      </div>
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          type="blob"
          colors={colors}
          width={width}
          height={height}
          variant={variant}
          blobs={blobs}
        />
      )}
    </div>
  );
}

export default BlurryBlobCard;
