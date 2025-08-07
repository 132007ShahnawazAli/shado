import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the modal to avoid SSR issues with html2canvas
const ExportModal = dynamic(
  () => import('./ExportModal'),
  { ssr: false }
);

interface GradientExporterProps {
  elementRef: React.RefObject<HTMLElement | SVGElement | HTMLDivElement | null>;
  width: number;
  height: number;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
}

const GradientExporter: React.FC<GradientExporterProps> = ({
  elementRef,
  width,
  height,
  className = '',
  onExportStart,
  onExportComplete,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportStart = () => {
    setIsExporting(true);
    onExportStart?.();
  };

  const handleExportComplete = (success: boolean) => {
    setIsExporting(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    onExportComplete?.(success);
  };

  return (
    <div className={className}>
      <motion.button
        onClick={() => setShowExportModal(true)}
        disabled={isExporting}
        className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          isExporting
            ? 'bg-indigo-400 text-white cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        whileHover={!isExporting ? { scale: 1.03 } : {}}
        whileTap={!isExporting ? { scale: 0.98 } : {}}
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <motion.span
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Exporting...
          </span>
        ) : showSuccess ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Exported!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </span>
        )}
      </motion.button>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        elementRef={elementRef}
        width={width}
        height={height}
        onExportStart={handleExportStart}
        onExportComplete={handleExportComplete}
      />

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Gradient exported successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradientExporter;
