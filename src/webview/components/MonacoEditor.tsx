import React from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  content: string;
  fileName: string;
  filePath: string;
  onChange?: (value: string | undefined) => void;
  onContextMenu?: (
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

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    // console.log("[Link Canvas] Monaco Editor マウント:", fileName);
    editorRef.current = editor;
    monacoRef.current = monaco;

    const domNode = editor.getDomNode();
    if (domNode) {
      const rect = domNode.getBoundingClientRect();
      // console.log("[Link Canvas] Monaco DOM サイズ（マウント時）", {
      //   fileName,
      //   width: rect.width,
      //   height: rect.height,
      // });

      // DOM サイズが小さすぎる場合は再レイアウトを実行
      if (rect.width < 100 || rect.height < 100) {
        // console.log("[Link Canvas] DOM サイズが小さいため再レイアウト予定");
        setTimeout(() => {
          // console.log("[Link Canvas] Monaco 再レイアウト実行");
          editor.layout();

          // レイアウト後のサイズを確認
          // const updatedRect = domNode.getBoundingClientRect();
          // console.log("[Link Canvas] Monaco DOM サイズ（レイアウト後）", {
          //   fileName,
          //   width: updatedRect.width,
          //   height: updatedRect.height,
          // });
        }, 100);
      }
    }

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
   * コンテキストメニューアクション登録用 useEffect
   * onContextMenu が変わるたびに再登録
   */
  React.useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    // console.log("[Link Canvas] useEffect: アクション再登録開始 -", filePath);
    // console.log("[Link Canvas] onContextMenu 定義状態:", !!onContextMenu);
    
    registerCustomContextMenuActions(
      editorRef.current,
      monacoRef.current,
      filePath,
      onContextMenu
    );
    
    // console.log("[Link Canvas] useEffect: アクション再登録完了 -", filePath);
  }, [filePath, onContextMenu]);  /**
   * ハイライト機能: highlightLine が変わったときに、該当行を視認しやすくハイライト
   */
  React.useEffect(() => {
    if (!editorRef.current || typeof highlightLine !== "number") {
      // ハイライトがない場合は装飾を削除
      editorRef.current?.createDecorationsCollection([]);
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!monaco) return;

    const lineNumber = highlightLine + 1; // 0-based → 1-based

    // console.log("[Link Canvas] ハイライト適用:", {
    //   fileName,
    //   highlightLine,
    //   highlightColumn,
    //   monacoLineNumber: lineNumber,
    // });

    // 装飾定義
    const decorations = [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1000),
        options: {
          isWholeLine: true,
          backgroundColor: "rgba(255, 200, 0, 0.2)", // 黄色の背景
          borderColor: "rgba(255, 150, 0, 0.5)",
          borderStyle: "solid",
          borderWidth: "1px",
        },
      },
    ];

    // 装飾を適用
    editor.createDecorationsCollection(decorations);

    // エディタをハイライト行までスクロール
    editor.revealLineInCenter(lineNumber);
  }, [highlightLine, highlightColumn, fileName]);

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
      let selectedText = "";

      if (selection && !selection.isEmpty()) {
        selectedText = model.getValueInRange(selection);
      } else {
        // 単語を選択
        const wordInfo = model.getWordAtPosition(position);
        selectedText = wordInfo?.word || "";
      }

      console.log("[Link Canvas] コンテキストメニュー呼び出し", {
        line: position.lineNumber - 1,
        column: position.column - 1,
        selectedText,
      });

      // 親コンポーネント (CodeWindow) にコールバック経由で通知
      onContextMenu?.(
        filePath,
        position.lineNumber - 1, // 0-based
        position.column - 1, // 0-based
        selectedText
      );
    } catch (error) {
      console.error("[Link Canvas] コンテキストメニュー処理エラー:", error);
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

/**
 * Monaco Editor にカスタムコンテキストメニューアクションを登録
 */
function registerCustomContextMenuActions(
  editor: any,
  monaco: any,
  filePath: string,
  onContextMenu?: (
    filePath: string,
    line: number,
    column: number,
    selectedText: string
  ) => void
) {
  // console.log(
  //   "[Link Canvas] registerCustomContextMenuActions 呼び出し開始:",
  //   filePath
  // );
  // console.log("[Link Canvas] onContextMenu 存在:", !!onContextMenu);

  if (!onContextMenu) {
    console.warn(
      "[Link Canvas] ⚠️ WARNING: onContextMenu が undefined です"
    );
    return;
  }

  // コンテキストメニューアクション実行用の共通関数
  const executeAction = (actionName: string) => {
    console.log(`[Link Canvas] ${actionName}`);
    const position = editor.getPosition();
    if (!position) return;

    const model = editor.getModel();
    const selection = editor.getSelection();
    let selectedText = "";

    if (selection && !selection.isEmpty()) {
      selectedText = model.getValueInRange(selection);
    } else {
      const wordInfo = model.getWordAtPosition(position);
      selectedText = wordInfo?.word || "";
    }

    onContextMenu(
      filePath,
      position.lineNumber - 1,
      position.column - 1,
      selectedText
    );
  };

  // 定義を表示アクション
  editor.addAction({
    id: "link-canvas.showDefinition",
    label: "[Canvas] 定義を表示",
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.5,
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD,
    ],
    run: () => executeAction("定義を表示"),
  });

  // 参照を表示アクション
  editor.addAction({
    id: "link-canvas.showReferences",
    label: "[Canvas] 参照を表示",
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.6,
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
    ],
    run: () => executeAction("参照を表示"),
  });
}
