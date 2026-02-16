/**
 * Extracts dominant colors from an image using canvas pixel analysis.
 * Returns primary, secondary, and accent colors in hex format.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function isNeutral({ r, g, b }: RGB): boolean {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const { l } = rgbToHsl({ r, g, b });
  return (max - min) < 30 || l > 90 || l < 10;
}

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

export function extractColorsFromImage(imageSrc: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64; // sample at low res for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Collect non-transparent, non-neutral pixels
      const pixels: RGB[] = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue; // skip transparent
        const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
        if (!isNeutral(rgb)) pixels.push(rgb);
      }

      // Fallback: professional blue palette
      if (pixels.length < 10) {
        resolve({ primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b' });
        return;
      }

      // Simple k-means with 5 clusters
      const k = Math.min(5, pixels.length);
      let centroids: RGB[] = pixels.slice(0, k).map(p => ({ ...p }));

      for (let iter = 0; iter < 10; iter++) {
        const clusters: RGB[][] = Array.from({ length: k }, () => []);
        for (const p of pixels) {
          let minD = Infinity, minI = 0;
          for (let c = 0; c < k; c++) {
            const d = colorDistance(p, centroids[c]);
            if (d < minD) { minD = d; minI = c; }
          }
          clusters[minI].push(p);
        }
        centroids = clusters.map((cl, i) => {
          if (cl.length === 0) return centroids[i];
          return {
            r: Math.round(cl.reduce((s, p) => s + p.r, 0) / cl.length),
            g: Math.round(cl.reduce((s, p) => s + p.g, 0) / cl.length),
            b: Math.round(cl.reduce((s, p) => s + p.b, 0) / cl.length),
          };
        });
      }

      // Sort by saturation (most vivid first)
      const sorted = centroids
        .map(c => ({ rgb: c, hsl: rgbToHsl(c) }))
        .filter(c => c.hsl.s > 10)
        .sort((a, b) => b.hsl.s - a.hsl.s);

      const primary = sorted[0]?.rgb ?? { r: 30, g: 64, b: 175 };
      const secondary = sorted[1]?.rgb ?? {
        r: Math.min(255, primary.r + 60),
        g: Math.min(255, primary.g + 60),
        b: Math.min(255, primary.b + 60),
      };

      // Accent: complementary or contrasting color
      const primaryHsl = rgbToHsl(primary);
      const accent = sorted.find(c => Math.abs(c.hsl.h - primaryHsl.h) > 60)?.rgb
        ?? { r: 245, g: 158, b: 11 };

      resolve({
        primary: rgbToHex(primary),
        secondary: rgbToHex(secondary),
        accent: rgbToHex(accent),
      });
    };
    img.onerror = () => {
      resolve({ primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b' });
    };
    img.src = imageSrc;
  });
}

/** Determine if a hex color is dark (for choosing text color) */
export function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
}

/** Lighten a hex color by a factor (0–1) */
export function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return rgbToHex({
    r: Math.min(255, Math.round(r + (255 - r) * factor)),
    g: Math.min(255, Math.round(g + (255 - g) * factor)),
    b: Math.min(255, Math.round(b + (255 - b) * factor)),
  });
}
