// Shared export utility for exporting SVG/Canvas as high-res PNG
// Supports retina export, preserves all SVG effects

export interface ExportGradientOptions {
  fileName?: string;
  scale?: number; // e.g., 2 for retina
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
    const width = node.width.baseVal.value || node.getBoundingClientRect().width;
    const height = node.height.baseVal.value || node.getBoundingClientRect().height;
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

  // If HTML, use html2canvas (must be installed as a dependency)
  // This will rasterize the node, including SVG children
  // @ts-ignore
  if (window.html2canvas) {
    // @ts-ignore
    const canvas = await window.html2canvas(node, { scale });
    downloadCanvasAsPng(canvas, fileName);
    return;
  } else {
    // Graceful: throw a custom error for UI to catch
    const error = new Error('Export failed: html2canvas not found. Please install html2canvas or ensure it is loaded on window.');
    (error as any).code = 'HTML2CANVAS_NOT_FOUND';
    throw error;
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
