# Canvas コンテキストメニュー実装ドキュメント

## 概要

Canvas 内の Monaco Editor で右クリックすると、Canvas 固有のコンテキストメニュー項目が表示され、クリックすると定義/参照を Canvas に新しいウィンドウで表示します。

## 実装完了項目

### ✅ 1. Monaco Editor コンテキストメニュー（Webview 側）

**ファイル**: `src/webview/components/MonacoEditor.tsx`

- ✅ `editor.addAction()` でカスタムアクション登録
- ✅ 2 つのアクション:
  - `[Canvas] 定義を表示` (Cmd+Shift+D)
  - `[Canvas] 参照を表示` (Cmd+Shift+R)
- ✅ `contextMenuGroupId: "9_canvas"` でコンテキストメニューに表示
- ✅ `useEffect` でアクション登録（クロージャ問題解決）

**キー実装**:

```typescript
React.useEffect(() => {
  if (!editorRef.current || !monacoRef.current) return;
  registerCustomContextMenuActions(
    editorRef.current,
    monacoRef.current,
    filePath,
    onContextMenu
  );
}, [filePath, onContextMenu]);
```

### ✅ 2. Webview メッセージング（index.tsx）

**ファイル**: `src/webview/index.tsx`

- ✅ `handleContextMenu()` コールバック実装
- ✅ `acquireVsCodeApi().postMessage()` で 2 つのメッセージ送信:
  - `showDefinition` - VSCode 標準 API 実行
  - `showReferences` - VSCode 標準 API 実行
- ✅ 詳細なデバッグログ出力

**メッセージ形式**:

```typescript
{
  type: "showDefinition" | "showReferences",
  filePath: string,
  line: number,      // 0-based
  column: number     // 0-based
}
```

### ✅ 3. 拡張機能ハンドラ（CanvasViewProvider.ts）

**ファイル**: `src/CanvasViewProvider.ts`

- ✅ `onDidReceiveMessage` でメッセージ処理
- ✅ `handleDefinitionRequest()` 実装:
  - `vscode.executeDefinitionProvider` で VSCode 標準 API 実行
  - Location[] を取得
  - 各定義を `addDefinitionToCanvas()` でキャンバスに追加
- ✅ `handleReferencesRequest()` 実装:
  - `vscode.executeReferenceProvider` で VSCode 標準 API 実行
  - Location[] を取得
  - 各参照を `addReferenceToCanvas()` でキャンバスに追加
- ✅ 詳細なデバッグログ（API 実行結果の可視化）

**Location データ構造**:

```typescript
Location {
  uri: Uri,              // ファイルURI
  range: {
    start: { line, character }  // 0-based
  }
}
```

### ✅ 4. ハイライト機能（CodeWindow + MonacoEditor）

**ファイル**: `src/webview/components/CodeWindow.tsx`, `src/webview/components/MonacoEditor.tsx`

- ✅ `CodeWindowData` に `highlightLine`, `highlightColumn` 追加
- ✅ `MonacoEditorComponent` へ props 渡し
- ✅ MonacoEditor の `useEffect` で装飾適用:
  - 黄色背景 (`rgba(255, 200, 0, 0.2)`)
  - オレンジ色ボーダー (`rgba(255, 150, 0, 0.5)`)
  - `editor.revealLineInCenter()` で対象行へスクロール

**実装**:

```typescript
React.useEffect(() => {
  if (!editorRef.current || typeof highlightLine !== "number") {
    editorRef.current?.createDecorationsCollection([]);
    return;
  }

  const editor = editorRef.current;
  const monaco = monacoRef.current;
  const lineNumber = highlightLine + 1; // 0-based → 1-based

  const decorations = [
    {
      range: new monaco.Range(lineNumber, 1, lineNumber, 1000),
      options: {
        isWholeLine: true,
        backgroundColor: "rgba(255, 200, 0, 0.2)",
        borderColor: "rgba(255, 150, 0, 0.5)",
        borderStyle: "solid",
        borderWidth: "1px",
      },
    },
  ];

  editor.createDecorationsCollection(decorations);
  editor.revealLineInCenter(lineNumber);
}, [highlightLine, highlightColumn, fileName]);
```

## テスト手順

### 前提条件

- Link Canvas Webview パネルが開いている
- 複数の CodeWindow が表示されている
- Canvas 内でズームイン状態（Monaco Editor が表示されている）

### テストステップ

1. **コンテキストメニュー表示確認**

   - Canvas のコード部分で右クリック
   - 期待値: "[Canvas] 定義を表示" と "[Canvas] 参照を表示" が表示される

2. **メニュー実行確認**

   - "[Canvas] 定義を表示" をクリック
   - F5 開発者ツール (デバッグコンソール) でログ確認
   - 期待ログ:
     ```
     [Link Canvas] ✓ handleContextMenu 発火
     [Link Canvas] VSCode API 取得成功
     [Link Canvas] 定義メッセージ送信
     [Link Canvas] ✓ 定義/参照リクエスト拡張機能に転送完了
     ```

3. **VSCode API 実行確認**

   - F5 開発者ツール (拡張ホストデバッグコンソール) でログ確認
   - 期待ログ:
     ```
     [Link Canvas] 定義リクエスト処理開始: { filePath, line, column }
     [Link Canvas] VSCode API 実行: vscode.executeDefinitionProvider
     [Link Canvas] 定義取得完了: { count: X, definitions: [...] }
     [Link Canvas] 定義をキャンバスに追加 (数: X)
     ```

4. **新しい CodeWindow 作成確認**

   - Canvas に新しいウィンドウが表示される
   - 期待: 既存ウィンドウの隣に位置

5. **ハイライト表示確認**
   - 新しいウィンドウのコード が黄色でハイライトされる
   - 対象行が画面中央にスクロール
   - 期待: 定義の開始行がハイライト

## デバッグ情報

### コンソールログフィルタリング

**Webview デバッグコンソール** でフィルタ:

```
[Link Canvas]
```

**拡張ホスト デバッグコンソール** でフィルタ:

```
[Link Canvas]
```

### キーボードショートカット

開発中のテスト用:

- **Cmd+Shift+D**: Canvas 定義を表示 (キーバインディング)
- **Cmd+Shift+R**: Canvas 参照を表示 (キーバインディング)

### よくある問題と解決策

**Q: コンテキストメニューが表示されない**

- A: `contextMenuGroupId: "9_canvas"` が設定されているか確認
- A: Monaco Editor がマウントされているか確認 (ズームイン状態)
- A: Webview コンソールで "[Link Canvas] registerCustomContextMenuActions 完了" ログがあるか確認

**Q: メニュー をクリックしても何も起こらない**

- A: `useEffect` で `onContextMenu` コールバックが再登録されているか確認
- A: VSCode API `acquireVsCodeApi()` が正しく初期化されているか確認
- A: Webview デバッグコンソールで "✓ handleContextMenu 発火" ログがあるか確認

**Q: 定義/参照が見つからない**

- A: 拡張ホスト デバッグコンソールで API 実行結果を確認
- A: 言語サーバーが有効になっているか確認 (TypeScript, Python など)
- A: ファイルがプロジェクトルートに含まれているか確認

## ファイル変更一覧

| ファイル                                  | 変更内容                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/webview/components/MonacoEditor.tsx` | コンテキストメニューアクション登録（useEffect で管理） |
| `src/webview/components/CodeWindow.tsx`   | CodeWindowData にハイライトプロパティ追加、props 渡し  |
| `src/webview/index.tsx`                   | handleContextMenu 拡張、VSCode API メッセージング      |
| `src/CanvasViewProvider.ts`               | メッセージハンドラ実装、詳細ログ追加                   |

## 関連するコミット

```
539b97f feat: CanvasViewProvider にて詳細なデバッグログを追加 - API実行結果の可視化
e71daab fix: Monaco Editor コンテキストメニューアクション登録を useEffect に移動 - クロージャ問題を解決
9c65af7 fix: Monaco Editor コンテキストメニュー - contextMenuGroupId を '9_canvas' に変更、keybindings (Cmd+Shift+D/R) を追加
c07460c feat: MonacoEditor ハイライト機能実装 - 対象行を黄色でハイライト表示
23be05a fix: Monaco Editor にカスタムコンテキストメニューアクション登録 - '[Canvas] 定義を表示' '[Canvas] 参照を表示' メニュー表示
```

## 技術仕様

### Monaco Editor API

- `editor.addAction()` - カスタムアクション登録
- `editor.createDecorationsCollection()` - 装飾（ハイライト）適用
- `editor.revealLineInCenter()` - 指定行へスクロール

### VSCode Extension API

- `vscode.executeDefinitionProvider(uri, position)` - 定義取得
- `vscode.executeReferenceProvider(uri, position)` - 参照取得
- `vscode.Location` - ファイル位置情報

### コンテキストメニューグループ

- `navigation` - デフォルト最初
- `1_modification` - 修正コマンド
- `9_canvas` - Canvas カスタムアクション

## 次のステップ（オプション）

- [ ] エラーハンドリング UI 表示（定義/参照がない場合）
- [ ] 複数定義/参照の自動レイアウト
- [ ] キャッシング機構（同じ定義を何度も取得しない）
- [ ] 定義/参照の詳細プレビュー（ホバー表示）
