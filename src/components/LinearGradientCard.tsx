import React, { useRef } from "react";
import ShuffleButton from "./ShuffleButton";
import ExportButton from "./ExportButton";
import { exportGradient } from "../lib/exportGradient";

export type LinearGradientCardProps = {
  colors: string[];
  angle?: number;
  className?: string;
};

function LinearGradientCard({ colors, angle = 45, className = "" }: LinearGradientCardProps) {
  const [currentColors, setCurrentColors] = React.useState<string[]>(colors);
  const gradientRef = useRef<HTMLDivElement>(null);
  const stops = currentColors.slice(0, 4);
  const gradient = `linear-gradient(${angle}deg, ${stops.join(", ")})`;

  React.useEffect(() => {
    setCurrentColors(colors);
  }, [colors]);

  const handleSwitchColors = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentColors.length > 1) {
      setCurrentColors((prev) => [...prev.slice(1), prev[0]]);
    }
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gradientRef.current) {
      try {
        await exportGradient(gradientRef.current, { fileName: "linear-gradient.png", scale: 2 });
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error?.code === 'HTML2CANVAS_NOT_FOUND') {
          alert('Export failed: html2canvas is not installed. Please install html2canvas to enable exporting gradients as PNG.');
        } else {
          alert('Export failed: ' + (error?.message || 'Unknown error.'));
        }
      }
    }
  };

  return (
    <div
      ref={gradientRef}
      className={`w-full h-64 rounded-xl shadow-lg border flex items-center justify-center relative group ${className}`}
      style={{ background: gradient }}
    >
      {/* Optionally show color stops for debugging */}
      {/* <span className="text-xs text-white font-mono bg-black/40 px-2 py-1 rounded">{gradient}</span> */}
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
        <div className="flex justify-end gap-3">
          <ShuffleButton onClick={handleSwitchColors} aria-label="Shuffle colors" />
          <ExportButton onClick={handleExport} aria-label="Export gradient" />
        </div>
      </div>
    </div>
  );
}

export default LinearGradientCard;
