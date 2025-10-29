import React from "react";
import { createRoot } from "react-dom/client";
import { InfiniteCanvas } from "./components/InfiniteCanvas";
import type { CodeWindowData } from "./components/CodeWindow";

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
    console.log("[Link Canvas] ウィンドウ削除:", id);
  }, []);

  const handleContextMenu = React.useCallback(
    (filePath: string, line: number, column: number, selectedText: string) => {
      console.log('[Link Canvas] コンテキストメニュー発火:', {
        filePath,
        line,
        column,
        selectedText,
      });

      // 拡張機能へリクエスト送信
      const vscodeApi = (window as any).acquireVsCodeApi?.();
      if (vscodeApi) {
        vscodeApi.postMessage({
          type: "showDefinition",
          filePath: filePath,
          line: line,
          column: column,
        });

        vscodeApi.postMessage({
          type: "showReferences",
          filePath: filePath,
          line: line,
          column: column,
        });

        console.log('[Link Canvas] 定義/参照リクエスト拡張機能に転送');
      }
    },
    []
  );

  // postMessageリスナーのセットアップ
  React.useEffect(() => {
    console.log("[Link Canvas] イベントリスナー セットアップ開始");

    const messageHandler = (event: MessageEvent) => {
      const message = event.data as FileMessage | ZoomMessage;

      if ("type" in message) {
        if (message.type === "addFile") {
          const fileMsg = message as FileMessage;
          console.log(
            "[Link Canvas] ファイル受信:",
            fileMsg.fileName,
            "サイズ:",
            fileMsg.content.length
          );

          // ユニークなノードIDを生成（ファイルパスをベースに）
          const nodeId = `node-${fileMsg.filePath.replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )}`;

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

          console.log(
            "[Link Canvas] 抽出結果 - クラス:",
            classes,
            "関数:",
            functions
          );

          const newWindow: CodeWindowData & {
            id: string;
            position: { x: number; y: number };
          } = {
            id: `window-${fileMsg.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`,
            filePath: fileMsg.filePath,
            fileName: fileMsg.fileName,
            content: fileMsg.content,
            width: 400,
            height: 300,
            classes,
            functions,
            position: { x: windows.length * 450 + 50, y: 100 },
          };

          setWindows((prev) => {
            if (prev.some((w) => w.id === newWindow.id)) {
              console.log(
                "[Link Canvas] 既存ウィンドウのため追加スキップ:",
                newWindow.id
              );
              return prev;
            }
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
        zoom={zoom}
        pan={pan}
        onZoomChange={handleZoomChange}
        onPanChange={handlePanChange}
        onWindowMove={handleWindowMove}
        onWindowResize={handleWindowResize}
        onWindowClose={handleWindowClose}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
