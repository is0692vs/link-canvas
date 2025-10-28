import React from "react";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CodeWindowNode } from "./nodes/CodeWindowNode";
import type { CodeWindowData } from "./components/CodeWindow";

const nodeTypes = {
  codeWindow: CodeWindowNode,
};

interface FileMessage {
  type: string;
  filePath: string;
  fileName: string;
  content: string;
}

interface ZoomMessage {
  type: "zoomIn" | "zoomOut";
}

function AppContent() {
  // テスト用のノードデータ
  const testNodeData: CodeWindowData = {
    filePath:
      "/Users/hirokimukai/Cloudprojects/link-canvas/test-workspace/src/main.ts",
    fileName: "main.ts",
    content: `import { Calculator } from './calculator';
import { Logger } from '../components/logger';

const calc = new Calculator();
const logger = new Logger('main');

logger.log('Application started');

const result1 = calc.add(5, 3);
logger.log(\`5 + 3 = \${result1}\`);

const result2 = calc.multiply(4, 7);
logger.log(\`4 * 7 = \${result2}\`);

export function main() {
  return {
    result1,
    result2,
  };
}`,
    width: 400,
    height: 300,
    classes: [],
    functions: ["main"],
  };

  const initialNodes: Node[] = [
    {
      id: "1",
      data: testNodeData,
      position: { x: 250, y: 100 },
      type: "codeWindow",
    },
  ];

  const initialEdges: Edge[] = [];

  const [nodes, setNodes] = React.useState(initialNodes);
  const [edges, setEdges] = React.useState(initialEdges);
  const { getZoom, setZoom } = useReactFlow();
  const wheelListenerRef = React.useRef<((event: WheelEvent) => void) | null>(null);

  console.log("[Link Canvas] AppContentコンポーネント レンダリング");

  // ノード変更ハンドラ（useCallbackで最適化）
  const handleNodesChange = React.useCallback((changes: NodeChange[]) => {
    console.log("[Link Canvas] ノード変更", changes);
    setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
  }, []);

  // エッジ変更ハンドラ（useCallbackで最適化）
  const handleEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    console.log("[Link Canvas] エッジ変更", changes);
    setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
  }, []);

  // ビューポート変更監視
  const handleMove = React.useCallback((event: any, viewport: any) => {
    console.log(
      "[Link Canvas] ビューポート変更 - Zoom:",
      viewport.zoom.toFixed(3),
      "Pan:",
      viewport.x.toFixed(1),
      viewport.y.toFixed(1)
    );
  }, []);

  // postMessageリスナーとwheel イベントをセットアップ
  React.useEffect(() => {
    console.log("[Link Canvas] postMessageリスナー セットアップ開始");

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

          const newNodeData: CodeWindowData = {
            filePath: fileMsg.filePath,
            fileName: fileMsg.fileName,
            content: fileMsg.content,
            width: 400,
            height: 300,
            classes,
            functions,
          };

          setNodes((prevNodes) => {
            // ノード位置を計算（既存ノード数に基づいて配置）
            const xPos = prevNodes.length * 450 + 50;
            const yPos = 100;

            const newNode: Node = {
              id: nodeId,
              data: newNodeData,
              position: { x: xPos, y: yPos },
              type: "codeWindow",
            };

            // 既存ノードの重複チェック
            if (prevNodes.some((n) => n.id === nodeId)) {
              console.log(
                "[Link Canvas] 既存ノードのため追加スキップ:",
                nodeId
              );
              return prevNodes;
            }

            const updated = [...prevNodes, newNode];
            console.log("[Link Canvas] 新規ノード作成:", nodeId);
            console.log("[Link Canvas] 現在のノード数:", updated.length);
            return updated;
          });
        } else if (message.type === "zoomIn" || message.type === "zoomOut") {
          const zoomMsg = message as ZoomMessage;
          const currentZoom = getZoom();
          const zoomDelta = 0.1;
          let newZoom = currentZoom;

          if (zoomMsg.type === "zoomIn") {
            newZoom = Math.min(currentZoom + zoomDelta, 1.0);
            console.log(
              "[Link Canvas] ボタン ズームイン:",
              currentZoom.toFixed(3),
              "→",
              newZoom.toFixed(3)
            );
          } else {
            newZoom = Math.max(currentZoom - zoomDelta, 0.1);
            console.log(
              "[Link Canvas] ボタン ズームアウト:",
              currentZoom.toFixed(3),
              "→",
              newZoom.toFixed(3)
            );
          }

          setZoom(newZoom);
        }
      }
    };

    // Shift + ホイール処理（一度だけ登録）
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey) {
        return;
      }

      event.preventDefault();

      const currentZoom = getZoom();
      const zoomDelta = 0.1;
      let newZoom = currentZoom;

      if (event.deltaY < 0) {
        // スクロールアップ = ズームイン
        newZoom = Math.min(currentZoom + zoomDelta, 1.0);
        console.log(
          "[Link Canvas] Shift+ホイール ズームイン:",
          currentZoom.toFixed(3),
          "→",
          newZoom.toFixed(3)
        );
      } else {
        // スクロールダウン = ズームアウト
        newZoom = Math.max(currentZoom - zoomDelta, 0.1);
        console.log(
          "[Link Canvas] Shift+ホイール ズームアウト:",
          currentZoom.toFixed(3),
          "→",
          newZoom.toFixed(3)
        );
      }

      setZoom(newZoom);
    };

    wheelListenerRef.current = handleWheel;
    window.addEventListener("message", messageHandler);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      console.log("[Link Canvas] postMessageリスナー クリーンアップ");
      window.removeEventListener("message", messageHandler);
      if (wheelListenerRef.current) {
        window.removeEventListener("wheel", wheelListenerRef.current);
      }
    };
  }, [getZoom, setZoom]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onMove={handleMove}
        fitView
        minZoom={0.1}
        maxZoom={1.0}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        panOnDrag={true}
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function App() {
  return (
    <ReactFlow nodes={[]} edges={[]}>
      <AppContent />
    </ReactFlow>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
