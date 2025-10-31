/**
 * Shared type definitions for the webview
 */

/**
 * ハイライト範囲を表すインターフェース
 */
export interface HighlightRange {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}
