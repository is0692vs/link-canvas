# Link Canvas - Copilot 開発指示書

## 一般原則

### コミュニケーション

- **言語**: 日本語を使用する
- **ロギング**: デバッグログやコンソール出力の際は、必ず先頭に `[Link Canvas]` を付与する
  - 例: `console.log('[Link Canvas] ズームレベル変更:', zoom);`
- **検索**: 必要に応じて、インターネット検索を行い、最新の情報を取得する

### コード品質

- TypeScript の厳格な型チェックに従う
- React Hooks のルール（`useXXX`は呼び出しのトップレベルのみ）に従う
- パフォーマンス最適化を意識する（不要な再レンダリング回避）

---

## Issue #1: OS ウィンドウ風 UI コンポーネント + ズームレベル切り替え

### 技術仕様

#### 1. ウィンドウコンポーネント構造

- `src/webview/components/CodeWindow.tsx` - ウィンドウのメインコンポーネント
- タイトルバー：ファイル名表示、閉じるボタン
- リサイズハンドル：8 方向（四隅+四辺）
- コンテンツエリア：ズームレベルに応じた表示切り替え

#### 2. スタイリング

- `src/webview/components/CodeWindow.css` を作成
- ウィンドウ外枠：`border: 1px solid #ccc`、`border-radius: 8px`、`box-shadow`
- タイトルバー：高さ 32px、背景色`#f0f0f0`
- 閉じるボタン：右上、`×`アイコン、hover 時に赤色
- リサイズハンドル：8px × 8px、各コーナーと辺に配置

#### 3. ズームレベル取得

- `src/webview/hooks/useZoomLevel.ts` を作成
- `useStore`を使用してズームレベルを取得（`state.transform[2]`）

#### 4. ノード設定

- React Flow に`minZoom={0.1}`、`maxZoom={1.0}`を設定
- `nodeTypes={{ codeWindow: CodeWindowNode }}`でカスタムノード登録

#### 5. CodeWindowNode

- `src/webview/nodes/CodeWindowNode.tsx` を作成
- `useZoomLevel()`でズームレベルを監視
- ズームレベル < 1.0：プレビュー表示（ファイル名 + クラス/関数一覧）
- ズームレベル >= 1.0：Monaco Editor 表示
- トランジション：`opacity 0.3s ease-in-out`

#### 6. プレビュー表示

- `src/webview/components/FilePreview.tsx` を作成
- ファイル名を大きく表示（`font-size: 18px`、`font-weight: bold`）
- クラス名をリスト表示（`font-size: 14px`）
- 関数名をリスト表示（`font-size: 12px`、グレー表示）

#### 7. Monaco Editor 統合

- `src/webview/components/MonacoEditor.tsx` を作成
- オプション：`readOnly: true`、`minimap: { enabled: false }`
- ズームレベル >= 1.0 の時のみマウント

#### 8. リサイズ機能

- `src/webview/hooks/useResize.ts` を作成
- マウスダウン/ムーブ/アップイベントの処理
- 最小サイズ：200px × 150px

#### 9. ノードデータ構造

```typescript
interface CodeWindowData {
  filePath: string;
  fileName: string;
  content: string;
  width: number;
  height: number;
  classes?: string[];
  functions?: string[];
}
```

### 完了条件

- [x] ウィンドウコンポーネントがタイトルバー、閉じるボタン、リサイズハンドルを持つ
- [x] React Flow 上でドラッグ可能
- [x] 8 方向のリサイズハンドルでサイズ変更可能
- [x] ズームレベル < 1.0 でプレビュー表示
- [x] ズームレベル >= 1.0 で Monaco Editor 表示
- [x] ズーム切り替え時にトランジションアニメーション動作
- [x] npm run build が成功
- [ ] F5 デバッグで動作確認可能

### 実装済みコンポーネント

#### 1. ウィンドウコンポーネント

- `src/webview/components/CodeWindow.tsx` - メインのウィンドウコンポーネント
  - タイトルバー（ファイル名、閉じるボタン）
  - 8 方向リサイズハンドル
  - コンテンツエリア（条件分岐レンダリング）
- `src/webview/components/CodeWindow.css` - OS 風 UI のスタイリング

#### 2. ズームレベル管理

- `src/webview/hooks/useZoomLevel.ts` - React Flow のズームレベル取得フック
  - `useStore`でズームレベル（0.1 ～ 1.0）を監視
  - デバッグログ付き

#### 3. プレビュー表示

- `src/webview/components/FilePreview.tsx` - ズームアウト時の表示
  - ファイル名（大きく強調）
  - クラス名一覧
  - 関数名一覧（グレー表示）
- `src/webview/components/FilePreview.css` - プレビュースタイル

#### 4. Monaco Editor 統合

- `src/webview/components/MonacoEditor.tsx` - ズームイン時のコード表示
  - Cmd +/- でフォントサイズ変更
  - Cmd 0 でリセット
  - 言語自動判定
  - リードオンリーモード

#### 5. リサイズ機能

- `src/webview/hooks/useResize.ts` - ウィンドウリサイズフック
  - 8 方向対応
  - 最小サイズ制限（200x150px）
  - マウスイベント管理

#### 6. ノード実装

- `src/webview/nodes/CodeWindowNode.tsx` - React Flow ノード
  - CodeWindow コンポーネントをラップ
  - 接続ハンドル（上下）付き
  - NodeProps 型対応

#### 7. メイン Webview

- `src/webview/index.tsx` - Webview メインコンポーネント
  - nodeTypes 登録（カスタムノードタイプ）
  - minZoom=0.1, maxZoom=1.0 設定
  - テスト用ノード（main.ts）を初期配置

### 実装詳細

#### CodeWindow コンポーネントの動作

```
ズームレベル < 1.0 → FilePreview 表示（軽量）
                  ↓
                トランジション（opacity 0.3s）
                  ↓
ズームレベル >= 1.0 → MonacoEditor 表示（フル機能）
```

#### リサイズハンドルの配置

```
nw  n  ne
w   •  e
sw  s  se
```

#### デバッグログの出力形式

全てのコンソール出力に `[Link Canvas]` プリフィックス付き

```javascript
console.log("[Link Canvas] メッセージ", データ);
```
