import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { CharacterDesignSettings } from '../types';

declare var process: {
  env: {
    API_KEY: string;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const parseResponse = (response: GenerateContentResponse): { description: string, imageBase64: string, fileName: string } => {
    let description = '';
    let imageBase64 = '';
    let fileName = `character_${Date.now()}.png`;

    const textParts: string[] = [];
    
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                textParts.push(part.text);
            } else if (part.inlineData) {
                imageBase64 = part.inlineData.data;
            }
        }
    }

    const fullText = textParts.join('\n').trim();
    const fileNameMatch = fullText.match(/# ファイル名\s*`?([a-zA-Z0-9_.]+)`?/);
    if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
        description = fullText.replace(fileNameMatch[0], '').trim();
    } else {
        description = fullText;
    }
    
    return { description, imageBase64, fileName };
}

export const generateCharacterDesign = async (images: File[], settings: CharacterDesignSettings) => {
  const imageParts = await Promise.all(images.map(async (image) => {
    const base64Data = await fileToBase64(image);
    return {
      inlineData: {
        data: base64Data,
        mimeType: image.type,
      },
    };
  }));

  const prompt = `
# 指示
アップロードされた画像を参考に、以下の設定でオリジナルのキャラクターをデザインし、キャラクター設定と、正面・横・後ろ姿がわかる3面図を生成してください。

## キャラクター設定
- カテゴリ: ${settings.categories.join(', ')}
- 詳細: ${settings.customPrompt}

## 出力形式
1.  **キャラクター設定**: デザインしたキャラクターの性格や特徴を200文字程度で記述してください。
2.  **3面図**: 生成したキャラクター設定に基づき、1枚の画像に正面、横、後ろ姿を並べた3面図を描画してください。背景は白にしてください。

最後に、この3面図画像に適した英数字のファイル名を提案してください。例: \`character_A_3view.png\`

# ファイル名
`;

  const contents = {
    parts: [...imageParts, { text: prompt }],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return parseResponse(response);
};


export const generateStickerTexts = async (
    characterDescription: string,
    count: number,
    settings: { tone: string, decoration: string }
): Promise<string[]> => {
    
    const prompt = `
    以下のキャラクター設定に基づき、LINEスタンプで使えるセリフを${count}個提案してください。
    
    # キャラクター設定
    ${characterDescription}

    # セリフの条件
    - 口調・雰囲気: ${settings.tone}
    - 文字の装飾: ${settings.decoration}
    - 15文字以内の短いテキスト
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sticker_texts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            },
        },
    });

    try {
        const json = JSON.parse(response.text);
        return json.sticker_texts || [];
    } catch (e) {
        console.error("Failed to parse sticker texts JSON:", e);
        return Array(count).fill("エラー");
    }
};

export const generateStickerImage = async (
    characterImageBase64: string,
    stickerText: string,
    characterDescription: string
) => {
    const prompt = `
# 指示
提供されたキャラクターの3面図とキャラクター設定を参考に、以下のテキストが入ったLINEスタンプを1枚生成してください。

## キャラクター設定
${characterDescription}

## スタンプのテキスト
「${stickerText}」

## 作成のポイント
- キャラクターは3面図のデザインを忠実に再現してください。
- テキストの内容に合った表情やポーズにしてください。
- LINEスタンプとして使いやすいように、キャラクターは大きく、背景は透過または白にしてください。
- テキストは日本語として正しく、読みやすく描画してください。

最後に、このスタンプ画像に適した英数字のファイル名を提案してください。例: \`stamp_01_thankyou.png\`

# ファイル名
`;

    const contents = {
        parts: [
            { inlineData: { data: characterImageBase64, mimeType: 'image/png' } },
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents,
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const parsed = parseResponse(response);
    return { imageBase64: parsed.imageBase64, fileName: parsed.fileName };
};

const parseRevisionResponse = (response: GenerateContentResponse): { revisedText: string, imageBase64: string, fileName: string } => {
    let revisedText = '';
    let imageBase64 = '';
    let fileName = `sticker_rev_${Date.now()}.png`;
    let fullText = '';

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                fullText += part.text;
            } else if (part.inlineData) {
                imageBase64 = part.inlineData.data;
            }
        }
    }
    fullText = fullText.trim();

    const textMatch = fullText.match(/# 修正後のテキスト\s*([\s\S]*?)\s*(?:# ファイル名|$)/);
    if (textMatch && textMatch[1]) {
        revisedText = textMatch[1].trim();
    }

    const fileNameMatch = fullText.match(/# ファイル名\s*`?([a-zA-Z0-9_.]+)`?/);
    if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
    }
    
    return { revisedText, imageBase64, fileName };
}

export const reviseStickerImage = async (
    originalImageBase64: string,
    originalText: string,
    characterDescription: string,
    revisionPrompt: string
) => {
    const prompt = `
# 指示
提供されたキャラクター、スタンプ画像、テキストを参考に、以下の修正指示に基づいてLINEスタンプを1枚再生成してください。

## キャラクター設定
${characterDescription}

## 元のスタンプテキスト
「${originalText}」

## 修正指示
「${revisionPrompt}」

## 作成のポイント
- キャラクターは3面図のデザインを忠実に再現してください。
- 修正指示とテキストの内容に合った表情やポーズにしてください。
- LINEスタンプとして使いやすいように、キャラクターは大きく、背景は透過または白にしてください。
- テキストは日本語として正しく、読みやすく描画してください。
- もし修正指示にテキストの変更が含まれる場合、修正後のテキストも応答に含めてください。そうでなければ元のテキストをそのまま返してください。

最後に、このスタンプ画像に適した英数字のファイル名を提案してください。例: \`stamp_01_thankyou_rev1.png\`

応答は以下のフォーマットで厳密に返してください。

# 修正後のテキスト
(ここに修正後のテキストを記述)

# ファイル名
(ここにファイル名を記述)
`;

    const contents = {
        parts: [
            { inlineData: { data: originalImageBase64, mimeType: 'image/png' } },
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents,
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return parseRevisionResponse(response);
};
