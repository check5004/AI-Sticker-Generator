> **AIエージェントへの指示:**
> このタスクリストを実行する際は、必ず以下のドキュメントと最新のソースコードを参照してください。
> - 仕様書: `stamp_creation_architecture.md`
>
> また、タスクはチェックボックスの**1項目（サブタスク）**ずつ実行してください。
> 私が次のサブタスクの実行を指示するまで、複数のタスクを同時に進めないでください。

# フェーズ2: スタンプ画像生成フローの抜本的改修 ToDo

## タスク2.1: テキストの画像化機能の実装
- [ ] 新しいユーティリティ関数 `createTextImage(text: string, options: ImageOptions): Promise<string>` を作成する。
- [ ] HTMLのCanvas APIを利用して、引数で受け取った文字列を画像（Base64形式のデータURL）に変換するロジックを実装する。
- [ ] `options`には、フォントサイズ、色、スタイル（文字の装飾設定を反映）、および画像の高さ（設定画面の値）を含める。
- [ ] テキストの長さに応じて画像の幅が自動で調整されるように実装する（`Canvas.measureText`の利用を検討）。

## タスク2.2: 画像一括生成処理のロジック変更
- [ ] `StickerCreationTab.tsx`の`handleGenerateImages`関数を修正し、各スタンプの生成リクエスト前に`createTextImage`を呼び出してテキスト画像を生成するようにする。
- [ ] `geminiService.generateStickerImage`の引数を、`characterImage: string` と `textImage: string` の2つの画像データを受け取るように変更する。
- [ ] `aiConfigService.ts`内の`AITask.STICKER_IMAGE`のプロンプトを、「キャラクター画像」と「テキスト画像」をうまく組み合わせて1枚のスタンプ画像を生成するようAIに指示する内容に変更する。