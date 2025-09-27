> **AIエージェントへの指示:**
> このタスクリストを実行する際は、必ず以下のドキュメントと最新のソースコードを参照してください。
> - 仕様書: `docs/sticker_creation_flow.md`
>
> また、タスクはチェックボックスの**1項目（サブタスク）**ずつ実行してください。
> 私が次のサブタスクの実行を指示するまで、複数のタスクを同時に進めないでください。

# フェーズ7: スタンプ画像の個別再生成と自動リトライ機能 ToDo

## タスク7.1: 個別画像再生成ロジックの実装
- [x] `StickerCreationTab.tsx`内に、単一の`Sticker`オブジェクトを引数として受け取り、そのスタンプの画像生成ロジックのみを非同期で実行する新しい関数 `regenerateSingleStickerImage(stickerToRegen: Sticker)` を作成する。この関数の内部処理は、既存の一括生成関数`handleGenerateImages`から、1スタンプ分の画像生成、状態更新（`generating_image` -> `done` or `error`）、および`generationPayload`の保存処理を抜き出して実装する。

## タスク7.2: UIコンポーネントの追加と接続
- [x] `components/icons.tsx`ファイルに、SVG形式で再生成を表す`RefreshIcon`コンポーネントを新たに追加する。
- [x] `StickerCard.tsx`コンポーネントを修正する。propsに`onRegenerate: (sticker: Sticker) => void;`を追加し、`onDebug`ボタンの隣に新しく`RefreshIcon`を使ったボタンを設置する。このボタンは、クリックされた際に`onRegenerate`プロパティ経由で渡された関数を呼び出すようにする。
- [x] `StickerCreationTab.tsx`内の`StickerCard`コンポーネントの呼び出し部分で、タスク7.1で作成した`regenerateSingleStickerImage`関数を`onRegenerate`プロパティに渡すようにする。

## タスク7.3: 自動リトライ機能の組み込み
- [x] `StickerCreationTab.tsx`の`handleGenerateImages`関数内の`catch`ブロックを修正する。エラー発生時に`console.error`でログを出力した後、そのエラーが発生したスタンプオブジェクトを引数にして、タスク7.1で作成した`regenerateSingleStickerImage`関数を一度だけ呼び出す処理を追加する。