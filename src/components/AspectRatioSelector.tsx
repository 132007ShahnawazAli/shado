import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_RATIOS = [
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
];

interface AspectRatioSelectorProps {
  onRatioChange: (width: number, height: number) => void;
  initialWidth?: number;
  initialHeight?: number;
  className?: string;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  onRatioChange,
  initialWidth = 800,
  initialHeight = 450, // 16:9 default
  className = '',
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isLocked, setIsLocked] = useState(true);
  const [activePreset, setActivePreset] = useState<number | null>(2); // Default to 1:1

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Update parent when dimensions change
  useEffect(() => {
    onRatioChange(width, height);
  }, [width, height, onRatioChange]);

  // Handle preset selection
  const handlePresetSelect = useCallback((ratioValue: number, index: number) => {
    setActivePreset(index);
    const newHeight = Math.round(width / ratioValue);
    setHeight(newHeight);
  }, [width]);

  // Handle custom dimension changes
  const handleDimensionChange = useCallback((type: 'width' | 'height', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    
    if (type === 'width') {
      setWidth(numValue);
      if (isLocked && activePreset !== null) {
        const ratio = PRESET_RATIOS[activePreset].value;
        setHeight(Math.round(numValue / ratio));
      }
    } else {
      setHeight(numValue);
      if (isLocked && activePreset !== null) {
        const ratio = PRESET_RATIOS[activePreset].value;
        setWidth(Math.round(numValue * ratio));
      }
    }
  }, [isLocked, activePreset]);

  // Toggle aspect ratio lock
  const toggleLock = useCallback(() => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      // When locking, snap to nearest preset
      const currentRatio = width / height;
      const closestPreset = PRESET_RATIOS.reduce((prev, curr, index) => {
        return Math.abs(curr.value - currentRatio) < Math.abs(prev.ratio - currentRatio)
          ? { index, ratio: curr.value }
          : prev;
      }, { index: 0, ratio: PRESET_RATIOS[0].value });
      
      setActivePreset(closestPreset.index);
    }
  }, [isLocked, width, height]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {PRESET_RATIOS.map((preset, index) => (
          <button
            key={preset.label}
            onClick={() => handlePresetSelect(preset.value, index)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activePreset === index
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Width (px)
          </label>
          <input
            type="number"
            min="1"
            value={width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          onClick={toggleLock}
          className="mt-6 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          title={isLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {isLocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Height (px)
          </label>
          <input
            type="number"
            min="1"
            value={height}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="pt-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Aspect Ratio: {width}:{height} ({(width / height).toFixed(2)}:1)
        </div>
      </div>
    </div>
  );
};

export default AspectRatioSelector;
