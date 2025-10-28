import React from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  content: string;
  fileName: string;
  onChange?: (value: string | undefined) => void;
}

/**
 * ズームイン時に表示されるMonaco Editorコンポーネント
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  content,
  fileName,
  onChange,
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
