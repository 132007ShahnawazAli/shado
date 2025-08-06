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
 * Exports a given SVG or HTMLElement node as a high-resolution PNG.
 * Handles SVG rendering and preserves filters, gradients, and blend modes.
 * @param node HTMLElement or SVGElement to export
 * @param options Optional: fileName and scale
 */
export async function exportGradient(
  node: HTMLElement | SVGElement,
  options: ExportGradientOptions = {}
) {
  const { fileName = 'gradient.png', scale = 2 } = options;

  // If SVG, serialize and render to canvas
  if (node instanceof SVGElement) {
    const svgData = new XMLSerializer().serializeToString(node);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    // Use getBoundingClientRect for consistent dimensions across all element types
    const rect = node.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    img.width = width * scale;
    img.height = height * scale;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.onerror = reject;
      img.src = url;
    });
    downloadCanvasAsPng(canvas, fileName);
    return;
  }

  // Dynamically import html2canvas for better compatibility
  let html2canvas: Html2Canvas;
  
  // Try to use html2canvas from window or import it
  if (typeof window.html2canvas === 'function') {
    html2canvas = window.html2canvas;
  } else {
    try {
      const html2canvasModule = await import('html2canvas');
      html2canvas = html2canvasModule.default;
    } catch (importError) {
      throw new Error('Failed to load html2canvas. Please ensure it is installed.');
    }
  }
  
  // Create a clone of the node to avoid affecting the original
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.visibility = 'hidden';
  document.body.appendChild(clone);
  
  try {
    // Configure html2canvas options with proper types
    const options: Html2CanvasOptions = {
      scale: scale || 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: true, // Enable for debugging
      foreignObjectRendering: true,
      onclone: (_: Document, element: HTMLElement) => {
        // Ensure the cloned node has the same dimensions
        const rect = node.getBoundingClientRect();
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.visibility = 'visible';
      }
    };
    
    const canvas = await html2canvas(clone, options);
    downloadCanvasAsPng(canvas, fileName);
  } catch (error) {
    console.error('Export failed:', error);
    
    let errorMessage = 'Failed to export image. ';
    if (isError(error)) {
      errorMessage += error.message;
    }
    
    const exportError = new Error(errorMessage) as Error & { code: string };
    exportError.code = 'EXPORT_FAILED';
    throw exportError;
  } finally {
    // Clean up the cloned node
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);
  }, 'image/png');
}
