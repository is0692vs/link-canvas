# エッジ描画機能ガイド

## 概要

Link Canvas のエッジ描画機能は、ファイル間の依存関係を視覚的に表現するための SVG ベースのシステムです。コードウィンドウ間に矢印付きの線を描画し、インポート関係やその他の依存関係を明示的に示します。

## 機能一覧

### ✅ 実装済み機能

1. **SVG エッジ描画**
   - 二次ベジェ曲線による滑らかな線
   - 始点と終点を結ぶ自動パス計算

2. **矢印マーカー**
   - SVG マーカーによる方向性の表示
   - ホバー時の色変更対応

3. **エッジスタイル設定**
   - 色（`color`）
   - 太さ（`width`）
   - 破線（`dashed`）
   - アニメーション（`animated`）

4. **座標計算システム**
   - ウィンドウの接続ポイント（top/bottom/left/right）
   - ベジェ曲線の制御点自動計算
   - ズーム・パン対応

5. **インタラクティブ機能**
   - クリックイベント（`onEdgeClick`）
   - ホバーハイライト（`onEdgeHover`）
   - ホバー時の線の太さ変更

6. **自動依存関係検出**
   - import 文の解析
   - ファイル名マッチングによる自動エッジ作成
   - 重複エッジの防止

## ファイル構造

```
src/webview/
├── types/
│   └── EdgeData.ts           # エッジデータ型定義
├── components/
│   ├── EdgeCanvas.tsx        # SVGエッジ描画コンポーネント
│   ├── EdgeCanvas.css        # エッジスタイル
│   └── InfiniteCanvas.tsx    # EdgeCanvasを統合
├── index.tsx                 # エッジ状態管理
└── utils.ts                  # エッジID生成ユーティリティ
```

## 使用方法

### 1. エッジデータの定義

```typescript
import type { EdgeData } from "./types/EdgeData";

const edge: EdgeData = {
  id: "edge-1",
  source: "window-id-1",      // 始点ウィンドウのID
  target: "window-id-2",      // 終点ウィンドウのID
  sourceHandle: "right",      // 始点の接続ポイント
  targetHandle: "left",       // 終点の接続ポイント
  style: {
    color: "#888",            // 線の色
    width: 2,                 // 線の太さ
    dashed: false,            // 破線かどうか
    animated: false,          // アニメーション効果
  },
  label: "imports",           // オプション：エッジのラベル
};
```

### 2. エッジの状態管理

```typescript
function App() {
  const [edges, setEdges] = React.useState<EdgeData[]>([]);

  // エッジの追加
  const addEdge = (newEdge: EdgeData) => {
    setEdges((prev) => [...prev, newEdge]);
  };

  // エッジの削除
  const removeEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  return (
    <InfiniteCanvas
      windows={windows}
      edges={edges}
      onEdgeClick={(edgeId) => console.log("Clicked:", edgeId)}
      onEdgeHover={(edgeId) => console.log("Hovered:", edgeId)}
    />
  );
}
```

### 3. 接続ポイントの指定

接続ポイント（handle）は以下の4つから選択できます：

- `"top"`: ウィンドウの上端中央
- `"bottom"`: ウィンドウの下端中央
- `"left"`: ウィンドウの左端中央
- `"right"`: ウィンドウの右端中央（デフォルト）

### 4. エッジスタイルのカスタマイズ

```typescript
// 通常のエッジ
{
  style: { color: "#888", width: 2 }
}

// 破線のエッジ
{
  style: { color: "#666", width: 1, dashed: true }
}

// アニメーション付きエッジ
{
  style: { color: "#4a9eff", width: 3, animated: true }
}
```

## 自動依存関係検出

現在の実装では、新しいファイルが追加されたときに以下の処理が自動的に実行されます：

1. **import 文の解析**
   ```typescript
   import { Calculator } from './calculator';
   // ↓
   // 'calculator' を含むファイルを検索
   ```

2. **ターゲットウィンドウの検索**
   - インポートパスからファイル名を抽出
   - 既存ウィンドウのファイル名と部分一致で検索

3. **エッジの自動作成**
   - マッチするウィンドウが見つかった場合、エッジを自動生成
   - 既存のエッジがある場合は重複作成しない

## イベントハンドラ

### onEdgeClick

エッジがクリックされたときに呼び出されます。

```typescript
const handleEdgeClick = (edgeId: string) => {
  console.log("[Link Canvas] エッジクリック:", edgeId);
  // エッジ情報の表示、削除、編集などの処理
};
```

### onEdgeHover

エッジにマウスカーソルが乗ったとき、または離れたときに呼び出されます。

```typescript
const handleEdgeHover = (edgeId: string | null) => {
  if (edgeId) {
    console.log("[Link Canvas] エッジホバー:", edgeId);
    // ホバー時の処理（ツールチップ表示など）
  } else {
    // ホバー解除時の処理
  }
};
```

## スタイリング

### CSS クラス

- `.edge-canvas`: SVG キャンバス全体
- `.edge-group`: 各エッジのグループ
- `.edge-animated`: アニメーション付きエッジ

### カスタムスタイルの追加

`EdgeCanvas.css` を編集して、独自のスタイルを追加できます：

```css
/* 例：特定のエッジタイプ用のスタイル */
.edge-group.edge-type-dependency {
  stroke: #ff6b6b;
}

.edge-group.edge-type-reference {
  stroke: #4ecdc4;
}
```

## パフォーマンス最適化

### 1. エッジ数の制限

多数のエッジがある場合、パフォーマンスに影響を与える可能性があります。以下の対策を検討してください：

- フィルタリング機能の追加
- ビューポート外のエッジの非表示
- エッジの間引き表示

### 2. ベジェ曲線の簡略化

複雑なベジェ曲線の代わりに直線を使用することでパフォーマンスを向上できます：

```typescript
// EdgeCanvas.tsx で制御点を undefined に設定
return {
  x1: sourcePoint.x,
  y1: sourcePoint.y,
  x2: targetPoint.x,
  y2: targetPoint.y,
  // controlX, controlY を設定しない
};
```

## トラブルシューティング

### エッジが表示されない

1. **ウィンドウ ID の確認**
   - `source` と `target` が正しいウィンドウ ID を指しているか確認

2. **座標の確認**
   - 両方のウィンドウが存在し、有効な座標を持っているか確認
   - コンソールログで警告メッセージを確認

3. **z-index の確認**
   - EdgeCanvas の `z-index` がウィンドウより低いことを確認

### エッジがクリックできない

1. **pointerEvents の確認**
   - 透明な太い線（クリック用）が正しく配置されているか確認

2. **他の要素との重なり**
   - ウィンドウや他の UI 要素が上に重なっていないか確認

### ホバーハイライトが動作しない

1. **イベントハンドラの確認**
   - `onEdgeHover` が正しく渡されているか確認

2. **state の更新**
   - `hoveredEdge` の state が正しく更新されているか確認

## 今後の拡張アイデア

- [ ] エッジラベルの表示位置の最適化
- [ ] 複数のエッジをまとめる機能（バンドリング）
- [ ] エッジの種類ごとの色分け
- [ ] エッジの動的な追加・削除 UI
- [ ] エッジのフィルタリング機能
- [ ] エッジの選択・編集機能
- [ ] エッジのアニメーション効果のカスタマイズ
- [ ] パフォーマンス最適化（仮想化、間引き表示）

## 参考リンク

- [SVG Path Commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- [SVG Markers](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker)
- [Bézier Curves](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)
