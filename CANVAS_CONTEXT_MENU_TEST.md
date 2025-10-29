# Canvas 内コンテキストメニュー機能テスト

## 実装内容

キャンバス内の Monaco Editor で右クリックする際に：

1. **定義を表示**: 関数/クラス定義がある場合、新しい CodeWindow で表示
2. **参照を表示**: 関数/クラスの使用箇所が複数ある場合、各参照箇所を新しい CodeWindow で表示

## 実装ステップ

### ✅ Phase 1: 完了

- MonacoEditor コンポーネントに `filePath` prop 追加
- コンテキストメニュー右クリック時にカーソル位置を取得
- Webview → 拡張機能へ `requestDefinition` / `requestReferences` メッセージ送信
- Webview の messageHandler 拡張

### ⏳ Phase 2: 現在のテスト段階

- 拡張機能側での定義/参照取得（VSCode 標準 API 呼び出し）
- 結果を Webview へ postMessage で返信
- Webview が受信して新しい CodeWindow を作成・追加

## テスト手順

### 前提条件

- `npm run build` で成功している
- VSCode で F5 でデバッグが実行可能

### テスト 1: 基本的なコンテキストメニュー呼び出し

1. F5 でデバッグ起動
2. テストワークスペースを開く
3. `openCanvas` コマンドで main.ts を Canvas 表示
4. Zoom in (Shift + Wheel or Cmd++)
5. Monaco Editor が表示される
6. 関数名を右クリック（例：`calculator` や `add`）
7. **期待結果**: デバッグコンソール に以下のログが出力
   ```
   [Link Canvas] コンテキストメニュー呼び出し { line, column, selectedText }
   [Link Canvas] 定義/参照リクエスト送信
   [Link Canvas] 定義リクエスト受信 / 参照リクエスト受信
   [Link Canvas] 定義リクエスト拡張機能に転送
   ```

### テスト 2: 定義の取得と表示

1. テスト 1 と同じセットアップ
2. 関数呼び出し部分を右クリック（例：main.ts の `calculator.add()` の `add` を右クリック）
3. **期待結果**:
   - Canvas に新しい CodeWindow が隣に追加される
   - そのウィンドウに `calculator.ts` の定義が表示
   - `add` 関数の定義行がハイライト（黄色背景 or 行番号ハイライト）
   - デバッグコンソール:
     ```
     [Link Canvas] 定義ファイルをキャンバスに追加: calculator.ts
     ```

### テスト 3: 参照の取得と表示

1. テスト 1 と同じセットアップ
2. 関数定義部分を右クリック（例：calculator.ts の `export function add()` の `add` を右クリック）
3. **期待結果**:
   - Canvas に複数の新しい CodeWindow が追加される（参照先ごと）
   - 各ウィンドウで参照箇所がハイライト
   - デバッグコンソール:
     ```
     [Link Canvas] 参照ファイルをキャンバスに追加: main.ts
     [Link Canvas] 参照数: N
     ```

### テスト 4: エラーハンドリング

1. 選択テキストなし（空の場所）で右クリック
2. **期待結果**: ハングなし、エラーコンソールも出ない or 適切なエラー表示

3. 定義/参照がない場所で右クリック（例：コメント部分）
4. **期待結果**: Canvas に何も追加されない、エラー表示なし

## デバッグコンソール出力例

### 成功ケース

```
[Link Canvas] コンテキストメニュー呼び出し { line: 4, column: 29, selectedText: "add" }
[Link Canvas] 定義/参照リクエスト送信: { filePath: "/path/to/main.ts", line: 4, column: 29 }
[Link Canvas] 定義リクエスト受信: { filePath: "/path/to/main.ts", line: 4, column: 29, selectedText: "add" }
[Link Canvas] 定義リクエスト拡張機能に転送
[Link Canvas] 定義表示開始: /path/to/main.ts Position: 4 29
[Link Canvas] 定義ファイルをキャンバスに追加: calculator.ts
[Link Canvas] ファイル送信: calculator.ts サイズ: 833
[Link Canvas] ファイル受信: calculator.ts サイズ: 833
[Link Canvas] 新規ウィンドウ作成: window-...-calculator-ts
[Link Canvas] 現在のウィンドウ数: 2
```

### エラーケース

```
[Link Canvas] コンテキストメニュー処理エラー: TypeError
```

## 実装上の注意点

1. **Monaco Editor の mount 完了を待つ**

   - `onMount` コールバック内でのみ操作可能
   - domNode の取得確認必須

2. **ファイルパスの形式**

   - Webview 側: `filePath: filePath` (string)
   - 拡張機能側: `vscode.Uri.file(message.filePath)` に変換

3. **行番号・列番号の 0-based vs 1-based**

   - Monaco: 1-based (lineNumber, column)
   - VSCode API: 0-based (line, character)
   - 変換: `lineNumber - 1`, `column - 1`

4. **Webview メッセージングの流れ**
   ```
   MonacoEditor (contextmenu)
        ↓ postMessage('requestDefinition')
   Webview (messageHandler)
        ↓ postMessage('showDefinition')
   拡張機能 (onDidReceiveMessage)
        ↓ VSCode API 呼び出し
        ↓ postMessage('addFile' with highlight)
   Webview (messageHandler 'addFile')
        ↓ setWindows に追加
   Canvas (新しいCodeWindow 表示)
   ```

## 次のステップ

- ✅ MonacoEditor コンテキストメニュー実装
- ⏳ VSCode API 呼び出しが正しく動作するか確認
- ⏳ 新しい CodeWindow が正しく表示されるか確認
- ⏳ ハイライト行が正しく表示されるか確認
- 🔜 ハイライト行のスタイル調整（見やすくする）
- 🔜 複数参照の場合の自動レイアウト改善
- 🔜 UX 改善（メニュー UI の追加など）
