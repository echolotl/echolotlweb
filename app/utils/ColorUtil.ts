type RGBColor = { r: number; g: number; b: number };
type OKLCHColor = { l: number; c: number; h: number };

// I lost the gist from where some of these functions were taken from... but credit to those who made them

/**
 * Convert a HEX color to RGB.
 * @param hex - The HEX color string (e.g., "#ffffff" or "#fff").
 * @returns An object representing the RGB values.
 */
export function hexToRgb(hex: string): RGBColor {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  let num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/**
 * Parse a color input (HEX or RGB array) into an RGB object.
 * @param color - The color as a HEX string or an RGB object.
 * @returns An RGB object.
 */
export function parseColor(color: string | RGBColor): RGBColor {
  return typeof color === "string" ? hexToRgb(color) : color;
}

/**
 * Calculate the relative luminance of a color.
 * @param rgb - The RGB object.
 * @returns The relative luminance value.
 */
function luminance({ r, g, b }: RGBColor): number {
  let a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0]! * 0.2126 + a[1]! * 0.7152 + a[2]! * 0.0722;
}

/**
 * Calculate the contrast ratio between two colors.
 * @param color1 - The first color (HEX string or RGB object).
 * @param color2 - The second color (HEX string or RGB object).
 * @returns The contrast ratio.
 */
export function contrastRatio(
  color1: string | RGBColor,
  color2: string | RGBColor,
): number {
  let lum1 = luminance(parseColor(color1));
  let lum2 = luminance(parseColor(color2));
  let brightest = Math.max(lum1, lum2);
  let darkest = Math.min(lum1, lum2);
  return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function rgbToOklch({ r, g, b }: RGBColor): OKLCHColor {
  // Convert RGB to linear sRGB
  const linearize = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rLin = linearize(r);
  const gLin = linearize(g);
  const bLin = linearize(b);

  // Convert linear sRGB to XYZ
  const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.072175;
  const z = rLin * 0.0193339 + gLin * 0.119192 + bLin * 0.9503041;

  // Convert XYZ to OKLab
  const l = 0.2104542553 * x + 0.793617785 * y - 0.0040720468 * z;
  const m = 1.9779984951 * x - 2.428592205 * y + 0.4505937099 * z;
  const s = 0.0259040371 * x + 0.7827717662 * y - 0.808675766 * z;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const L = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bVal =
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  const h = Math.atan2(bVal, a) * (180 / Math.PI);
  return { l: L, c: C, h: (h + 360) % 360 };
}

export function oklchToRgb({ l, c, h }: OKLCHColor): RGBColor {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bVal = c * Math.sin(hRad);

  // Convert OKLCH to OKLab
  const L = l;
  const A = a;
  const B = bVal;

  // Convert OKLab to XYZ
  const lRoot = Math.cbrt(L + 0.3963377774 * A + 0.2158037573 * B);
  const mRoot = Math.cbrt(L - 0.1055613458 * A - 0.0638541728 * B);
  const sRoot = Math.cbrt(L - 0.0894841775 * A - 1.291485548 * B);

  const x = +1.2270138511 * lRoot - 0.5577999807 * mRoot + 0.281256149 * sRoot;
  const y = -0.0405801784 * lRoot + 1.1122568696 * mRoot - 0.0716766787 * sRoot;
  const z = -0.0763812845 * lRoot - 0.4214819784 * mRoot + 1.5861632204 * sRoot;

  // Convert XYZ to linear sRGB
  let rLin = +3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  let gLin = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  let bLin = +0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  // Convert linear sRGB to sRGB
  const delinearize = (c: number) => {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r = Math.min(255, Math.max(0, Math.round(delinearize(rLin) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(delinearize(gLin) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(delinearize(bLin) * 255)));

  return { r, g, b };
}

export function passesContrast(
  color1: string | RGBColor,
  color2: string | RGBColor,
  threshold: number = 4.5,
): boolean {
  const ratio = contrastRatio(color1, color2);
  return ratio >= threshold;
}

// Creates a new color based on color that has sufficient contrast against bgColor (using OKLCH adjustments)
export function autoContrastColor(
  bgColor: string | RGBColor,
  color: string | RGBColor,
  threshold: number = 4.5,
): RGBColor {
  let rgbColor = parseColor(color);
  let rgbBgColor = parseColor(bgColor);
  let oklch = rgbToOklch(rgbColor);
  let step = 0.02;
  let maxIterations = 100;
  let iterations = 0;

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  while (
    !passesContrast(oklchToRgb(oklch), rgbBgColor, threshold) &&
    iterations < maxIterations
  ) {
    const currentRgb = oklchToRgb(oklch);
    const currentRatio = contrastRatio(currentRgb, rgbBgColor);

    const lighter = { ...oklch, l: clamp01(oklch.l + step) };
    const darker = { ...oklch, l: clamp01(oklch.l - step) };
    const lighterRatio = contrastRatio(oklchToRgb(lighter), rgbBgColor);
    const darkerRatio = contrastRatio(oklchToRgb(darker), rgbBgColor);

    if (lighterRatio >= currentRatio && lighterRatio >= darkerRatio) {
      oklch = lighter;
    } else if (darkerRatio >= currentRatio && darkerRatio >= lighterRatio) {
      oklch = darker;
    } else {
      break;
    }
    iterations++;
  }
  return oklchToRgb(oklch);
}

export function rgbColorToHex(rgb: RGBColor): string {
  const toHex = (v: number) => {
    const hex = v.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
