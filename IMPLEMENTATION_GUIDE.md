# VSCode 標準 API 統合実装ガイド

## 概要

このブランチ（`feat/vscode-context-menu-integration`）は、VSCode 公式の標準 API を使用して、エディタのコンテキストメニューから定義・参照情報を取得し、Link Canvas キャンバスに表示する機能を実装しています。

**関連 API 仕様**:

- [VSCode: Built-in Commands](https://code.visualstudio.com/api/references/commands)
- [VSCode: Commands Guide](https://code.visualstudio.com/api/extension-guides/command)

## 実装内容

### 1. VSCode 標準 API 使用

| API                                | 用途                     | 戻り値       |
| ---------------------------------- | ------------------------ | ------------ |
| `vscode.executeDefinitionProvider` | シンボルの定義位置を取得 | `Location[]` |
| `vscode.executeReferenceProvider`  | シンボルの参照位置を取得 | `Location[]` |

**Location 型**: ファイルパス、行番号、列番号を含む

```typescript
interface Location {
  uri: Uri; // ファイルのURI
  range: Range; // 位置情報（start.line, start.character）
}
```

### 2. エディタコンテキストメニュー

#### package.json 設定

```json
"editor/context": [
  {
    "command": "linkCanvas.showDefinition",
    "when": "editorTextFocus",
    "group": "linkCanvas@1"
  },
  {
    "command": "linkCanvas.showReferences",
    "when": "editorTextFocus",
    "group": "linkCanvas@2"
  }
]
```

- **when**: エディタにフォーカスがある場合のみ表示
- **group**: 「linkCanvas」グループにまとめて表示

### 3. コマンド実装フロー

```
ユーザー操作
    ↓
エディタで右クリック
    ↓
「Show Definition in Canvas」を選択
    ↓
linkCanvas.showDefinitionコマンド発火
    ↓
canvasProvider.handleShowDefinitionFromContext()
    ↓
vscode.executeDefinitionProvider実行
    ↓
Location[]を取得
    ↓
各ファイルをキャンバスに追加
    ↓
ハイライト情報とともにWebviewに送信
    ↓
キャンバス表示
```

### 4. CanvasViewProvider の拡張メソッド

#### handleShowDefinitionFromContext()

- **トリガー**: エディタコンテキストメニュー「Show Definition in Canvas」
- **処理**:
  1. アクティブなエディタとカーソル位置を取得
  2. `vscode.executeDefinitionProvider`を実行
  3. キャンバスが閉じていれば開く
  4. 各定義ファイルを`addDefinitionToCanvas()`で追加
  5. ハイライト情報（行・列）を Webview に送信

#### handleShowReferencesFromContext()

- **トリガー**: エディタコンテキストメニュー「Show References in Canvas」
- **処理**: `handleShowDefinitionFromContext()`と同じ、ただし`vscode.executeReferenceProvider`を使用

#### addDefinitionToCanvas(definition: Location)

- Location 情報からファイル内容を読み込む
- ファイルパス、ファイル名、コンテンツを取得
- ハイライト対象行・列を含めて Webview に送信

```typescript
webview.postMessage({
  type: "addFile",
  filePath: definition.uri.fsPath,
  fileName: path.basename(definition.uri.fsPath),
  content: content,
  highlightLine: definition.range.start.line,
  highlightColumn: definition.range.start.character,
});
```

### 5. Webview メッセージング

#### 送信（拡張機能 → Webview）

```typescript
// ファイル追加メッセージ
{
  type: 'addFile',
  filePath: string,
  fileName: string,
  content: string,
  highlightLine?: number,   // ハイライト行
  highlightColumn?: number  // ハイライト列
}
```

#### 受信（Webview → 拡張機能）

```typescript
{
  type: 'showDefinition' | 'showReferences',
  filePath: string,
  line: number,
  column: number
}
```

## テスト手順

### 前提条件

- `npm run build` が成功
- F5 デバッグ実行環境あり

### テストシナリオ

#### テスト 1: 定義取得機能

1. **F5**でデバッグ開始（新しい VSCode ウィンドウが開く）
2. ファイルエクスプローラから任意の TypeScript/JavaScript ファイルを開く
3. シンボル（関数名、クラス名、変数など）にカーソルを置く
4. **右クリック** → **「Show Definition in Canvas」**を選択
5. **期待結果**:
   - Link Canvas が自動的に開く
   - 定義されたファイルがキャンバスに表示される
   - ハイライトされた行が視認できる
   - デバッグコンソールに`[Link Canvas] 定義表示開始`が出力される

**確認ポイント**:

```
[Link Canvas] 定義表示開始: /path/to/file.ts Position: 10 5
[Link Canvas] 定義ファイルをキャンバスに追加: target.ts
```

#### テスト 2: 参照取得機能

1. テスト 1 と同じファイルでシンボルを選択
2. **右クリック** → **「Show References in Canvas」**を選択
3. **期待結果**:
   - 参照されている全ファイルがキャンバスに表示される
   - 複数ファイルの場合、各ハイライト位置が異なる
   - デバッグコンソールに`[Link Canvas] 参照数: N`が出力される

#### テスト 3: 定義なし時の処理

1. 標準ライブラリ関数（例：`console.log`）にカーソルを置く
2. **右クリック** → **「Show Definition in Canvas」**を選択
3. **期待結果**:
   - ユーザーメッセージ「定義が見つかりませんでした」が表示される
   - キャンバスは新しいウィンドウを追加しない

**確認ポイント**:

```
[Link Canvas] 定義が見つかりませんでした
```

#### テスト 4: Monaco Editor 表示確認

1. テスト 1 で定義ファイルを追加した状態
2. キャンバスをズームイン（Cmd/Ctrl + マウスホイール）
3. ズームレベルが 1.0 以上になると、Monaco Editor が表示される
4. **期待結果**:
   - ファイルコンテンツがコード表示される
   - ハイライト行が強調表示される
   - シンタックスハイライトが適用されている

#### テスト 5: ハイライト情報の検証

1. テスト 1 で定義ファイルを追加
2. Webview 側でハイライト情報を確認
3. **期待結果**:
   - `highlightLine`と`highlightColumn`がメッセージに含まれている
   - 指定行が UI 上で視覚的に強調される

### エラーハンドリング確認

| シナリオ                   | 期待動作                                             |
| -------------------------- | ---------------------------------------------------- |
| エディタがアクティブでない | エラーメッセージ「アクティブなエディタがありません」 |
| ファイルが存在しない       | コンソールログにエラー出力                           |
| VSCode API が失敗          | ユーザーメッセージとコンソールエラー出力             |
| 複数定義が返される         | すべての定義ファイルをキャンバスに追加               |

## デバッグログ出力

全ログメッセージには`[Link Canvas]`プリフィックスが付与されます。

### 重要なログメッセージ

```
// 定義取得成功
[Link Canvas] 定義表示開始: /path/to/file.ts Position: 10 5
[Link Canvas] 定義ファイルをキャンバスに追加: target.ts

// 参照取得成功
[Link Canvas] 参照表示開始: /path/to/file.ts Position: 10 5
[Link Canvas] 参照ファイルをキャンバスに追加: reference.ts
[Link Canvas] 参照数: 3

// エラー
[Link Canvas] 定義取得エラー: <エラー内容>
```

## VSCode API 仕様との対応

### executeDefinitionProvider

```typescript
// 実装例
const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
  "vscode.executeDefinitionProvider",
  uri, // ファイルURI
  position // カーソル位置
);
```

**公式ドキュメント**: https://code.visualstudio.com/api/references/commands#command_vscode.executeDefinitionProvider

### executeReferenceProvider

```typescript
// 実装例
const references = await vscode.commands.executeCommand<vscode.Location[]>(
  "vscode.executeReferenceProvider",
  uri, // ファイルURI
  position // カーソル位置
);
```

**公式ドキュメント**: https://code.visualstudio.com/api/references/commands#command_vscode.executeReferenceProvider

## トラブルシューティング

### コンテキストメニューが表示されない

1. **確認項目**:

   - `package.json`の`editor/context`メニュー設定を確認
   - `when: "editorTextFocus"`が正しく設定されているか
   - `npm run build`が完了しているか

2. **解決方法**:
   ```bash
   npm run build
   # F5を再度実行（キャッシュクリア）
   ```

### 定義が取得されない

1. **確認項目**:

   - ファイルが言語サーバーでサポートされているか
   - シンボルが定義可能な位置か
   - デバッグコンソールでエラーが出力されていないか

2. **解決方法**:
   - VSCode の標準「定義に移動」（F12）で同じシンボルを確認
   - 言語拡張機能が正しくインストールされているか確認

### ハイライト情報が反映されない

1. **Webview 側の実装確認**:
   - `highlightLine`と`highlightColumn`がメッセージに含まれているか
   - Monaco Editor が正しくレンダリングされているか
   - CSS/UI でハイライトが適用されているか

## 実装の特徴

✅ **VSCode 標準 API**: 公式推奨 API 使用
✅ **エラーハンドリング**: 定義/参照なしの場合も適切に処理
✅ **ユーザーフィードバック**: エラーメッセージで状態を通知
✅ **デバッグログ**: 全処理をトレーサビリティ確保
✅ **多言語対応**: Language Server Protocol 対応の全言語で動作

## 参考資料

- [VSCode API: Commands](https://code.visualstudio.com/api/references/commands)
- [VSCode API: Command Guide](https://code.visualstudio.com/api/extension-guides/command)
- [VSCode: Context Menus](https://code.visualstudio.com/api/extension-guides/command#controlling-when-a-command-shows-up-in-the-command-palette)
- [Link Canvas Design Doc](./CURRENT_STATE.md)
