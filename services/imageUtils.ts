import type { TextImageOptions } from '../types';

interface Style {
    fontFamily: string;
    fontWeight: string;
    shadow?: { color: string; offsetX: number; offsetY: number; blur: number };
    glow?: { blur: number };
}

const mapDecorationToStyle = (decoration: string): Style => {
    let style: Style = {
        fontFamily: '"ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", Meiryo, Osaka, "ＭＳ Ｐゴシック", "MS PGothic", sans-serif',
        fontWeight: 'bold',
    };

    switch (decoration) {
        case '太字':
            style.fontWeight = '900';
            break;
        case 'ゴシック':
            // Default is already gothic-like sans-serif
            break;
        case '筆文字':
        case '手書き風':
            style.fontFamily = '"Yu Mincho", "YuMincho", "ヒラギノ明朝 ProN W3", "Hiragino Mincho ProN", "HG明朝E", "ＭＳ Ｐ明朝", "ＭＳ 明朝", serif';
            break;
        case 'ポップ':
            style.fontFamily = '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';
            style.fontWeight = 'bold';
            style.shadow = { color: 'rgba(0, 0, 0, 0.4)', offsetX: 2, offsetY: 2, blur: 4 };
            break;
        case 'レトロ':
            style.fontFamily = 'serif';
            break;
        case 'ネオン':
            style.glow = { blur: 10 };
            break;
        default:
            // For 'キラキラ', 'ふきだし', 'ドット', etc., we use a clean default.
            // The AI will add the special effects on top of this generated text image.
            break;
    }
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

  // Set canvas dimensions
  const canvasWidth = maxWidth + padding * 2;
  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lineHeight * lines.length;
  // Ensure canvas height is at least the desired height, but expand if text is too tall
  const canvasHeight = Math.max(imageHeight, totalTextHeight + padding * 2);

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
  const startY = (canvasHeight / 2) - (lineHeight * (lines.length - 1) / 2);
  lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, startY + (index * lineHeight));
  });

  // Return base64 data URL content, without the prefix
  return canvas.toDataURL('image/png').split(',')[1];
};
