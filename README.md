# Link Canvas

VSCode 拡張機能として無限キャンバス上でコードの参照関係・呼び出し関係・依存関係を可視化するツール

## 機能

- 📊 コード依存関係の可視化
- 🎨 無限キャンバス上での表示
- 🔗 関数の呼び出し関係を追跡
- 📁 ファイルツリービュー

## インストール

### 前提条件

- Node.js 16 以上
- VSCode 1.80.0 以上

### セットアップ

1. リポジトリをクローン

```bash
git clone https://github.com/is0692vs/link-canvas.git
cd link-canvas
```

2. 依存パッケージをインストール

```bash
npm install
```

3. ビルド

```bash
npm run build
```

## 開発

### ローカルで実行

1. VSCode でプロジェクトを開く

```bash
code .
```

2. F5 キーを押してデバッグ実行を開始

または

```bash
npm run watch
```

で監視モードでビルドしながら開発できます。

### プロジェクト構造

```
link-canvas/
├── src/
│   ├── extension.ts           # Extension本体
│   ├── FileTreeProvider.ts    # ファイルツリービュー
│   ├── CanvasViewProvider.ts  # キャンバスビュー
│   └── webview/
│       └── index.tsx          # Reactコンポーネント
├── resources/
│   └── icon.svg               # アクティビティバーアイコン
├── .vscode/
│   └── launch.json            # デバッグ設定
├── package.json
├── tsconfig.json
├── build.js                   # esbuild設定
└── README.md
```

## 使い方

1. VSCode の左側アクティビティバーから「Link Canvas」アイコンをクリック
2. サイドバーにファイルツリーが表示されます
3. ファイルをクリックするとキャンバスが開き、依存関係が表示されます

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合はまず issue を開いて変更内容を説明してください。
