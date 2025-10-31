import React from "react";
import { createRoot } from "react-dom/client";
import { InfiniteCanvas } from "./components/InfiniteCanvas";
import type { CodeWindowData } from "./components/CodeWindow";
import type { EdgeData } from "./types/EdgeData";
import { generateWindowId, generateEdgeId } from "./utils";

interface FileMessage {
  type: string;
  filePath: string;
  fileName: string;
  content: string;
  highlightLine?: number;
  highlightColumn?: number;
}

interface ZoomMessage {
  type: "zoomIn" | "zoomOut";
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
    setEdges((prev) =>
      prev.filter((e) => e.source !== id && e.target !== id)
    );
    // console.log("[Link Canvas] ウィンドウ削除:", id);
  }, []);

  const handleEdgeClick = React.useCallback((edgeId: string) => {
    console.log("[Link Canvas] エッジクリック:", edgeId);
    // エッジクリック時の処理（例：エッジの削除、情報表示など）
  }, []);

  const handleEdgeHover = React.useCallback((edgeId: string | null) => {
    // エッジホバー時の処理（必要に応じて実装）
  }, []);

  // postMessageリスナーのセットアップ
  React.useEffect(() => {
    // console.log("[Link Canvas] イベントリスナー セットアップ開始");

    const messageHandler = (event: MessageEvent) => {
      const message = event.data as FileMessage | ZoomMessage;

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
          // 新しいウィンドウが追加された場合、既存のウィンドウとの依存関係を検出
          setEdges((prevEdges) => {
            const newEdges: EdgeData[] = [...prevEdges];
            const allWindows = windows;

            // import文から依存関係を検出
            const importRegex =
              /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
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

              // importパスに基づいて対象ウィンドウを検索
              // 簡易実装：ファイル名の一部が一致するウィンドウを検索
              const targetWindow = allWindows.find((w) => {
                const baseName = importPath.split("/").pop()?.replace(/\..*$/, "");
                return (
                  baseName &&
                  w.fileName.toLowerCase().includes(baseName.toLowerCase())
                );
              });

              if (targetWindow) {
                const edgeId = generateEdgeId(windowId, targetWindow.id);
                // 既存のエッジがない場合のみ追加
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
                    "[Link Canvas] エッジ作成:",
                    fileMsg.fileName,
                    "→",
                    targetWindow.fileName
                  );
                }
              }
            }

            return newEdges;
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
