import React from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  content: string;
  fileName: string;
  filePath: string;
  onChange?: (value: string | undefined) => void;
  onContextMenu?: (
    action: "definition" | "references",
    filePath: string,
    line: number,
    column: number,
    selectedText: string
  ) => void;
  highlightLine?: number;
  highlightColumn?: number;
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
  highlightLine,
  highlightColumn,
}) => {
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<Monaco | null>(null);
  const highlightCollectionRef = React.useRef<any>(null);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    console.log("[Link Canvas] Monaco Editor handleEditorMount 呼び出し", {
      fileName,
      filePath,
      hasOnContextMenu: !!onContextMenu,
    });

    editorRef.current = editor;
    monacoRef.current = monaco;

    const domNode = editor.getDomNode();
    if (domNode) {
      const rect = domNode.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 100) {
        setTimeout(() => {
          editor.layout();
        }, 100);
      }
    }

    // コンテキストメニューアクション登録（メニュー項目を表示）
    console.log("[Link Canvas] コンテキストメニューアクション登録開始");
    registerCustomContextMenuActions(editor, monaco, filePath, onContextMenu);
    console.log("[Link Canvas] コンテキストメニューアクション登録完了");

    // Cmd +/- でフォントサイズ変更するコマンドを追加
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.min(currentSize + 2, 32);
      editor.updateOptions({ fontSize: newSize });
      // console.log("[Link Canvas] フォントサイズ増加:", newSize);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.max(currentSize - 2, 8);
      editor.updateOptions({ fontSize: newSize });
      // console.log("[Link Canvas] フォントサイズ減少:", newSize);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      editor.updateOptions({ fontSize: 14 });
      // console.log("[Link Canvas] フォントサイズリセット: 14px");
    });
  };

  /**
   * ハイライト機能: highlightLine が変わったときに、該当行を視認しやすくハイライト
   */
  React.useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    if (typeof highlightLine !== "number") {
      // ハイライトを解除
      highlightCollectionRef.current?.set([]);
      return;
    }

    const lineNumber = highlightLine + 1; // 0-based → 1-based
    const decorations = [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1000),
        options: {
          isWholeLine: true,
          backgroundColor: "rgba(255, 200, 0, 0.2)",
          borderColor: "rgba(255, 150, 0, 0.5)",
          borderStyle: "solid",
          borderWidth: "1px",
        },
      },
    ];

    if (!highlightCollectionRef.current) {
      highlightCollectionRef.current = editor.createDecorationsCollection([]);
    }

    highlightCollectionRef.current.set(decorations);
    editor.revealLineInCenter(lineNumber);
  }, [highlightLine, highlightColumn, fileName]);

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

/**
 * Monaco Editor にカスタムコンテキストメニューアクションを登録
 */
function registerCustomContextMenuActions(
  editor: any,
  monaco: any,
  filePath: string,
  onContextMenu?: (
    action: "definition" | "references",
    filePath: string,
    line: number,
    column: number,
    selectedText: string
  ) => void
) {
  console.log("[Link Canvas] registerCustomContextMenuActions 呼び出し", {
    filePath,
    hasOnContextMenu: !!onContextMenu,
  });

  // 既にアクションが登録されているかチェック
  try {
    if (editor.getAction && editor.getAction("link-canvas.showDefinition")) {
      console.log("[Link Canvas] アクション既に登録済み - スキップ");
      return; // 既に登録されている場合はスキップ
    }
  } catch (e) {
    console.log("[Link Canvas] getAction チェック失敗 - 新規登録", e);
  }

  // コンテキストメニューアクション実行用の共通関数
  const executeAction = (actionName: "definition" | "references") => {
    console.log("[Link Canvas] executeAction 開始", {
      action: actionName,
      filePath,
    });

    const position = editor.getPosition();
    if (!position) {
      console.log("[Link Canvas] position が取得できない");
      return;
    }

    const model = editor.getModel();
    const selection = editor.getSelection();
    let selectedText = "";

    if (selection && !selection.isEmpty()) {
      selectedText = model.getValueInRange(selection);
    } else {
      const wordInfo = model.getWordAtPosition(position);
      selectedText = wordInfo?.word || "";
    }

    console.log("[Link Canvas] Monaco action run", {
      action: actionName,
      filePath,
      line: position.lineNumber - 1,
      column: position.column - 1,
      selectedText,
      hasCallback: !!onContextMenu,
    });

    if (onContextMenu) {
      console.log("[Link Canvas] onContextMenu コールバック実行");
      onContextMenu(
        actionName,
        filePath,
        position.lineNumber - 1,
        position.column - 1,
        selectedText
      );
    } else {
      console.log("[Link Canvas] onContextMenu コールバックが未定義");
    }
  };

  // 定義を表示アクション
  console.log("[Link Canvas] 定義アクション登録中...");
  const definitionAction = editor.addAction({
    id: "link-canvas.showDefinition",
    label: "[Canvas] 定義を表示",
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.5,
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD,
    ],
    run: () => {
      console.log("[Link Canvas] 定義アクション run 呼び出し");
      executeAction("definition");
    },
  });
  console.log("[Link Canvas] 定義アクション登録完了", definitionAction);

  // 参照を表示アクション
  console.log("[Link Canvas] 参照アクション登録中...");
  const referencesAction = editor.addAction({
    id: "link-canvas.showReferences",
    label: "[Canvas] 参照を表示",
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.6,
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
    ],
    run: () => {
      console.log("[Link Canvas] 参照アクション run 呼び出し");
      executeAction("references");
    },
  });
  console.log("[Link Canvas] 参照アクション登録完了", referencesAction);
}
