# アプリケーション設定システムのアーキテクチャ

## 1. 目的

このアーキテクチャの主な目的は、アプリケーション内のすべてのAI関連プロンプトと、それ以外の一般設定（UIの挙動など）を、一元的、拡張可能、かつユーザーがカスタマイズ可能なシステムで管理することです。

このシステムは以下を実現します：
- **一元管理**: すべてのデフォルト設定（AIプロンプトと一般設定）をコード内で集約。
- **カスタマイズ性**: ユーザーは設定モーダルを通じてデフォルト設定を上書き可能。
- **永続性**: ユーザーによるカスタマイズはブラウザの`localStorage`に保存され、セッションをまたいで設定が維持される。
- **拡張性**: 将来的に新しいAIタスクや一般設定を追加する際に、最小限のコード変更で済むように設計されている。
- **関心の分離**: AIロジック（`geminiService.ts`内）やUIコンポーネントが、具体的な設定値から分離された。

## 2. 主要コンポーネント

このシステムは、設定データの種類に応じて責務が分離された2つのReact Contextと、それらを管理するUIコンポーネントで構成されています。

### 2.1. AI設定 (`services/aiConfigService.ts` & `contexts/ConfigContext.tsx`)

AIに送信するプロンプトやパラメータを専門に扱います。

- **`services/aiConfigService.ts`**:
    - **`AITask` (Enum)**: AIの操作（例: `CHARACTER_DESIGN`, `STICKER_TEXT`）を型安全に識別します。
    - **`DEFAULT_CONFIGS` (定数)**: すべての`AITask`に対するデフォルトのプロンプトを格納する信頼できる唯一の情報源（Single Source of Truth）です。
    - **`AIConfigManager` (クラス)**: 設定の状態を管理するシングルトンクラス。`localStorage`との読み書きを抽象化し、デフォルト設定とカスタム設定をマージして常に有効な設定を提供します。
    - **`renderTemplate(...)`**: プロンプトテンプレート内のプレースホルダー（例: `{{variable}}`）を実際の値に置き換えるユーティリティ関数です。

- **`contexts/ConfigContext.tsx`**:
    - **`ConfigProvider`**: `aiConfigManager`から初期ロードされた設定状態を保持し、アプリケーション全体に提供します。
    - **`useConfig()`**: コンポーネントが現在のAI設定とそれを更新する関数にアクセスするためのカスタムフックです。

### 2.2. 一般アプリケーション設定 (`contexts/AppSettingsContext.tsx`)

AIプロンプト以外の、アプリケーション全体の挙動に関わる設定を扱います。

- **`types.ts` (`AppSettings` interface)**: 管理対象となる一般設定の型を定義します（例: `textImageHeight: number`）。
- **`contexts/AppSettingsContext.tsx`**:
    - **`DEFAULT_APP_SETTINGS` (定数)**: 一般設定のデフォルト値を定義します。
    - **`AppSettingsProvider`**: `useLocalStorage`フックを利用して、設定状態を`localStorage`と同期させつつ、アプリケーション全体に提供します。
    - **`useAppSettings()`**: コンポーネントが現在の一般設定とそれを更新する関数にアクセスするためのカスタムフックです。

### 2.3. 設定UI (`components/SettingsModal.tsx`)

ユーザーがAI設定と一般設定の両方を閲覧・編集するための統一されたインターフェースです。

- タブを使用して、「AI Prompts」と「一般設定」を切り替えられるようになっています。
- 各設定項目に対応するUI（テキストエリアや数値入力）を提供します。
- `useConfig`と`useAppSettings`の両方のフックを使い、現在の設定値を表示し、ユーザーによる変更を各Contextに保存します。

## 3. データフロー

1.  **初期化**: アプリケーションのルート (`App.tsx`) で `ConfigProvider` と `AppSettingsProvider` がマウントされます。それぞれが `localStorage` からユーザーのカスタム設定を読み込み、状態を初期化します。
2.  **UI表示**: `SettingsModal`コンポーネントは `useConfig()` と `useAppSettings()` を呼び出して現在の設定を取得し、ユーザーが編集できるように表示します。他のコンポーネント（例: `StickerCreationTab`）も同様にフックを使って設定値を読み取ります。
3.  **ユーザーによるカスタマイズ**: ユーザーが`SettingsModal`で変更を保存すると、コンポーネントは対応するContextの更新関数（`updateConfig` or `updateAppSettings`）を呼び出します。
4.  **状態の更新と永続化**: 各Contextは自身の状態を更新します。この状態変更が、Contextを利用しているコンポーネントの再レンダリングを引き起こします。同時に、`useLocalStorage`フックや`AIConfigManager`の内部ロジックにより、変更は自動的に`localStorage`に書き込まれます。
5.  **設定の利用**: AI操作がトリガーされると、`geminiService.ts`は`aiConfigManager.getConfig()`を呼び出して最新のプロンプトを取得します。UIコンポーネント（例: `imageUtils.ts`の`createTextImage`）は`useAppSettings()`で取得した値（例: `textImageHeight`）を使用して動作します。

## 4. 拡張方法

### 4.1. 新しいAIタスクの追加方法

1.  **タスクの定義**: `aiConfigService.ts`の`AITask` enumに新しいキーを追加します。
2.  **デフォルト設定の追加**: `DEFAULT_CONFIGS`オブジェクトに新しいタスクのエントリを追加します。
3.  **サービス関数の実装**: `geminiService.ts`に新しいAPI呼び出し関数を作成し、`aiConfigManager.getConfig(AITask.NEW_TASK)`で設定を取得します。
4.  **UI**: `SettingsModal`は`AITask` enumから自動的に新しい設定項目をリストに表示します。

### 4.2. 新しい一般設定の追加方法

1.  **型の定義**: `types.ts`の`AppSettings` interfaceに新しいプロパティを追加します。
2.  **デフォルト値の追加**: `AppSettingsContext.tsx`の`DEFAULT_APP_SETTINGS`にデフォルト値を追加します。
3.  **UIの実装**: `SettingsModal.tsx`の「一般設定」タブ内に、新しい設定を編集するためのUIコントロール（入力フィールドなど）を追加し、`useAppSettings`フックを使って状態と接続します。
4.  **設定の利用**: アプリケーション内の任意の場所で`useAppSettings()`フックを呼び出し、新しい設定値を取得して利用します。
