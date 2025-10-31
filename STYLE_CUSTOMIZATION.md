# Link Canvas スタイルカスタマイズガイド

Link Canvasは、VSCode設定ファイル（settings.json）を通じて、テーマやウィンドウスタイル、フォントなどを柔軟にカスタマイズできます。

## 設定項目一覧

### テーマ設定

#### `linkCanvas.theme`
テーマの選択（ライト/ダーク/カスタム）

- **型**: `string`
- **選択肢**: `"light"`, `"dark"`, `"custom"`
- **デフォルト**: `"dark"`

```json
{
  "linkCanvas.theme": "dark"
}
```

### カスタムテーマ設定

#### `linkCanvas.customTheme.backgroundColor`
カスタムテーマの背景色（テーマが`"custom"`の時のみ有効）

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"#1e1e1e"`

```json
{
  "linkCanvas.customTheme.backgroundColor": "#1e1e1e"
}
```

#### `linkCanvas.customTheme.gridColor`
カスタムテーマのグリッド線の色（テーマが`"custom"`の時のみ有効）

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"rgba(255, 255, 255, 0.05)"`

```json
{
  "linkCanvas.customTheme.gridColor": "rgba(255, 255, 255, 0.05)"
}
```

### ウィンドウスタイル設定

#### `linkCanvas.window.borderColor`
ウィンドウの枠線の色

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"#cccccc"`

```json
{
  "linkCanvas.window.borderColor": "#cccccc"
}
```

#### `linkCanvas.window.borderWidth`
ウィンドウの枠線の太さ

- **型**: `number` (px)
- **範囲**: 0～10
- **デフォルト**: `1`

```json
{
  "linkCanvas.window.borderWidth": 1
}
```

#### `linkCanvas.window.borderRadius`
ウィンドウの角丸の大きさ

- **型**: `number` (px)
- **範囲**: 0～20
- **デフォルト**: `8`

```json
{
  "linkCanvas.window.borderRadius": 8
}
```

#### `linkCanvas.window.backgroundColor`
ウィンドウの背景色

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"#ffffff"`

```json
{
  "linkCanvas.window.backgroundColor": "#ffffff"
}
```

#### `linkCanvas.window.titleBarColor`
ウィンドウのタイトルバーの背景色

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"#f0f0f0"`

```json
{
  "linkCanvas.window.titleBarColor": "#f0f0f0"
}
```

#### `linkCanvas.window.shadowColor`
ウィンドウの影の色

- **型**: `string` (CSSカラー値)
- **デフォルト**: `"rgba(0, 0, 0, 0.15)"`

```json
{
  "linkCanvas.window.shadowColor": "rgba(0, 0, 0, 0.15)"
}
```

### フォント設定

#### `linkCanvas.font.family`
フォントファミリー

- **型**: `string`
- **デフォルト**: `""` (空の場合はVSCodeのデフォルトフォントを使用)

```json
{
  "linkCanvas.font.family": "Consolas, 'Courier New', monospace"
}
```

#### `linkCanvas.font.size`
フォントサイズ

- **型**: `number` (px)
- **範囲**: 8～32
- **デフォルト**: `14`

```json
{
  "linkCanvas.font.size": 14
}
```

## プリセットテーマ

### ダークテーマ（デフォルト）

```json
{
  "linkCanvas.theme": "dark"
}
```

このテーマは以下の設定を自動的に適用します：
- 背景色: `#1e1e1e`
- グリッド線: `rgba(255, 255, 255, 0.05)`
- ウィンドウ背景: `#252526`
- タイトルバー: `#2d2d30`
- 枠線: `#3c3c3c`
- 影: `rgba(0, 0, 0, 0.5)`

### ライトテーマ

```json
{
  "linkCanvas.theme": "light"
}
```

このテーマは以下の設定を自動的に適用します：
- 背景色: `#ffffff`
- グリッド線: `rgba(0, 0, 0, 0.05)`
- ウィンドウ背景: `#ffffff`
- タイトルバー: `#f0f0f0`
- 枠線: `#cccccc`
- 影: `rgba(0, 0, 0, 0.15)`

### カスタムテーマ

カスタムテーマを使用すると、すべての色を自由にカスタマイズできます。

```json
{
  "linkCanvas.theme": "custom",
  "linkCanvas.customTheme.backgroundColor": "#0d1117",
  "linkCanvas.customTheme.gridColor": "rgba(240, 246, 252, 0.05)",
  "linkCanvas.window.borderColor": "#30363d",
  "linkCanvas.window.borderWidth": 2,
  "linkCanvas.window.borderRadius": 12,
  "linkCanvas.window.backgroundColor": "#161b22",
  "linkCanvas.window.titleBarColor": "#21262d",
  "linkCanvas.window.shadowColor": "rgba(0, 0, 0, 0.7)",
  "linkCanvas.font.family": "JetBrains Mono, monospace",
  "linkCanvas.font.size": 15
}
```

## 設定例

### 例1：最小限のダークテーマ

```json
{
  "linkCanvas.theme": "dark"
}
```

### 例2：カスタマイズされたライトテーマ

```json
{
  "linkCanvas.theme": "light",
  "linkCanvas.window.borderWidth": 2,
  "linkCanvas.window.borderRadius": 12,
  "linkCanvas.font.size": 16
}
```

### 例3：GitHub Dark風のカスタムテーマ

```json
{
  "linkCanvas.theme": "custom",
  "linkCanvas.customTheme.backgroundColor": "#0d1117",
  "linkCanvas.customTheme.gridColor": "rgba(240, 246, 252, 0.05)",
  "linkCanvas.window.borderColor": "#30363d",
  "linkCanvas.window.borderWidth": 1,
  "linkCanvas.window.borderRadius": 6,
  "linkCanvas.window.backgroundColor": "#161b22",
  "linkCanvas.window.titleBarColor": "#21262d",
  "linkCanvas.window.shadowColor": "rgba(0, 0, 0, 0.7)"
}
```

### 例4：高コントラストテーマ

```json
{
  "linkCanvas.theme": "custom",
  "linkCanvas.customTheme.backgroundColor": "#000000",
  "linkCanvas.customTheme.gridColor": "rgba(255, 255, 255, 0.1)",
  "linkCanvas.window.borderColor": "#ffffff",
  "linkCanvas.window.borderWidth": 2,
  "linkCanvas.window.borderRadius": 0,
  "linkCanvas.window.backgroundColor": "#1a1a1a",
  "linkCanvas.window.titleBarColor": "#333333",
  "linkCanvas.window.shadowColor": "rgba(255, 255, 255, 0.2)"
}
```

## リアルタイム反映

設定を変更すると、Link Canvasは自動的に新しいスタイルを適用します。VSCodeの設定を開いて変更を保存するだけで、即座に反映されます。

1. VSCodeの設定を開く（`Cmd/Ctrl + ,`）
2. 「Link Canvas」で検索
3. 設定を変更
4. 設定は自動的に保存され、すぐに反映されます

または、`settings.json`を直接編集することもできます：

1. コマンドパレットを開く（`Cmd/Ctrl + Shift + P`）
2. 「Preferences: Open Settings (JSON)」を選択
3. 設定を追加・編集
4. ファイルを保存

## トラブルシューティング

### 設定が反映されない場合

1. VSCodeをリロードしてみてください（`Cmd/Ctrl + Shift + P` → 「Developer: Reload Window」）
2. Link Canvasパネルを閉じて再度開いてみてください
3. settings.jsonの構文が正しいか確認してください（JSONの構文エラーがないか）

### カラー値について

- 16進数カラー: `#ffffff`, `#1e1e1e`
- RGB/RGBA: `rgb(255, 255, 255)`, `rgba(0, 0, 0, 0.5)`
- 名前付きカラー: `white`, `black`, `red`など

すべて有効なCSS色値が使用できます。

## デフォルト値の確認

設定例ファイル（`.vscode/settings.example.json`）にデフォルト値が記載されています。このファイルを参考に、お好みの設定をカスタマイズしてください。
