# スタイルカスタマイズ機能 - 実装サマリー

## 概要

Link Canvasに、VSCode設定ファイル（settings.json）を通じてテーマやウィンドウスタイル、フォントをカスタマイズできる機能を実装しました。

## 完了条件の達成状況

✅ **VSCode設定ファイル（settings.json）でのカスタマイズ対応**
- package.jsonに11個の設定項目を定義
- ConfigManagerクラスで設定の読み込みを実装

✅ **テーマ設定（ライト/ダーク/カスタムカラー）**
- 3つのテーマオプション: `light`, `dark`, `custom`
- ライトテーマとダークテーマのプリセットを実装
- カスタムテーマで完全な色制御が可能

✅ **ウィンドウ枠線のスタイル設定（色，太さ，角丸）**
- `linkCanvas.window.borderColor`: 枠線の色
- `linkCanvas.window.borderWidth`: 枠線の太さ（0-10px）
- `linkCanvas.window.borderRadius`: 角丸の大きさ（0-20px）

✅ **背景色のカスタマイズ**
- `linkCanvas.customTheme.backgroundColor`: キャンバス背景色
- `linkCanvas.customTheme.gridColor`: グリッド線の色
- `linkCanvas.window.backgroundColor`: ウィンドウ背景色
- `linkCanvas.window.titleBarColor`: タイトルバー背景色
- `linkCanvas.window.shadowColor`: ウィンドウの影の色

✅ **フォント設定（フォントファミリー，サイズ）**
- `linkCanvas.font.family`: フォントファミリー（空の場合はVSCodeデフォルト）
- `linkCanvas.font.size`: フォントサイズ（8-32px）

✅ **設定変更のリアルタイム反映**
- `vscode.workspace.onDidChangeConfiguration`イベントを監視
- Webviewへの自動メッセージング機能
- CSS変数を使用した即座のスタイル適用

✅ **デフォルト設定の提供**
- DEFAULT_CONFIGオブジェクトでデフォルト値を定義
- ダークテーマをデフォルトとして設定

## 実装ファイル

### 新規作成ファイル

1. **src/ConfigManager.ts**
   - VSCode設定APIのラッパークラス
   - 設定の読み込みと変更監視を担当

2. **src/webview/config.ts**
   - 設定の型定義（`LinkCanvasConfig`）
   - デフォルト設定とテーマプリセット
   - CSS変数への適用ロジック
   - 設定メッセージのパース機能

3. **STYLE_CUSTOMIZATION.md**
   - 詳細な設定ガイド
   - 全設定項目の説明
   - プリセットテーマの紹介
   - 設定例とトラブルシューティング

4. **.vscode/settings.example.json**
   - 設定例ファイル
   - ダークテーマのデフォルト値を記載

### 変更ファイル

1. **package.json**
   - `contributes.configuration`セクションを追加
   - 11個の設定項目を定義

2. **src/CanvasViewProvider.ts**
   - ConfigManagerのインポート
   - 設定変更リスナーの登録
   - Webviewへの設定送信機能（`sendConfig`メソッド）

3. **src/webview/index.tsx**
   - 初期設定の適用
   - 設定更新メッセージのハンドリング
   - 型安全性の向上（`Partial<LinkCanvasConfig>`）

4. **src/webview/components/CodeWindow.css**
   - CSS変数の使用（`var(--lc-*)`）
   - 動的スタイル適用への対応

5. **src/webview/components/InfiniteCanvas.css**
   - 背景色とグリッド色をCSS変数化

6. **src/webview/components/FilePreview.css**
   - フォント設定をCSS変数化

7. **README.md / README.ja.md**
   - 新機能の説明を追加
   - スタイルカスタマイズガイドへのリンク

## 技術的な実装詳細

### アーキテクチャ

```
VSCode Settings (settings.json)
    ↓
ConfigManager.ts (Extension Host)
    ↓ (postMessage)
CanvasViewProvider.ts
    ↓ (webview.postMessage)
index.tsx (Webview)
    ↓
config.ts (parseConfigFromMessage)
    ↓
config.ts (applyConfigToCSS)
    ↓
CSS Variables (--lc-*)
    ↓
DOM Elements
```

### CSS変数の命名規則

- プレフィックス: `--lc-` (Link Canvasの略)
- 背景: `--lc-background-color`, `--lc-grid-color`
- ウィンドウ: `--lc-window-border-color`, `--lc-window-border-width`, etc.
- フォント: `--lc-font-family`, `--lc-font-size`

### リアルタイム反映の仕組み

1. ユーザーがsettings.jsonを変更
2. VSCodeが`onDidChangeConfiguration`イベントを発火
3. ConfigManagerがイベントをキャッチ
4. CanvasViewProviderが新しい設定を読み込み
5. Webviewに`updateConfig`メッセージを送信
6. Webview側で`applyConfigToCSS`を呼び出し
7. CSS変数が更新され、スタイルが即座に反映

### テーマプリセットの実装

- **ライトテーマ**: 明るい背景、黒いグリッド線
- **ダークテーマ**: 暗い背景、白いグリッド線（デフォルト）
- **カスタムテーマ**: 全ての色を個別にカスタマイズ可能

テーマ選択時は、プリセット値が優先されますが、個別の設定で上書きも可能です。

## コード品質

### コードレビュー対応

✅ CSS変数設定ロジックの重複を排除
   - `setWindowStyleProperties`ヘルパー関数を作成

✅ テーマプリセット適用ロジックを改善
   - 明確なフロー: プリセット取得 → 適用 → カスタム設定で上書き

✅ 型安全性の向上
   - `any`型を`Partial<LinkCanvasConfig>`に変更
   - 型エクスポートを追加

### セキュリティチェック

✅ CodeQL分析: 0件のアラート
   - セキュリティ脆弱性なし
   - コードインジェクションのリスクなし

### ビルド

✅ ビルド成功
   - TypeScriptコンパイルエラーなし
   - 全ての依存関係が正しく解決

## 使用例

### 基本的な使い方

```json
{
  "linkCanvas.theme": "dark"
}
```

### カスタムテーマの例

```json
{
  "linkCanvas.theme": "custom",
  "linkCanvas.customTheme.backgroundColor": "#0d1117",
  "linkCanvas.window.borderColor": "#30363d",
  "linkCanvas.window.borderRadius": 12,
  "linkCanvas.font.size": 16
}
```

## 今後の拡張可能性

実装されたアーキテクチャは、今後の拡張に柔軟に対応できます：

1. **追加の設定項目**
   - package.jsonとconfig.tsに項目を追加するだけ
   - CSS変数を追加してスタイルを適用

2. **新しいテーマプリセット**
   - config.tsに新しいプリセットオブジェクトを追加
   - テーマ選択肢を拡張

3. **プラグイン機能**
   - カスタムテーマのインポート/エクスポート
   - コミュニティテーマの共有

## ドキュメント

- **STYLE_CUSTOMIZATION.md**: 詳細な設定ガイド（全設定項目の説明と例）
- **README.md / README.ja.md**: 機能の概要と基本的な使い方
- **.vscode/settings.example.json**: 実際に使える設定例

## まとめ

スタイルカスタマイズ機能は、完了条件の全てを満たし、追加のコード品質改善も実施しました。リアルタイム反映、型安全性、セキュリティの観点からも問題なく、ユーザーが自由にLink Canvasの外観をカスタマイズできるようになりました。
