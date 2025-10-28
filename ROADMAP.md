# プロジェクト概要

**link-canvas**は，VSCode 拡張機能として無限キャンバス上でコードの参照関係・呼び出し関係・依存関係を可視化するツールです．

**リポジトリ：** [is0692vs/link-canvas](https://github.com/is0692vs/link-canvas)

---

## 🔗 重要リンク

### GitHub

- **リポジトリ**: [is0692vs/link-canvas](https://github.com/is0692vs/link-canvas)
- **Releases**: [Releases](https://github.com/is0692vs/link-canvas/releases)
- **Issues**: [Issues](https://github.com/is0692vs/link-canvas/issues)

### VSCode Marketplace

- **拡張機能ページ**: （未公開）

---

## 開発状況

**現在のフェーズ**: Phase 1 - 基本機能実装

**進捗**: Phase 0 完了，Phase 1 開始準備完了

---

## プロジェクトビジョン（2025-10-28 確定）

**コンセプト**: Figma 風のコードリーディングツール

**VSCode 拡張機能の UI 構造:**

1. **Activity Bar（アクティビティバー）**: 左サイドバーにカスタムボタン追加
2. **Side Bar（サイドバー）**: ファイルツリー表示（VSCode 標準の Tree View 使用）
3. **Main Editor Area（メインエディタエリア）**: Webview でキャンバス表示

**ユーザーフロー:**

1. アクティビティバーのカスタムボタンをクリック
2. サイドバーに VSCode 標準の Tree View（ファイル階層構造）が表示される
3. ファイルをクリック → メインエディタエリアに Webview ベースのキャンバスが開く
4. Webview 内の無限キャンバス上に，クリックしたファイルが OS ウィンドウ風 UI で表示される
5. 追加のファイルをクリックすると，同じキャンバス上に新しいウィンドウとして追加される

**主要機能:**

- 無限キャンバス上に複数のコードウィンドウを配置（OS ウィンドウ風の UI）
- **ウィンドウ UI**: タイトルバー、閉じるボタン、リサイズハンドル、ドラッグ可能
- ズームアウト: ファイル名・クラス名のプレビュー表示で全体俯瞰
- ズームイン（等倍）: Monaco Editor でコード表示
- ウィンドウ間を線で結んで依存関係を可視化
- VSCode 標準 API で定義参照・呼び出し参照を取得

**技術的特徴:**

- VSCode 拡張機能として動作（Activity Bar + Tree View + Webview）
- ズームレベル < 1.0: プレビュー表示（transform の影響を受けない）
- ズームレベル >= 1.0: Monaco Editor 表示（`transform: scale(1)`でカーソル問題回避）
- コード内のズーム: Cmd +/- で fontSize 変更

---

## 技術スタック

- **Frontend**: React 18 + TypeScript
- **キャンバス**: React Flow 12
- **エディタ**: Monaco Editor (@monaco-editor/react)
- **線描画**: SVG
- **コード解析**: TypeScript Compiler API
- **VSCode API**: Definition/Reference Provider
- **通信**: postMessage (Webview ↔ Extension)
- **ビルド**: esbuild

---

## Phase 0: プロジェクトセットアップ

### Issue #0: プロジェクトセットアップ

**完了条件:**

- [x] GitHub リポジトリ作成
- [x] VSCode Extension プロジェクト初期化
- [x] package.json 設定（dependencies, scripts）
- [x] TypeScript 設定（tsconfig.json）
- [x] esbuild 設定（Extension 用と Webview 用の 2 つのバンドル）
- [x] 基本的な Extension コード（extension.ts）
- [x] Webview プロバイダー（CanvasViewProvider.ts）
- [x] React + React Flow の基本実装
- [x] ビルド成功確認
- [x] F5 デバッグ実行確認
- [x] LICENSE（MIT）
- [x] [README.md](http://README.md)作成

**完了レポート:**

- 完了日: 2025 年 10 月 28 日
- 達成事項:

1. **プロジェクト構造**: VSCode 拡張機能の基本構造を完全にセットアップ（Activity Bar，Tree View，Webview Panel）
2. **ビルドシステム**: esbuild による 2 つのバンドル（Extension 本体と Webview）を構築，watch モード対応
3. **Extension 実装**: FileTreeProvider（ファイル階層表示），CanvasViewProvider（キャンバス表示），openCanvas コマンドを実装
4. **Webview 実装**: React 18 + React Flow 12 + Monaco Editor の統合，無限キャンバスの基本 UI
5. **開発環境**: F5 デバッグ実行，TypeScript 厳格モード，DOM 型定義対応
6. **テストワークスペース**: 依存関係を持つサンプルコード（main.ts → calculator.ts/logger.ts，ui.ts → logger.ts）
7. **ドキュメント**: [README.md](http://README.md)，アイコン（SVG），配布設定（.vscodeignore）

**次のステップ**: Issue #1（OS ウィンドウ風 UI コンポーネント + ズームレベル切り替え）

**必要な dependencies:**

- `@types/vscode`
- `react`, `react-dom`
- `@types/react`, `@types/react-dom`
- `@xyflow/react`
- `@monaco-editor/react`
- `typescript`
- `esbuild`

---

## Phase 1: 基本機能実装

### Issue #1: [feat] OS ウィンドウ風 UI コンポーネント + ズームレベル切り替え

**概要:**

OS ウィンドウ風の UI コンポーネントを実装し、ズームレベルに応じて表示を切り替える

**完了条件:**

- [ ] ウィンドウコンポーネントの実装（タイトルバー、閉じるボタン、リサイズハンドル）
- [ ] ウィンドウのドラッグ機能
- [ ] ウィンドウのリサイズ機能
- [ ] React Flow の`useStore`フックでズームレベルを取得
- [ ] ズームレベル < 1.0: プレビュー表示（ファイル名・クラス一覧）
- [ ] ズームレベル >= 1.0: Monaco Editor でコード表示
- [ ] React Flow の maxZoom=1.0, minZoom=0.1 に設定
- [ ] ズーム切り替え時のトランジション

**技術要素:**

- OS ウィンドウ風 UI コンポーネント（CSS + React）
- React Flow `useStore`
- 条件付きレンダリング
- Monaco Editor

**参考:**

- React Flow Contextual Zoom: https://reactflow.dev/examples/interaction/contextual-zoom](https://reactflow.dev/examples/interaction/contextual-zoom](https://reactflow.dev/examples/interaction/contextual-zoom))

---

### Issue #2: [feat] Monaco Editor の Cmd +/- キーバインド

**概要:**

Monaco Editor 内で Cmd +/- で fontSize を変更

**完了条件:**

- [ ] `editor.addCommand()`で Cmd + (fontSize 増加)
- [ ] `editor.addCommand()`で Cmd - (fontSize 減少)
- [ ] `editor.addCommand()`で Cmd 0 (fontSize リセット)
- [ ] fontSize の範囲制限（8px〜30px）
- [ ] React State で fontSize 管理
- [ ] fontSize 変更時の editor.layout()呼び出し

**技術要素:**

- Monaco Editor API
- `monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal/Minus/Digit0`
- React State

---

### Issue #3: [feat] VSCode 標準 API 連携

**概要:**

Monaco Editor 内でクリックした位置の定義参照・呼び出し参照を取得

**完了条件:**

- [ ] Extension 側で`vscode.executeDefinitionProvider`実装
- [ ] Extension 側で`vscode.executeReferenceProvider`実装
- [ ] Webview → Extension への postMessage 実装
- [ ] Extension → Webview への postMessage 実装
- [ ] Monaco Editor の`onMouseDown`で位置情報取得
- [ ] Alt+クリックで定義ジャンプ
- [ ] 取得した参照情報を Webview に返す

**技術要素:**

- VSCode Extension API
- `vscode.executeDefinitionProvider(uri, position)`
- `vscode.executeReferenceProvider(uri, position)`
- postMessage 通信

**実装フロー:**

1. Monaco Editor で Alt+クリック
2. Webview → Extension: `{ type: 'getDefinitions', filePath, position }`
3. Extension: VSCode API で定義を取得
4. Extension → Webview: `{ type: 'definitionsResult', definitions }`
5. Webview で定義先ファイルをキャンバスに追加

---

### Issue #4: [feat] 依存関係のエッジ描画

**概要:**

ファイル間の依存関係を SVG で線として描画

**完了条件:**

- [ ] SVG 要素でノード間を結ぶ線を描画
- [ ] 矢印マーカーの実装
- [ ] エッジのスタイル設定（色、太さ、破線）
- [ ] React Flow のノード位置からエッジ座標を計算
- [ ] エッジのクリックイベント
- [ ] エッジのホバー時ハイライト

**技術要素:**

- SVG `<path>`, `<marker>`, `<defs>`
- React Flow のノード位置情報
- Bézier 曲線

---

### Issue #5: [feat] ファイル解析とクラス/関数の抽出

**概要:**

TypeScript/JavaScript ファイルを解析してクラス名・関数名を抽出

**完了条件:**

- [ ] TypeScript Compiler API でファイル解析
- [ ] クラス名、関数名、インターフェース名を抽出
- [ ] import/export 文の抽出
- [ ] 抽出結果を JSON 形式で保存
- [ ] Webview に解析結果を送信

**技術要素:**

- TypeScript Compiler API (`ts.createProgram`, `ts.forEachChild`)
- AST 走査

**抽出する情報:**

- クラス名 (`class MyClass`)
- 関数名 (`function myFunc()`, `const myFunc = () => {}`)
- インターフェース名 (`interface MyInterface`)
- import/export の依存関係

---

## Phase 2: UX 改善

### Issue #6: [feat] キャンバス状態の保存

**完了条件:**

- [ ] ワークスペースストレージの利用
- [ ] ノード位置の保存
- [ ] ズーム・パン状態の保存
- [ ] 次回起動時に復元

---

### Issue #7: [feat] フィルタリング機能

**完了条件:**

- [ ] ファイル名でフィルター
- [ ] 依存深度でフィルター
- [ ] フィルター UI の実装

---

## Phase 3: 継続的改善

### Issue #8: [docs] ドキュメント整備

**完了条件:**

- [ ] README 詳細版作成
- [ ] コントリビューションガイド
- [ ] デモ GIF 追加

---

### Issue #9: [chore] GitHub Actions CI/CD

**完了条件:**

- [ ] GitHub Actions ワークフロー作成
- [ ] 自動ビルド・テスト
- [ ] 自動バージョニング
- [ ] Marketplace 自動公開

---

## 技術的課題の解決策（確定）

### カーソル問題の解決

**問題:**

- CSS `transform: scale()`で Monaco Editor のカーソル位置がずれる

**解決策:**

- React Flow の maxZoom を 1.0 に制限
- ズームレベル >= 1.0 でのみ Monaco Editor を表示
- `transform: scale(1)`は変換なしと同等のためカーソル問題発生しない

### ズーム機能の実現

**キャンバス全体のズーム:**

- React Flow のズーム（0.1〜1.0）
- ズームアウト: プレビュー表示
- ズームイン（等倍）: コード表示

**コード内のズーム:**

- Cmd +/- で fontSize 変更
- 範囲: 8px〜30px

### パフォーマンス最適化

- ズームアウト時: Monaco Editor 非表示（軽量プレビューのみ）
- ズームイン時: Monaco Editor 表示
- ResizeObserver + editor.layout()でリサイズ対応

---

## 参考資料

### ファクトチェック済み

- ✅ React Flow Contextual Zoom（公式機能）
- ✅ Monaco Editor カスタムキーバインド（実装例多数）
- ✅ React Flow maxZoom 制限（公式サポート）
- ✅ transform: scale(1)ではカーソル問題なし（検証済み）
