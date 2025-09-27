import { LOCAL_STORAGE_CONFIG_KEY } from '../constants';
import type { Type } from "@google/genai";

export enum AITask {
  CHARACTER_DESIGN = 'characterDesign',
  STICKER_TEXT = 'stickerText',
  STICKER_IMAGE = 'stickerImage',
  REVISE_STICKER = 'reviseSticker',
}

export interface AIConfig {
    name: string;
    description: string;
    prompt: string;
    // For future expansion, e.g., temperature, topK, etc.
    params?: Record<string, any>; 
}

export type AllAIConfigs = Record<AITask, AIConfig>;

export const DEFAULT_CONFIGS: AllAIConfigs = {
  [AITask.CHARACTER_DESIGN]: {
    name: "キャラクターデザイン生成",
    description: "参考画像と設定から、キャラクター設定と3面図を生成するAIの指示です。",
    prompt: `# 指示
アップロードされた画像を参考に、以下の設定でオリジナルのキャラクターをデザインし、キャラクター設定と、正面・横・後ろ姿がわかる3面図を生成してください。

## キャラクター設定
- カテゴリ: {{categories}}
- 詳細: {{customPrompt}}

## 出力形式
1.  **キャラクター設定**: デザインしたキャラクターの性格や特徴を200文字程度で記述してください。
2.  **3面図**: 生成したキャラクター設定に基づき、1枚の画像に正面、横、後ろ姿を並べた3面図を描画してください。背景は白にしてください。

最後に、この3面図画像に適した英数字のファイル名を提案してください。例: \`character_A_3view.png\`

# ファイル名
`,
  },
  [AITask.STICKER_TEXT]: {
    name: "スタンプテキスト生成",
    description: "キャラクター設定に基づき、LINEスタンプで使えるセリフを生成するAIの指示です。",
    prompt: `以下のキャラクター設定に基づき、LINEスタンプで使えるセリフを{{count}}個提案してください。
    
# キャラクター設定
{{characterDescription}}

# セリフの条件
- 口調・雰囲気: {{tone}}
- 文字の装飾: {{decoration}}
- 15文字以内の短いテキスト

# 追加の指示
{{customPrompt}}
`,
  },
  [AITask.STICKER_IMAGE]: {
    name: "スタンプ画像生成",
    description: "キャラクターの3面図とテキスト画像から、LINEスタンプ画像を生成するAIの指示です。",
    prompt: `# 指示
提供された「キャラクターの3面図」(1枚目の画像)と「テキストの形状見本画像」(2枚目の画像)を組み合わせて、LINEスタンプを1枚生成してください。

## キャラクター設定
{{characterDescription}}

## デザインに関する追加の指示
{{customPrompt}}

## 作成のポイント
- **キャラクターについて**: 「キャラクターの3面図」に描かれているキャラクターのデザイン（見た目、服装、色など）を忠実に再現し、テキストの内容に合った適切なポーズや表情を付けてください。3面図のフォーマット（横長である点）は**絶対に再現しないでください**。
- **テキストの扱いについて**: 「テキストの形状見本画像」は、文字の**正しい形**と**基本的なスタイル**を伝えるための**素材**です。AIはこの画像から文字を抽出し、**レイアウトを完全に再構成**してください。
    - **レイアウトの自由**: 横一列の配置にこだわる必要は**一切ありません**。メッセージが読みやすくなるように、**自由に改行を入れたり、文字を円弧状に配置したり、キャラクターの周りに創造的に配置したり**してください。
    - **装飾**: 「{{decorationStyle}}」というテーマで、文字の形状は維持しつつ、フチ取り、エフェクト、色付けなどの装飾を自由に加えてください。
    - **最終目的**: テキストとキャラクターが、**1:1の正方形のキャンバス**内で最も美しく見えるように配置することが最終目的です。テキスト画像の横長の形状は**完全に無視**してください。
- **背景**: LINEスタンプとして使いやすいように、キャラクターは大きく、背景は透過または白にしてください。
- **最重要 - 出力形式**: 生成する画像は、**必ず1:1の正方形のアスペクト比**にしてください。入力画像が横長であっても、最終的な出力は**絶対に正方形**でなければなりません。

最後に、このスタンプ画像に適した英数字のファイル名を提案してください。例: \`stamp_01_thankyou.png\`

# ファイル名
`,
  },
  [AITask.REVISE_STICKER]: {
    name: "スタンプ画像修正",
    description: "既存のスタンプ画像と修正指示に基づき、画像を再生成するAIの指示です。",
    prompt: `# 指示
提供されたスタンプ画像とキャラクター設定を参考に、以下の修正指示に基づいてLINEスタンプを1枚再生成してください。

## キャラクター設定
{{characterDescription}}

## 元のスタンプテキスト
「{{originalText}}」

## 修正指示
「{{revisionPrompt}}」

## 作成のポイント
- キャラクターのデザイン（見た目、服装、色など）は、元のスタンプ画像のものを忠実に維持してください。
- 修正指示とテキストの内容に合った表情やポーズに変更してください。
- **テキストの再描画について**: もし修正指示にテキストの変更が含まれる場合、AIはテキストを再描画する必要があります。その際は、**1:1の正方形のフォーマット**に収まるように、**自由に改行を入れるなどレイアウトを工夫**してください。ただし、日本語の描画が苦手な場合は、キャラクターの表情やポーズの変更を優先し、テキストはシンプルなゴシック体で読みやすく描画してください。文字が崩れるくらいなら、無理に装飾しないでください。
- **背景**: LINEスタンプとして使いやすいように、キャラクターは大きく、背景は透過または白にしてください。
- **出力テキスト**: もし修正指示にテキストの変更が含まれる場合、修正後のテキストも応答に含めてください。そうでなければ元のテキストをそのまま返してください。
- **最重要 - 出力形式**: 生成する画像は、**必ず1:1の正方形のアスペクト比**にしてください。入力画像が正方形でない場合でも、最終的な出力は**絶対に正方形**でなければなりません。

最後に、このスタンプ画像に適した英数字のファイル名を提案してください。例: \`stamp_01_thankyou_rev1.png\`

応答は以下のフォーマットで厳密に返してください。

# 修正後のテキスト
(ここに修正後のテキストを記述)

# ファイル名
(ここにファイル名を記述)
`,
  },
};

class AIConfigManager {
  private customConfigs: Partial<AllAIConfigs>;

  constructor() {
    this.customConfigs = this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): Partial<AllAIConfigs> {
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.error("Failed to load AI configs from local storage:", error);
      return {};
    }
  }

  private saveToLocalStorage(): void {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(this.customConfigs));
    } catch (error) {
      console.error("Failed to save AI configs to local storage:", error);
    }
  }

  getConfig(task: AITask): AIConfig {
    const defaultConfig = DEFAULT_CONFIGS[task];
    const customConfig = this.customConfigs[task] || {};
    return { ...defaultConfig, ...customConfig };
  }

  getAllConfigs(): AllAIConfigs {
    return (Object.values(AITask)).reduce((acc, task) => {
        acc[task] = this.getConfig(task);
        return acc;
    }, {} as AllAIConfigs);
  }

  updateConfig(task: AITask, newConfig: Partial<AIConfig>): AllAIConfigs {
    this.customConfigs[task] = { ...this.customConfigs[task], ...newConfig };
    this.saveToLocalStorage();
    return this.getAllConfigs();
  }

  resetConfig(task: AITask): AllAIConfigs {
    delete this.customConfigs[task];
    this.saveToLocalStorage();
    return this.getAllConfigs();
  }

  resetAll(): AllAIConfigs {
    this.customConfigs = {};
    window.localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
    return this.getAllConfigs();
  }
}

export const aiConfigManager = new AIConfigManager();

export const renderTemplate = (template: string, context: Record<string, any>): string => {
  return template.replace(/{{(.*?)}}/g, (match, key) => {
    const trimmedKey = key.trim();
    return context.hasOwnProperty(trimmedKey) ? context[trimmedKey] : match;
  });
};