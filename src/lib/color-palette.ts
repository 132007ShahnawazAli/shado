import ColorThief from "colorthief";

export async function getImagePalette(imageUrl: string, colorCount: number = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = async () => {
      try {
        const colorThief = new ColorThief();
        // getPalette returns array of [r,g,b]
        const palette: number[][] = colorThief.getPalette(img, colorCount);
        const hexPalette = palette.map(([r, g, b]) => {
          return `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)}`;
        });
        resolve(hexPalette);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for color extraction."));
    };
  });
}
