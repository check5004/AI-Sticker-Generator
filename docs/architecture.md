# AI設定システムのアーキテクチャ

## 1. 目的

このアーキテクチャの主な目的は、アプリケーション内のすべてのAI関連プロンプトとパラメータを、一元的、拡張可能、かつユーザーがカスタマイズ可能なシステムで管理することです。以前はプロンプトがサービス関数内に直接ハードコードされており、管理が難しく、ユーザーによる変更は不可能でした。

この新しいシステムは以下を実現します：
- **一元管理**: すべてのデフォルトAIプロンプトを単一のファイルに集約。
- **カスタマイズ性**: ユーザーは新しい設定パネルを通じてデフォルトのプロンプトを上書き可能。
- **永続性**: ユーザーによるカスタマイズはブラウザのローカルストレージに保存され、セッションをまたいで設定が維持される。
- **拡張性**: 将来的に新しいAIタスクを追加する際に、最小限のコード変更で済むように設計されている。
- **関心の分離**: AIロジック（`geminiService.ts`内）が、送信するプロンプトの具体的な内容から分離された。

## 2. 主要コンポーネント

このシステムは、設定データを管理するサービス、そのデータをUIに提供するReact Context、そしてUIコンポーネント自体の3つの主要な柱で構築されています。

### 2.1. `services/aiConfigService.ts`

設定システムの心臓部です。AI設定の読み込み、管理、保存に関するすべてのロジックを担当するシングルトンサービスです。

- **`AITask` (Enum)**: AIの操作（例: `CHARACTER_DESIGN`, `STICKER_TEXT`）を型安全に識別する方法を提供します。これにより、単純な文字列を使用することによるエラーを防ぎます。

- **`DEFAULT_CONFIGS` (定数)**: すべての`AITask`に対するデフォルトのプロンプトと設定を格納する包括的なオブジェクトです。これは、アプリケーションの基本的なAIの振る舞いに関する信頼できる唯一の情報源（Single Source of Truth）として機能します。

- **`AIConfigManager` (クラス)**: 設定の状態を管理するシングルトンクラスです。
    - **`constructor()`**: インスタンス化されると、直ちに`localStorage`からカスタム設定を読み込みます。
    - **`getConfig(task)`**: 特定のタスクの設定を取得するための主要なメソッドです。`DEFAULT_CONFIGS`とユーザーが保存したカスタム設定をインテリジェントにマージし、常に完全で有効な設定が返されるようにします。
    - **`updateConfig(task, newConfig)`**: 特定のタスクのカスタム設定を更新し、すべてのカスタム設定を`localStorage`に保存します。
    - **`resetConfig(task)`**: 特定のタスクのユーザーカスタマイズを状態と`localStorage`から削除し、デフォルト設定に戻します。
    - **`resetAll()`**: すべてのユーザーカスタマイズをクリアし、アプリケーションをデフォルトのプロンプトに完全に戻します。

- **`renderTemplate(template, context)`**: プロンプトテンプレート文字列内のプレースホルダー（例: `{{variable}}`）を実際の値に置き換えるシンプルなユーティリティ関数です。

### 2.2. `contexts/ConfigContext.tsx`

AI設定をReactコンポーネントツリー全体で利用可能にし、設定が変更されたときにコンポーネントが再レンダリングされるようにするために、React Contextを使用します。

- **`ConfigProvider`**: メインの`App`コンポーネントをラップします。`aiConfigManager`から初期ロードされた設定状態を保持し、その状態を更新またはリセットする関数と共に、すべての子コンポーネントに提供します。
- **`useConfig()`**: `ConfigProvider`内の任意のコンポーネントが現在の設定とそれを変更する関数に簡単かつクリーンにアクセスするためのカスタムフックです。

## 3. データフロー

設定データの流れは、単一方向で追跡しやすいように設計されています。

1.  **初期化**: `ConfigProvider`がマウントされ、`aiConfigManager.getAllConfigs()`を呼び出してその状態を初期化します。
2.  **UI表示**: `SettingsModal`コンポーネントが`useConfig()`フックを呼び出して現在の設定を取得し、ユーザーが編集できるようにテキストエリアに表示します。
3.  **ユーザーによるカスタマイズ**: ユーザーが`SettingsModal`で変更を保存すると、コンポーネントは`useConfig()`フックから取得した`updateConfig`関数を呼び出します。
4.  **状態の更新**: `ConfigProvider`内の`updateConfig`関数は、内部的に`aiConfigManager.updateConfig()`メソッドを呼び出して変更を`localStorage`に永続化し、その後、自身の状態を新しい完全な設定セットで更新します。この状態変更が、Contextを利用しているコンポーネントの再レンダリングを引き起こします。
5.  **API呼び出し**: AI操作がトリガーされると（例: スタンプ生成時）、`geminiService.ts`内の関連する関数が直接`aiConfigManager.getConfig()`を呼び出します。これにより、API呼び出しの瞬間に常に最新のプロンプト（デフォルトまたはカスタム）が取得されることが保証されます。

## 4. 新しいAIタスクの追加方法

AIを活用した新機能でシステムを拡張するプロセスは簡単です。

1.  **タスクの定義**: `services/aiConfigService.ts`の`AITask` enumに新しいキーを追加します。
    ```typescript
    export enum AITask {
      // ... 既存のタスク
      NEW_FEATURE = 'newFeature',
    }
    ```
2.  **デフォルト設定の追加**: `DEFAULT_CONFIGS`オブジェクトに新しいタスクのエントリを追加し、その名前、説明、デフォルトプロンプトを定義します。
    ```typescript
    export const DEFAULT_CONFIGS: AllAIConfigs = {
      // ... 既存の設定
      [AITask.NEW_FEATURE]: {
        name: "新しいAI機能",
        description: "この機能の説明です。",
        prompt: `これが新しいAIへの指示です。{{some_variable}} を使えます。`,
      },
    };
    ```
3.  **設定UIの更新**: `SettingsModal`は`AITask` enumに基づいて新しいタスクを自動的に検出して表示するように設計されているため、UIの変更は不要です。
4.  **サービス関数の実装**: `geminiService.ts`に新しいAPI呼び出し関数を作成します。その中で、既存の関数と同様に設定を取得し、プロンプトをレンダリングします。
    ```typescript
    import { aiConfigManager, AITask, renderTemplate } from './aiConfigService';

    export const generateNewFeature = async (some_variable: string) => {
        const config = aiConfigManager.getConfig(AITask.NEW_FEATURE);
        const prompt = renderTemplate(config.prompt, { some_variable });
        // ... promptを使用してGemini API呼び出しを続行
    };
    ```