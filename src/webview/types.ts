/**
 * Shared type definitions for the webview
 */

/**
 * Interface representing a highlight range in the editor
 */
export interface HighlightRange {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}
