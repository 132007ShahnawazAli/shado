/**
 * Color conversion utilities to handle both RGB and LAB color spaces
 * Provides consistent color handling across preview and export
 */

type RGBColor = {
  r: number;
  g: number;
  b: number;
};

type LABColor = {
  l: number;
  a: number;
  b: number;
};

/**
 * Converts LAB color to RGB
 * @param l Lightness (0-100)
 * @param a Green-Red component (-128 to 127)
 * @param b Blue-Yellow component (-128 to 127)
 * @returns RGB color object
 */
export const labToRgb = (l: number, a: number, b: number): RGBColor => {
  // Convert LAB to XYZ
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  // Apply reverse gamma correction
  const invGamma = (t: number) => {
    return t > 0.206893034422 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;
  };

  // Reference white (D65)
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  x = refX * invGamma(x);
  y = refY * invGamma(y);
  z = refZ * invGamma(z);

  // Convert XYZ to RGB (sRGB)
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.2040 + z * 1.0570;

  // Apply gamma correction and clamp to 0-255
  const gammaCorrect = (c: number) => {
    c = c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    return Math.round(Math.max(0, Math.min(1, c)) * 255);
  };

  return {
    r: gammaCorrect(r / 100),
    g: gammaCorrect(g / 100),
    b: gammaCorrect(bVal / 100)
  };
};

/**
 * Parses a CSS color string and converts it to RGB format
 * Supports LAB, RGB, HEX, and named colors
 */
export const parseColorToRgb = (colorStr: string): string => {
  // If it's already an RGB color, return as-is
  if (colorStr.startsWith('rgb(') || colorStr.startsWith('#')) {
    return colorStr;
  }

  // Robust LAB color format: lab(l% a b / alpha) or lab(l% a b)
  // Example: lab(60% -10 30 / 0.8)
  const labMatch = colorStr.match(/^lab\(\s*([\d.]+)%\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  if (labMatch) {
    const l = parseFloat(labMatch[1]);
    const a = parseFloat(labMatch[2]);
    const b = parseFloat(labMatch[3]);
    const alpha = labMatch[4] !== undefined ? parseFloat(labMatch[4]) : 1;
    const { r, g, b: bVal } = labToRgb(l, a, b);
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
    } else {
      return `rgb(${r}, ${g}, ${bVal})`;
    }
  }

  // For other color formats, let the browser handle it
  const div = document.createElement('div');
  div.style.color = colorStr;
  document.body.appendChild(div);
  const rgb = window.getComputedStyle(div).color;
  document.body.removeChild(div);
  // If browser fails to parse, fallback to magenta for visibility
  if (rgb === '' || rgb === 'inherit') {
    console.warn('Failed to parse color:', colorStr);
    return 'rgb(255,0,255)';
  }
  return rgb;
};

/**
 * Converts a color string to a format suitable for CSS
 * If the color is in LAB format, converts it to RGB
 */
export const toCssColor = (colorStr: string): string => {
  return colorStr.trim().startsWith('lab(') 
    ? parseColorToRgb(colorStr) 
    : colorStr;
};

/**
 * Processes gradient colors to ensure they're in a supported format for export
 */
export const processGradientColors = (colors: string[] | string): string[] | string => {
  if (Array.isArray(colors)) {
    return colors.map(color => toCssColor(color));
  } else if (typeof colors === 'string') {
    // Replace all lab(...) occurrences in a gradient string
    return colors.replace(/lab\([^\)]+\)/g, (match) => toCssColor(match));
  }
  return colors;
};
