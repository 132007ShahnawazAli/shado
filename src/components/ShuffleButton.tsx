import React from "react";

export interface ShuffleButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  "aria-label"?: string;
}

const ShuffleButton: React.FC<ShuffleButtonProps> = ({ onClick, className = "", "aria-label": ariaLabel = "Shuffle" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium shadow transition-opacity hover:opacity-80 focus:opacity-100 focus:outline-none flex items-center gap-1 ${className}`}
    aria-label={ariaLabel}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline mr-1"
    >
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
    Shuffle
  </button>
);

export default ShuffleButton;
