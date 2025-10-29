import React from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  content: string;
  fileName: string;
  filePath: string;
  onChange?: (value: string | undefined) => void;
  onContextMenu?: (filePath: string, line: number, column: number, selectedText: string) => void;
}

/**
 * ズームイン時に表示されるMonaco Editorコンポーネント
 * 右クリックで「参照を表示」「定義を表示」メニュー対応
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  content,
  fileName,
  filePath,
  onChange,
  onContextMenu,
}) => {
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<Monaco | null>(null);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    console.log("[Link Canvas] Monaco Editor マウント:", fileName);
    editorRef.current = editor;
    monacoRef.current = monaco;

    const domNode = editor.getDomNode();
    if (domNode) {
      const rect = domNode.getBoundingClientRect();
      console.log("[Link Canvas] Monaco DOM サイズ（マウント時）", {
        fileName,
        width: rect.width,
        height: rect.height,
      });

      // DOM サイズが小さすぎる場合は再レイアウトを実行
      if (rect.width < 100 || rect.height < 100) {
        console.log("[Link Canvas] DOM サイズが小さいため再レイアウト予定");
        setTimeout(() => {
          console.log("[Link Canvas] Monaco 再レイアウト実行");
          editor.layout();

          // レイアウト後のサイズを確認
          const updatedRect = domNode.getBoundingClientRect();
          console.log("[Link Canvas] Monaco DOM サイズ（レイアウト後）", {
            fileName,
            width: updatedRect.width,
            height: updatedRect.height,
          });
        }, 100);
      }
    }

    // Cmd +/- でフォントサイズ変更するコマンドを追加
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.min(currentSize + 2, 32);
      editor.updateOptions({ fontSize: newSize });
      console.log("[Link Canvas] フォントサイズ増加:", newSize);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.max(currentSize - 2, 8);
      editor.updateOptions({ fontSize: newSize });
      console.log("[Link Canvas] フォントサイズ減少:", newSize);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      editor.updateOptions({ fontSize: 14 });
      console.log("[Link Canvas] フォントサイズリセット: 14px");
    });

    // コンテキストメニューハンドラ
    const domElement = editor.getDomNode();
    if (domElement) {
      domElement.addEventListener('contextmenu', (e: MouseEvent) => {
        handleEditorContextMenu(e, editor);
      });
    }
  };

  /**
   * Monaco Editor のコンテキストメニューハンドラ
   * 右クリック時にカーソル位置から定義/参照を取得
   */
  const handleEditorContextMenu = (e: MouseEvent, editor: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const position = editor.getPosition();
      if (!position) return;

      // 選択テキスト取得
      const model = editor.getModel();
      const selection = editor.getSelection();
      let selectedText = '';

      if (selection && !selection.isEmpty()) {
        selectedText = model.getValueInRange(selection);
      } else {
        // 単語を選択
        const wordInfo = model.getWordAtPosition(position);
        selectedText = wordInfo?.word || '';
      }

      console.log('[Link Canvas] コンテキストメニュー呼び出し', {
        line: position.lineNumber - 1,
        column: position.column - 1,
        selectedText,
      });

      // 親コンポーネント (CodeWindow) にコールバック経由で通知
      onContextMenu?.(
        filePath,
        position.lineNumber - 1,  // 0-based
        position.column - 1,      // 0-based
        selectedText
      );
    } catch (error) {
      console.error('[Link Canvas] コンテキストメニュー処理エラー:', error);
    }
  };

  return (
    <Editor
      height="100%"
      width="100%"
      language={getLanguageFromFileName(fileName)}
      value={content}
      onChange={onChange}
      onMount={handleEditorMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: "'Courier New', monospace",
        wordWrap: "on",
      }}
    />
  );
};

/**
 * ファイル名から言語を判定
 */
function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    html: "html",
    css: "css",
    sql: "sql",
  };
  return languageMap[ext || ""] || "plaintext";
}
