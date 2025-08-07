// Shared export utility for exporting SVG/Canvas as high-res PNG
// Supports retina export, preserves all SVG effects

// Type declarations for html2canvas
type Html2Canvas = (element: HTMLElement, options?: Html2CanvasOptions) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2Canvas;
  }
}

export interface ExportGradientOptions {
  fileName?: string;
  scale?: number;
}

// Type for html2canvas options
interface Html2CanvasOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string | null;
  logging?: boolean;
  foreignObjectRendering?: boolean;
  onclone?: (document: Document, element: HTMLElement) => void;
}

// Type guard to check if an error is an Error object
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Professional canvas-based export for gradients (linear, blob)
 * @param {Object} params - Gradient export parameters
 * @param {'linear'|'blob'} params.type - Gradient type
 * @param {string[]} params.colors - Array of color stops
 * @param {number} params.angle - Angle for linear gradients
 * @param {number} params.width - Export width
 * @param {number} params.height - Export height
 * @param {number} params.scale - Scale factor (1, 2, 3, ...)
 * @param {string} params.format - 'png' | 'jpg' | 'webp'
 * @param {string} [params.variant] - Variant for blob gradients
 * @param {Array<{path: string, color: string}>} [params.blobs] - Blob data for blob gradients
 * @param {function} [params.onComplete] - Optional callback after export
 */
export async function exportGradientToCanvas({
  type,
  colors,
  angle = 90,
  width,
  height,
  scale = 2,
  format = 'png',
  variant,
  blobs,
  fileName = 'gradient-export',
  onComplete
}) {
  const exportWidth = width * scale;
  const exportHeight = height * scale;
  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  if (type === 'linear') {
    // Linear gradient
    const rad = (angle * Math.PI) / 180;
    const x0 = exportWidth / 2 + (exportWidth / 2) * Math.cos(rad + Math.PI);
    const y0 = exportHeight / 2 + (exportHeight / 2) * Math.sin(rad + Math.PI);
    const x1 = exportWidth / 2 + (exportWidth / 2) * Math.cos(rad);
    const y1 = exportHeight / 2 + (exportHeight / 2) * Math.sin(rad);
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((color, i) => {
      grad.addColorStop(i / (colors.length - 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, exportWidth, exportHeight);
  } else if (type === 'blob' && blobs && blobs.length > 0) {
    // Blurry blob gradient
    // Optionally fill background
    if (variant === 'dark') {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, exportWidth, exportHeight);
    } else if (variant === 'light') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, exportWidth, exportHeight);
    }
    ctx.save();
    ctx.filter = 'blur(40px)';
    blobs.forEach(blob => {
      const path = new Path2D(blob.path);
      ctx.fillStyle = blob.color;
      ctx.globalAlpha = 0.9;
      ctx.fill(path);
    });
    ctx.restore();
  } else {
    // fallback: fill with first color
    ctx.fillStyle = colors[0] || '#fff';
    ctx.fillRect(0, 0, exportWidth, exportHeight);
  }

  // Download
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to create image blob'));
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.${format}`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          onComplete?.(true);
          resolve(true);
        }, 100);
      },
      `image/${format}`,
      format === 'jpg' ? 0.92 : format === 'webp' ? 0.85 : 1
    );
  });
}
