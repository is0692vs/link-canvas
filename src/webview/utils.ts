/**
 * ファイルパスとハイライト情報に基づいて、一意のウィンドウIDを生成します。
 *
 * @param filePath ファイルのフルパス
 * @param highlightLine ハイライトする行番号 (0-based)
 * @param highlightColumn ハイライトする列番号 (0-based)
 * @returns 生成されたウィンドウID
 */
export function generateWindowId(
  filePath: string,
  highlightLine?: number,
  highlightColumn?: number
): string {
  const sanitizedPath = filePath.replace(/[^a-zA-Z0-9]/g, "-");
  const highlightKey =
    typeof highlightLine === "number"
      ? `line-${highlightLine}-col-${typeof highlightColumn === "number" ? highlightColumn : 0}`
      : "base";
  return `window-${sanitizedPath}-${highlightKey}`;
}
