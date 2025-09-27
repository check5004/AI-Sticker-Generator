> **AIエージェントへの指示:**
> このタスクリストを実行する際は、必ず以下のドキュメントと最新のソースコードを参照してください。
> - 仕様書: `docs/sticker_creation_flow.md`
>
> また、タスクはチェックボックスの**1項目（サブタスク）**ずつ実行してください。
> 私が次のサブタ-スクの実行を指示するまで、複数のタスクを同時に進めないでください。

# フェーズ6: スタンプ画像拡大プレビュー機能の実装 ToDo

## タスク6.1: スタンプ画像の拡大表示と操作モーダルの実装
- [x] `components`フォルダに、新しいモーダルコンポーネント`ImagePreviewModal.tsx`を作成する。このモーダルは、中央にスタンプ画像、下部に「AIで修正」ボタンと「ダウンロード」ボタンを配置したレイアウトを持つ。
- [x] `StickerCreationTab.tsx`に、`ImagePreviewModal`の表示状態（boolean）と、拡大表示対象のスタンプオブジェクト（`Sticker | null`）を管理するためのuseStateフックを追加する。
- [x] `StickerCard.tsx`内のスタンプ画像（`<img>`タグ）を`div`や`button`で囲み、クリックイベントを捕捉できるようにする。クリック時に、`StickerCreationTab.tsx`で定義したモーダル表示用のstateを更新する関数を呼び出すように、props経由で関数を渡す。
- [x] `StickerCreationTab.tsx`で、新しく作成した`ImagePreviewModal`をレンダリングし、stateと連携させる。モーダル内の「AIで修正」と「ダウンロード」ボタンが押された際には、既存の`handleOpenRevisionModal`関数と`handleDownloadSingle`関数が、選択されたスタンプを引数にしてそれぞれ実行されるように実装する。