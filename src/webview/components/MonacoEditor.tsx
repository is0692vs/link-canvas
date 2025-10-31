import React from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import { ActionType, MessageType } from "../constants";

interface HighlightRange {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

interface MonacoEditorProps {
  content: string;
  fileName: string;
  filePath: string;
  onChange?: (value: string | undefined) => void;
  highlightLine?: number;
  highlightColumn?: number;
  highlightRange?: HighlightRange;
}

// VSCode APIは一度だけ取得して保持する
const vscodeApi = (window as any).acquireVsCodeApi?.();

/**
 * ズームイン時に表示されるMonaco Editorコンポーネント
 * 右クリックで「参照を表示」「定義を表示」メニュー対応
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = (props) => {
  const {
    content,
    fileName,
    filePath,
    onChange,
    highlightLine,
    highlightColumn,
    highlightRange,
  } = props;

  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<Monaco | null>(null);
  const highlightCollectionRef = React.useRef<any>(null);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    console.log("[Link Canvas] Monaco Editor handleEditorMount 呼び出し", {
      fileName,
      filePath,
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
    registerCustomContextMenuActions(editor, monaco, filePath);
    console.log("[Link Canvas] コンテキストメニューアクション登録完了");

    // Cmd +/- でフォントサイズ変更するコマンドを追加
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.min(currentSize + 2, 32);
      editor.updateOptions({ fontSize: newSize });
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      const currentSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      const newSize = Math.max(currentSize - 2, 8);
      editor.updateOptions({ fontSize: newSize });
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      editor.updateOptions({ fontSize: 14 });
    });
  };

  /**
   * ハイライト機能: highlightRange または highlightLine が変わったときに、該当範囲を視認しやすくハイライト
   * 範囲を自動スクロールで表示
   */
  React.useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    // highlightRange が優先、なければ highlightLine を使用
    let startLine: number;
    let endLine: number;
    let startColumn: number | undefined;
    let endColumn: number | undefined;

    if (highlightRange) {
      startLine = highlightRange.startLine;
      endLine = highlightRange.endLine;
      startColumn = highlightRange.startColumn;
      endColumn = highlightRange.endColumn;
      console.log("[Link Canvas] ハイライト範囲適用:", {
        startLine,
        endLine,
        startColumn,
        endColumn,
        fileName,
      });
    } else if (typeof highlightLine === "number") {
      // 後方互換性: highlightLine のみの場合は単一行ハイライト
      startLine = highlightLine;
      endLine = highlightLine;
      startColumn = highlightColumn;
      console.log("[Link Canvas] 単一行ハイライト適用:", {
        line: highlightLine,
        column: highlightColumn,
        fileName,
      });
    } else {
      // ハイライトなし - デコレーションを解除
      highlightCollectionRef.current?.set([]);
      return;
    }

    // Monaco は 1-based の行番号を使用、VSCode は 0-based
    const monacoStartLine = startLine + 1;
    const monacoEndLine = endLine + 1;
    const monacoStartColumn = startColumn !== undefined ? startColumn + 1 : 1;
    const monacoEndColumn =
      endColumn !== undefined ? endColumn + 1 : Number.MAX_VALUE;

    // デコレーション（ハイライト）を設定
    const decorations = [
      {
        range: new monaco.Range(
          monacoStartLine,
          1,
          monacoEndLine,
          Number.MAX_VALUE
        ),
        options: {
          isWholeLine: true,
          className: "highlight-line",
          // 背景色: 薄い黄色
          inlineClassName: "highlight-inline",
          // Monaco の組み込みスタイルオプション
          backgroundColor: "rgba(255, 230, 100, 0.25)",
          // 左側のグリフマージン（行番号の左側）にマーカーを表示
          glyphMarginClassName: "highlight-glyph",
          // オーバービュールーラー（スクロールバー）にマーカーを表示
          overviewRuler: {
            color: "rgba(255, 200, 0, 0.8)",
            position: monaco.editor.OverviewRulerLane.Full,
          },
        },
      },
    ];

    if (!highlightCollectionRef.current) {
      highlightCollectionRef.current = editor.createDecorationsCollection([]);
    }

    highlightCollectionRef.current.set(decorations);

    // 自動スクロール: ハイライト範囲をウィンドウの上部に表示
    const revealRange = new monaco.Range(
      monacoStartLine,
      monacoStartColumn,
      monacoEndLine,
      monacoEndColumn
    );

    // revealRangeAtTop: 範囲がビューポートの上部に来るようにスクロール
    editor.revealRangeAtTop(revealRange);

    console.log("[Link Canvas] ハイライト適用完了、自動スクロール実行:", {
      monacoStartLine,
      monacoEndLine,
      fileName,
    });
  }, [highlightLine, highlightColumn, highlightRange, fileName]);

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
  filePath: string
) {
  console.log("[Link Canvas] registerCustomContextMenuActions 呼び出し", {
    filePath,
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
  const executeAction = (actionName: typeof ActionType[keyof typeof ActionType]) => {
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

    if (!vscodeApi) {
      console.error("[Link Canvas] VS Code API が利用できません");
      return;
    }

    const messageType = actionName === ActionType.DEFINITION ? MessageType.SHOW_DEFINITION : MessageType.SHOW_REFERENCES;

    console.log("[Link Canvas] postMessage 送信:", {
        type: messageType,
        filePath,
        line: position.lineNumber - 1,
        column: position.column - 1,
        selectedText,
    });

    vscodeApi.postMessage({
        type: messageType,
        filePath,
        line: position.lineNumber - 1,
        column: position.column - 1,
        selectedText,
    });
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
      executeAction(ActionType.DEFINITION);
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
      executeAction(ActionType.REFERENCES);
    },
  });
  console.log("[Link Canvas] 参照アクション登録完了", referencesAction);
}
