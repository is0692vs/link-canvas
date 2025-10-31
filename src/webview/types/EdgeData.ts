/**
 * エッジ（依存関係の線）のデータ型
 */
export interface EdgeData {
  id: string;
  source: string; // 始点ウィンドウのID
  target: string; // 終点ウィンドウのID
  sourceHandle?: string; // 始点の接続ポイント（'top' | 'bottom' | 'left' | 'right'）
  targetHandle?: string; // 終点の接続ポイント
  style?: EdgeStyle;
  label?: string; // エッジのラベル（オプション）
}

/**
 * エッジのスタイル設定
 */
export interface EdgeStyle {
  color?: string; // 線の色（デフォルト: '#888'）
  width?: number; // 線の太さ（デフォルト: 2）
  dashed?: boolean; // 破線かどうか（デフォルト: false）
  animated?: boolean; // アニメーション効果（デフォルト: false）
}

/**
 * エッジの座標計算結果
 */
export interface EdgeCoordinates {
  x1: number; // 始点X座標
  y1: number; // 始点Y座標
  x2: number; // 終点X座標
  y2: number; // 終点Y座標
  controlX?: number; // ベジェ曲線の制御点X（オプション）
  controlY?: number; // ベジェ曲線の制御点Y（オプション）
}
