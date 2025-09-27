
export interface CharacterDesignSettings {
  categories: string[];
  customPrompt: string;
}

export interface CharacterDesign {
  id: string;
  name: string;
  createdAt: string;
  sourceImageCount: number;
  settings: CharacterDesignSettings;
  characterDescription: string;
  finalImageGenPrompt: string;
  imageBase64: string;
}

export interface GenerationResult extends CharacterDesign {
    fileName: string;
}

export type StickerStatus = 'idle' | 'generating_text' | 'generating_image' | 'done' | 'error';

export interface Sticker {
  id: string;
  text: string;
  image: string; // base64
  fileName: string;
  status: StickerStatus;
}
