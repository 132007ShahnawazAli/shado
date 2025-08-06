import React from "react";

export interface ExportButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, className = "", "aria-label": ariaLabel = "Export", disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium shadow transition-opacity hover:opacity-80 focus:opacity-100 focus:outline-none flex items-center gap-1 ${className}`}
    aria-label={ariaLabel}
    disabled={disabled}
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
      className="inline"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    Export
  </button>
);

export default ExportButton;
