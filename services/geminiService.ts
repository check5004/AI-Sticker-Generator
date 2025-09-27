import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { CharacterDesignSettings } from '../types';
import { aiConfigManager, AITask, renderTemplate } from './aiConfigService';

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
  
  const config = aiConfigManager.getConfig(AITask.CHARACTER_DESIGN);
  const prompt = renderTemplate(config.prompt, {
      categories: settings.categories.join(', '),
      customPrompt: settings.customPrompt
  });

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
    const config = aiConfigManager.getConfig(AITask.STICKER_TEXT);
    const prompt = renderTemplate(config.prompt, {
        count,
        characterDescription,
        tone: settings.tone,
        decoration: settings.decoration
    });

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

export const generateSuggestions = async (
    type: 'tone' | 'decoration',
    existingSuggestions: string[],
    count: number = 5
): Promise<string[]> => {
    const typeDescription = type === 'tone' ? '口調・雰囲気' : '文字の装飾';
    const examples = type === 'tone'
        ? '例: 「お嬢様風」「武士風」「赤ちゃん言葉」'
        : '例: 「ネオン」「レトロ」「ゴシック」';

    const prompt = `LINEスタンプ作成で使う、スタンプのテキストの「${typeDescription}」の新しいアイデアを${count}個提案してください。
    
以下のリストにあるものは除外してください。
- ${existingSuggestions.join('\n- ')}

# 条件
- 独創的で面白いものを提案してください。
- 10文字以内の短いテキストでお願いします。
${examples}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite", // lite付きのモデルはより軽量な最新のモデル
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            },
        },
    });

    try {
        const json = JSON.parse(response.text);
        return json.suggestions || [];
    } catch (e) {
        console.error("Failed to parse suggestions JSON:", e);
        return [];
    }
};

export const generateStickerImage = async (
    characterImageBase64: string,
    stickerText: string,
    characterDescription: string
) => {
    const config = aiConfigManager.getConfig(AITask.STICKER_IMAGE);
    const prompt = renderTemplate(config.prompt, {
        characterDescription,
        stickerText
    });

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
    const config = aiConfigManager.getConfig(AITask.REVISE_STICKER);
    const prompt = renderTemplate(config.prompt, {
        characterDescription,
        originalText,
        revisionPrompt
    });

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