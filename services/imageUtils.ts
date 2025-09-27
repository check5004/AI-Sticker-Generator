import type { TextImageOptions } from '../types';

interface Style {
    fontFamily: string;
    fontWeight: string;
    shadow?: { color: string; offsetX: number; offsetY: number; blur: number };
    glow?: { blur: number };
}

const mapDecorationToStyle = (decoration: string): Style => {
    let style: Style = {
        fontFamily: '"ＭＳ Ｐゴシック", "MS PGothic", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", Meiryo, Osaka, sans-serif',
        fontWeight: 'bold',
    };

    return style;
};

/**
 * Creates an image from text using Canvas API.
 * @param text The text to render.
 * @param options Options for styling the text image.
 * @returns A promise that resolves to a base64 encoded PNG data string (without the data URL prefix).
 */
export const createTextImage = async (text: string, options: TextImageOptions): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
  }
  
  const { fontSize, fontColor, imageHeight, decorationStyle } = options;
  const style = mapDecorationToStyle(decorationStyle);
  const padding = fontSize; // Padding around text, to give some space and for effects like glow

  // Set font to measure text
  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  
  // Measure text
  const lines = text.split('\n');
  let maxWidth = 0;
  lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) {
          maxWidth = metrics.width;
      }
  });

  // Set canvas dimensions to be a square based on text width
  const canvasWidth = maxWidth + padding * 2;
  const canvasHeight = canvasWidth; // Make canvas square

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Re-apply font and set drawing styles (canvas size change resets context)
  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply special effects from the style object
  if (style.shadow) {
    ctx.shadowColor = style.shadow.color;
    ctx.shadowOffsetX = style.shadow.offsetX;
    ctx.shadowOffsetY = style.shadow.offsetY;
    ctx.shadowBlur = style.shadow.blur;
  } else if (style.glow) {
    // For neon, a simple shadow-based glow is implemented.
    ctx.shadowColor = fontColor; // glow with the same color as the text
    ctx.shadowBlur = style.glow.blur;
  }

  // Draw each line of text
  const lineHeight = fontSize * 1.2;
  const startY = (canvasHeight / 2) - (lineHeight * (lines.length - 1) / 2);
  lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, startY + (index * lineHeight));
  });

  // Return base64 data URL content, without the prefix
  return canvas.toDataURL('image/png').split(',')[1];
};