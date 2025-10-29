# Canvas 内コンテキストメニュー機能 - 実装完了

## 実装内容

### 概要
Canvas 上の Monaco Editor 内で右クリックすると、定義と参照を自動取得してキャンバスに新しいCodeWindowで表示する機能。

### メッセージングフロー

```
┌─────────────────────────────────────────────────────────────────┐
│ Monaco Editor (Canvas 内) 右クリック                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. handleEditorContextMenu 発動                                   │
│    - e.preventDefault()                                           │
│    - editor.getPosition() でカーソル位置取得                        │
│    - 選択テキスト or 単語を取得                                     │
│    - onContextMenu コールバック呼び出し                             │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ Props コールバック経由
┌─────────────────────────────────────────────────────────────────┐
│ CodeWindow (onContextMenu props)                                │
│  ↓ Props伝搬                                                    │
│ InfiniteCanvas (onContextMenu props)                            │
│  ↓ Props伝搬                                                    │
│ App (Appコンポーネント)                                          │
├─────────────────────────────────────────────────────────────────┤
│ 2. handleContextMenu 実行                                        │
│    - VSCodeAPI 取得: acquireVsCodeApi()                         │
│    - postMessage({type: 'showDefinition', ...})                │
│    - postMessage({type: 'showReferences', ...})                │
└─────────────────┬───────────────────────────────────────────────┘
                  │ VSCode IPC
                  ↓ (拡張機能ホスト)
┌─────────────────────────────────────────────────────────────────┐
│ 拡張機能 (CanvasViewProvider)                                    │
│ onDidReceiveMessage ハンドラ                                     │
├─────────────────────────────────────────────────────────────────┤
│ 3. message.type === 'showDefinition' の場合                     │
│    → handleDefinitionRequest 呼び出し                           │
│       - vscode.executeDefinitionProvider API 呼び出し            │
│       - Location[] 取得                                         │
│       - 各定義について addDefinitionToCanvas                    │
│         * ファイル読み込み                                       │
│         * webview.postMessage({ type: 'addFile', ... })       │
│                                                                  │
│ 4. message.type === 'showReferences' の場合                     │
│    → handleReferencesRequest 呼び出し                           │
│       - vscode.executeReferenceProvider API 呼び出し             │
│       - Location[] 取得                                         │
│       - 各参照について addReferenceToCanvas                     │
│         * ファイル読み込み                                       │
│         * webview.postMessage({ type: 'addFile', ... })       │
└─────────────────┬───────────────────────────────────────────────┘
                  │ IPC
                  ↓ (Webview)
┌─────────────────────────────────────────────────────────────────┐
│ Webview (App messageHandler)                                    │
│ message.type === 'addFile' の場合                              │
├─────────────────────────────────────────────────────────────────┤
│ 5. 新しいCodeWindow オブジェクト作成                             │
│    - id 生成（filePath ベース）                                 │
│    - classes, functions 抽出                                    │
│    - width: 400, height: 300 デフォルト                         │
│    - position: x = windows.length * 450 + 50, y = 100         │
│    - highlightLine, highlightColumn セット                      │
│                                                                  │
│ 6. setWindows() で状態更新                                       │
│    → 新規ウィンドウのため既存チェック                              │
│    → updated 配列に追加                                        │
│    → resizePlacement メッセージ送信                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │ React State Update
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│ Canvas Render                                                   │
│ - InfiniteCanvas コンポーネント再レンダリング                     │
│ - 新しい CodeWindow が隣に表示                                  │
│ - ハイライト行が正しく表示される                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 実装ファイル一覧

### Webview 側

1. **src/webview/components/MonacoEditor.tsx**
   - Props追加: `filePath`, `onContextMenu`
   - コンテキストメニュー処理: `handleEditorContextMenu`
   - 行/列番号の 1-based → 0-based 変換
   - 選択テキスト/単語取得

2. **src/webview/components/CodeWindow.tsx**
   - Props追加: `onContextMenu`
   - MonacoEditor に`filePath`, `onContextMenu` 渡す

3. **src/webview/components/InfiniteCanvas.tsx**
   - Props追加: `onContextMenu`
   - CodeWindow に`onContextMenu` 渡す

4. **src/webview/index.tsx**
   - `handleContextMenu` コールバック定義
   - VSCodeAPI経由で拡張機能へメッセージ送信
   - InfiniteCanvas に`onContextMenu` 渡す

### 拡張機能側
- **src/CanvasViewProvider.ts** - 既存実装で対応
  - `onDidReceiveMessage` で 'showDefinition'/'showReferences' ハンドル
  - VSCode標準API呼び出し
  - ファイル内容読み込み
  - Webview へ postMessage

## 動作保証

### テスト環境セットアップ
1. `npm run build` 実行
2. VSCode 起動して当拡張機能ロード
3. テストワークスペース開く
4. `openCanvas` コマンドで ファイルをCanvas表示

### テストシナリオ

#### シナリオ 1: 定義表示
1. Shift + ホイール でズームイン （zoom >= 1.0）
2. Monaco Editor が表示
3. 関数呼び出し部分を右クリック（例：`calculator` の `add` を右クリック）
4. **期待結果**:
   - デバッグコンソール:
     ```
     [Link Canvas] コンテキストメニュー呼び出し { line, column, selectedText }
     [Link Canvas] 定義/参照リクエスト拡張機能に転送
     [Link Canvas] 定義表示開始
     [Link Canvas] 定義ファイルをキャンバスに追加
     [Link Canvas] ファイル受信
     [Link Canvas] 新規ウィンドウ作成
     ```
   - Canvas に新しいCodeWindow 表示
   - ハイライト行が黄色など目立つ表示

#### シナリオ 2: 参照表示
1. 定義側のファイルを Canvas 表示
2. 関数定義箇所を右クリック
3. **期待結果**:
   - 複数の新しいCodeWindow が隣に追加
   - 各ウィンドウで参照箇所がハイライト
   - デバッグコンソール:
     ```
     [Link Canvas] 参照表示開始
     [Link Canvas] 参照ファイルをキャンバスに追加 (複数)
     [Link Canvas] 参照数: N
     ```

#### シナリオ 3: エラーハンドリング
1. 選択テキストなしで右クリック
2. **期待結果**: エラーなし、ハング無し
3. 定義/参照なしの場所で右クリック
4. **期待結果**: Canvas に何も追加されない

## 主要な技術仕様

### 行番号・列番号変換
```typescript
// Monaco: 1-based (lineNumber, column)
// VSCode API: 0-based (line, character)
// 拡張機能側では自動変換済み

// Webview 側:
line: position.lineNumber - 1  // 0-based
column: position.column - 1    // 0-based

// ハイライト情報:
highlightLine: definition.range.start.line      // 既に 0-based
highlightColumn: definition.range.start.character // 既に 0-based
```

### ウィンドウ配置ロジック
```typescript
// 新しいウィンドウの位置計算
position: {
  x: windows.length * 450 + 50,  // 横方向に 450px ずつ右へ
  y: 100                           // 縦方向は固定
}
```

### メッセージフォーマット

**Monaco Editor → Webview**
```typescript
// コールバック経由（Props で渡す）
onContextMenu(filePath, line, column, selectedText)
```

**Webview → 拡張機能**
```typescript
{
  type: 'showDefinition' | 'showReferences',
  filePath: string,
  line: number,      // 0-based
  column: number,    // 0-based
}
```

**拡張機能 → Webview**
```typescript
{
  type: 'addFile',
  filePath: string,
  fileName: string,
  content: string,
  highlightLine: number,    // 0-based
  highlightColumn: number,  // 0-based
}
```

## 既知の制限事項

1. **ハイライト表示の実装は未完了**
   - Webview 側で `highlightLine` / `highlightColumn` 受け取り準備済み
   - Monaco Editor での行番号表示がまだ未実装
   - 次ステップ: CodeWindow / FilePreview で ハイライト行 render

2. **複数参照の自動レイアウト**
   - 現在は 450px ずつ右へ配置
   - 画面サイズ超過時の対応未実装

3. **エディタ側コンテキストメニューは廃止**
   - package.json の editor/context メニュー設定は削除推奨
   - Canvas 内機能のみ対応

## 次ステップ

### Phase 2: ハイライト表示実装 🚀
1. CodeWindow で `highlightLine` プロップ受け取り
2. Monaco Editor マウント時に ハイライト範囲セット
3. FilePreview でも対応

### Phase 3: UX改善
1. ウィンドウ自動レイアウト（カスケード配置）
2. メニューUI追加（右クリックでコンテキストメニュー表示？）
3. ハイライト色のカスタマイズ

### Phase 4: 拡張機能
1. キャッシング（同一ファイルの二重読み込み回避）
2. 結果フィルタリング（参照数が多すぎる場合）
3. 履歴管理（戻る/進む）
