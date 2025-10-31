import React from "react";
import { createRoot } from "react-dom/client";
import { InfiniteCanvas } from "./components/InfiniteCanvas";
import type { CodeWindowData } from "./components/CodeWindow";
import type { EdgeData } from "./types/EdgeData";
import { generateWindowId, generateEdgeId } from "./utils";
import type { HighlightRange } from "./types";
import { applyConfigToCSS, parseConfigFromMessage, DEFAULT_CONFIG } from "./config";

interface FileMessage {
  type: string;
  filePath: string;
  fileName: string;
  content: string;
  highlightLine?: number;
  highlightColumn?: number;
  highlightRange?: HighlightRange;
  relationshipType?: "definition" | "reference" | "import" | null;
  relatedFilePath?: string | null;
}

interface ZoomMessage {
  type: "zoomIn" | "zoomOut";
}

interface ConfigMessage {
  type: "updateConfig";
  config: any;
}

function App() {
  const [windows, setWindows] = React.useState<
    Array<CodeWindowData & { id: string; position: { x: number; y: number } }>
  >([]);
  const [edges, setEdges] = React.useState<EdgeData[]>([]);
  const [zoom, setZoom] = React.useState(0.5);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  console.log("[Link Canvas] Appコンポーネント レンダリング");

  const handleZoomChange = React.useCallback((newZoom: number) => {
    setZoom(newZoom);
    console.log("[Link Canvas] ズーム変更:", newZoom.toFixed(3));
  }, []);

  const handlePanChange = React.useCallback(
    (newPan: { x: number; y: number }) => {
      setPan(newPan);
      console.log(
        "[Link Canvas] パン変更:",
        newPan.x.toFixed(1),
        newPan.y.toFixed(1)
      );
    },
    []
  );

  const handleWindowMove = React.useCallback(
    (id: string, position: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position } : w))
      );
    },
    []
  );

  const handleWindowResize = React.useCallback(
    (id: string, width: number, height: number) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, width, height } : w))
      );
    },
    []
  );

  const handleWindowClose = React.useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    // ウィンドウ削除時に関連するエッジも削除
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  }, []);

  const handleEdgeClick = React.useCallback((edgeId: string) => {
    console.log("[Link Canvas] エッジクリック:", edgeId);
    // エッジクリック時の処理（例：エッジの削除、情報表示など）
  }, []);

  const handleEdgeHover = React.useCallback((edgeId: string | null) => {
    // エッジホバー時の処理（必要に応じて実装）
  }, []);

  // デバッグ用：テストデータの初期化（開発時のみ）
  React.useEffect(() => {
    // 環境変数やクエリパラメータでテストモードを判定できるが、
    // ここでは簡易的にウィンドウ数が0の場合のみテストデータを追加
    // NODE_ENVが'production'でない場合のみテストデータを追加
    const addTestData = process.env.NODE_ENV !== "production";

    if (addTestData && windows.length === 0) {
      console.log("[Link Canvas] テストデータを追加します");

      // テストウィンドウ1
      const testWindow1: CodeWindowData & {
        id: string;
        position: { x: number; y: number };
      } = {
        id: "test-window-1",
        filePath: "/test/main.ts",
        fileName: "main.ts",
        content: `import { Calculator } from './calculator';\nimport { Logger } from './logger';\n\nconst calc = new Calculator();\nconst logger = new Logger();\n\nfunction main() {\n  const result = calc.add(5, 3);\n  logger.log(\`Result: \${result}\`);\n  return result;\n}`,
        width: 400,
        height: 300,
        classes: [],
        functions: ["main"],
        position: { x: 100, y: 100 },
      };

      // テストウィンドウ2
      const testWindow2: CodeWindowData & {
        id: string;
        position: { x: number; y: number };
      } = {
        id: "test-window-2",
        filePath: "/test/calculator.ts",
        fileName: "calculator.ts",
        content: `export class Calculator {\n  add(a: number, b: number): number {\n    return a + b;\n  }\n\n  subtract(a: number, b: number): number {\n    return a - b;\n  }\n}`,
        width: 400,
        height: 300,
        classes: ["Calculator"],
        functions: ["add", "subtract"],
        position: { x: 600, y: 100 },
      };

      // テストウィンドウ3
      const testWindow3: CodeWindowData & {
        id: string;
        position: { x: number; y: number };
      } = {
        id: "test-window-3",
        filePath: "/test/logger.ts",
        fileName: "logger.ts",
        content: `export class Logger {\n  log(message: string): void {\n    console.log('[Log]', message);\n  }\n}`,
        width: 400,
        height: 300,
        classes: ["Logger"],
        functions: ["log"],
        position: { x: 600, y: 450 },
      };

      setWindows([testWindow1, testWindow2, testWindow3]);

      // テストエッジ
      const testEdges: EdgeData[] = [
        {
          id: "test-edge-1",
          source: "test-window-1",
          target: "test-window-2",
          sourceHandle: "right",
          targetHandle: "left",
          style: { color: "#888", width: 2 },
        },
        {
          id: "test-edge-2",
          source: "test-window-1",
          target: "test-window-3",
          sourceHandle: "right",
          targetHandle: "left",
          style: { color: "#888", width: 2, dashed: true },
        },
      ];

      setEdges(testEdges);
      console.log("[Link Canvas] テストデータ追加完了");
    }
  }, []); // 初回マウント時のみ実行

  // 初期設定を適用
  React.useEffect(() => {
    console.log("[Link Canvas] 初期設定を適用");
    applyConfigToCSS(DEFAULT_CONFIG);
  }, []);

  // postMessageリスナーのセットアップ
  React.useEffect(() => {
    // console.log("[Link Canvas] イベントリスナー セットアップ開始");

    const messageHandler = (event: MessageEvent) => {
      const message = event.data as FileMessage | ZoomMessage | ConfigMessage;

      if ("type" in message) {
        if (message.type === "addFile") {
          const fileMsg = message as FileMessage;
          // console.log(
          //   "[Link Canvas] ファイル受信:",
          //   fileMsg.fileName,
          //   "サイズ:",
          //   fileMsg.content.length
          // );

          // ファイル内容からクラスと関数を抽出
          const classes: string[] = [];
          const functions: string[] = [];

          const classRegex = /class\s+(\w+)/g;
          const funcRegex =
            /(?:export\s+)?(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=/g;

          let classMatch;
          while ((classMatch = classRegex.exec(fileMsg.content)) !== null) {
            classes.push(classMatch[1]);
          }

          let funcMatch;
          while ((funcMatch = funcRegex.exec(fileMsg.content)) !== null) {
            const funcName = funcMatch[1] || funcMatch[2];
            if (funcName && !classes.includes(funcName)) {
              functions.push(funcName);
            }
          }

          // console.log(
          //   "[Link Canvas] 抽出結果 - クラス:",
          //   classes,
          //   "関数:",
          //   functions
          // );

          const windowId = generateWindowId(
            fileMsg.filePath,
            fileMsg.highlightLine,
            fileMsg.highlightColumn
          );

          setWindows((prev) => {
            const existingIndex = prev.findIndex((w) => w.id === windowId);

            if (existingIndex >= 0) {
              const updated = [...prev];
              const existing = updated[existingIndex];
              updated[existingIndex] = {
                ...existing,
                content: fileMsg.content,
                classes,
                functions,
                highlightLine: fileMsg.highlightLine,
                highlightColumn: fileMsg.highlightColumn,
                highlightRange: fileMsg.highlightRange,
              };
              console.log("[Link Canvas] 既存ウィンドウ更新:", windowId);
              return updated;
            }

            const position = {
              x: prev.length * 450 + 50,
              y: 100 + prev.length * 40,
            };

            const newWindow: CodeWindowData & {
              id: string;
              position: { x: number; y: number };
            } = {
              id: windowId,
              filePath: fileMsg.filePath,
              fileName: fileMsg.fileName,
              content: fileMsg.content,
              width: 400,
              height: 300,
              classes,
              functions,
              highlightLine: fileMsg.highlightLine,
              highlightColumn: fileMsg.highlightColumn,
              highlightRange: fileMsg.highlightRange,
              position,
            };

            const updated = [...prev, newWindow];
            console.log("[Link Canvas] 新規ウィンドウ作成:", newWindow.id);
            console.log("[Link Canvas] 現在のウィンドウ数:", updated.length);
            // notify extension host where resize handles are placed (overlay vs inline)
            try {
              // wait a tick so InfiniteCanvas can mount overlay
              setTimeout(() => {
                try {
                  const placement = document.querySelector(
                    ".link-canvas-overlay"
                  )
                    ? "overlay"
                    : "inline";
                  const acquire = (window as any).acquireVsCodeApi;
                  const vscodeApi =
                    typeof acquire === "function" ? acquire() : null;
                  if (
                    vscodeApi &&
                    typeof vscodeApi.postMessage === "function"
                  ) {
                    vscodeApi.postMessage({
                      type: "resizePlacement",
                      placement,
                      windowId: newWindow.id,
                    });
                    console.log(
                      "[Link Canvas] resizePlacement posted to extension:",
                      placement,
                      newWindow.id
                    );
                  } else {
                    console.log(
                      "[Link Canvas] VSCode API not available to post resizePlacement"
                    );
                  }
                } catch (err) {
                  console.log("[Link Canvas] resizePlacement post error", err);
                }
              }, 50);
            } catch (err) {
              console.log(
                "[Link Canvas] resizePlacement scheduling error",
                err
              );
            }
            return updated;
          });

          // 依存関係の自動検出とエッジ作成
          setWindows((currentWindows) => {
            // ウィンドウは既に更新されているので、そのまま返す

            // エッジを更新
            setEdges((prevEdges) => {
              const newEdges: EdgeData[] = [...prevEdges];

              // 1. 明示的な依存関係（definition/reference）を処理
              if (fileMsg.relationshipType && fileMsg.relatedFilePath) {
                console.log(
                  "[Link Canvas] 明示的依存関係検出:",
                  fileMsg.relationshipType,
                  "from",
                  fileMsg.relatedFilePath,
                  "to",
                  fileMsg.filePath
                );

                // 元ファイルのウィンドウを検索
                const sourceWindow = currentWindows.find(
                  (w) => w.filePath === fileMsg.relatedFilePath
                );

                if (sourceWindow) {
                  let edgeId: string;
                  let sourceId: string;
                  let targetId: string;
                  let edgeColor: string;
                  let edgeLabel: string;

                  // definition: 元ファイル → 定義ファイル
                  // reference: 元ファイル ← 参照元ファイル
                  if (fileMsg.relationshipType === "definition") {
                    sourceId = sourceWindow.id;
                    targetId = windowId;
                    edgeId = generateEdgeId(sourceId, targetId);
                    edgeColor = "#4caf50"; // 緑
                    edgeLabel = "definition";
                  } else {
                    // reference
                    sourceId = windowId;
                    targetId = sourceWindow.id;
                    edgeId = generateEdgeId(sourceId, targetId);
                    edgeColor = "#2196f3"; // 青
                    edgeLabel = "reference";
                  }

                  // 既存のエッジがない場合のみ追加
                  if (!newEdges.some((e) => e.id === edgeId)) {
                    newEdges.push({
                      id: edgeId,
                      source: sourceId,
                      target: targetId,
                      sourceHandle: "right",
                      targetHandle: "left",
                      style: {
                        color: edgeColor,
                        width: 2,
                        dashed: false,
                      },
                      label: edgeLabel,
                    });
                    console.log(
                      `[Link Canvas] ${fileMsg.relationshipType}エッジ作成:`,
                      sourceWindow.fileName,
                      "→",
                      fileMsg.fileName
                    );
                  }
                } else {
                  console.warn(
                    "[Link Canvas] 元ファイルウィンドウが見つかりません:",
                    fileMsg.relatedFilePath
                  );
                }
              }

              // 2. import文から依存関係を検出（既存のロジック）
              const importRegex = /import\s+(?:.*\s+)?from\s*['"]([^'"]+)['"]/g;
              let importMatch;

              while (
                (importMatch = importRegex.exec(fileMsg.content)) !== null
              ) {
                const importPath = importMatch[1];
                console.log(
                  "[Link Canvas] import検出:",
                  importPath,
                  "from",
                  fileMsg.fileName
                );

                const targetWindow = currentWindows.find((w) => {
                  const baseName = importPath
                    .split("/")
                    .pop()
                    ?.replace(/\.(ts|tsx|js|jsx)$/, "");
                  if (!baseName) return false;

                  const windowBaseName = w.fileName.replace(
                    /\.(ts|tsx|js|jsx)$/,
                    ""
                  );
                  return (
                    baseName.toLowerCase() === windowBaseName.toLowerCase()
                  );
                });

                if (targetWindow) {
                  const edgeId = generateEdgeId(windowId, targetWindow.id);
                  if (!newEdges.some((e) => e.id === edgeId)) {
                    newEdges.push({
                      id: edgeId,
                      source: windowId,
                      target: targetWindow.id,
                      sourceHandle: "right",
                      targetHandle: "left",
                      style: {
                        color: "#888",
                        width: 2,
                        dashed: false,
                      },
                    });
                    console.log(
                      "[Link Canvas] importエッジ作成:",
                      fileMsg.fileName,
                      "→",
                      targetWindow.fileName
                    );
                  }
                }
              }

              return newEdges;
            });

            return currentWindows;
          });
        } else if (message.type === "zoomIn" || message.type === "zoomOut") {
          const zoomMsg = message as ZoomMessage;
          const zoomDelta = 0.1;
          let newZoom = zoom;

          if (zoomMsg.type === "zoomIn") {
            newZoom = Math.min(zoom + zoomDelta, 1.0);
            console.log(
              "[Link Canvas] ボタン ズームイン:",
              zoom.toFixed(3),
              "→",
              newZoom.toFixed(3)
            );
          } else {
            newZoom = Math.max(zoom - zoomDelta, 0.1);
            console.log(
              "[Link Canvas] ボタン ズームアウト:",
              zoom.toFixed(3),
              "→",
              newZoom.toFixed(3)
            );
          }

          handleZoomChange(newZoom);
        } else if (message.type === "updateConfig") {
          const configMsg = message as ConfigMessage;
          console.log("[Link Canvas] 設定更新メッセージ受信:", configMsg.config);
          const parsedConfig = parseConfigFromMessage(configMsg.config);
          applyConfigToCSS(parsedConfig);
        }
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      console.log("[Link Canvas] イベントリスナー クリーンアップ");
      window.removeEventListener("message", messageHandler);
    };
  }, [windows, zoom, handleZoomChange]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <InfiniteCanvas
        windows={windows}
        edges={edges}
        zoom={zoom}
        pan={pan}
        onZoomChange={handleZoomChange}
        onPanChange={handlePanChange}
        onWindowMove={handleWindowMove}
        onWindowResize={handleWindowResize}
        onWindowClose={handleWindowClose}
        onEdgeClick={handleEdgeClick}
        onEdgeHover={handleEdgeHover}
      />
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
