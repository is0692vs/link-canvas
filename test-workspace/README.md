# テストワークスペース

Link Canvas 拡張機能をテストするためのサンプルコードが含まれています。

## ディレクトリ構成

```
test-workspace/
├── src/
│   ├── main.ts          # メインエントリーポイント
│   └── calculator.ts    # Calculator クラス
├── components/
│   ├── logger.ts        # Logger クラス
│   └── ui.ts            # UIUtils クラス
└── test-workspace.code-workspace
```

## ファイル間の依存関係

```
main.ts
├── Imports: Calculator from './calculator'
├── Imports: Logger from '../components/logger'
└── Uses: Calculator.add(), Calculator.multiply()
         Logger.log()

calculator.ts
└── Uses: private validate() method

logger.ts
└── Provides: Logger class for logging

ui.ts
└── Imports: Logger from './logger'
    Uses: Logger.log()
```

## F5 デバッグ実行時の使用方法

1. Link Canvas 拡張機能をデバッグ実行（F5）
2. デバッグウィンドウでワークスペースを開く
3. アクティビティバーから Link Canvas アイコンをクリック
4. サイドバーのファイルツリーから `main.ts` をクリック
5. キャンバスに依存関係が表示されます
