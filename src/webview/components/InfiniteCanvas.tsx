import React from "react";
import { CodeWindow, type CodeWindowData } from "./CodeWindow";
import "./InfiniteCanvas.css";

interface InfiniteCanvasProps {
  windows: Array<
    CodeWindowData & { id: string; position: { x: number; y: number } }
  >;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onWindowMove: (id: string, position: { x: number; y: number }) => void;
  onWindowResize: (id: string, width: number, height: number) => void;
  onWindowClose: (id: string) => void;
}

/**
 * ネイティブ無限キャンバス実装（CanvasCodeパターン）
 * CSS transformを使用してズーム・パンを実現
 */
export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  windows,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onWindowMove,
  onWindowResize,
  onWindowClose,
}) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [focusedWindow, setFocusedWindow] = React.useState<string | null>(null);

  console.log("[Link Canvas] InfiniteCanvas レンダリング", {
    windowCount: windows.length,
    zoom: zoom.toFixed(3),
    pan: `${pan.x.toFixed(1)}, ${pan.y.toFixed(1)}`,
  });

  // Shift + マウスホイールでズーム
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;

      e.preventDefault();

      const zoomDelta = 0.1;
      const dominantDelta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (dominantDelta === 0) return;

      // ズーム前：マウス位置のキャンバス座標を計算
      const mouseCanvasXBefore = (e.clientX - pan.x) / zoom;
      const mouseCanvasYBefore = (e.clientY - pan.y) / zoom;

      // 新しいズーム値を計算
      let newZoom = zoom;
      if (dominantDelta < 0) {
        newZoom = Math.min(zoom + zoomDelta, 1.0);
        console.log(
          "[Link Canvas] Shift+ホイール ズームイン:",
          zoom.toFixed(3),
          "→",
          newZoom.toFixed(3)
        );
      } else {
        newZoom = Math.max(zoom - zoomDelta, 0.1);
        console.log(
          "[Link Canvas] Shift+ホイール ズームアウト:",
          zoom.toFixed(3),
          "→",
          newZoom.toFixed(3)
        );
      }

      // ズーム後：同じキャンバス座標がマウス位置に来るようにパンを調整
      const newPanX = e.clientX - mouseCanvasXBefore * newZoom;
      const newPanY = e.clientY - mouseCanvasYBefore * newZoom;

      onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, [zoom, pan, onZoomChange, onPanChange]);

  // マウスドラッグでパン
  const handleMouseDown = (e: React.MouseEvent) => {
    // ウィンドウ外をクリックした場合のみパン開始
    if (e.target === viewportRef.current || e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      console.log("[Link Canvas] パン開始");
    }
  };

  React.useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPan = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };
      onPanChange(newPan);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      console.log("[Link Canvas] パン終了");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, panStart, onPanChange]);

  // ウィンドウドラッグ処理
  const handleWindowDragStart = (
    id: string,
    startX: number,
    startY: number
  ) => {
    const window = windows.find((w) => w.id === id);
    if (!window) return;

    console.log("[Link Canvas] ウィンドウドラッグ開始:", id);
    setFocusedWindow(id);

    const startPos = { ...window.position };

    const handleMouseMove = (e: MouseEvent) => {
      // スクリーン座標の差分をキャンバス座標に変換
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      const newPosition = {
        x: startPos.x + deltaX,
        y: startPos.y + deltaY,
      };

      onWindowMove(id, newPosition);
    };

    const handleMouseUp = () => {
      console.log("[Link Canvas] ウィンドウドラッグ終了:", id);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const canvasStyle: React.CSSProperties = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    transformOrigin: "0 0",
    width: "10000px",
    height: "10000px",
    position: "absolute",
  };

  return (
    <div
      ref={viewportRef}
      className="infinite-canvas-viewport"
      onMouseDown={handleMouseDown}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      <div ref={canvasRef} className="infinite-canvas" style={canvasStyle}>
        {windows.map((window) => (
          <div
            key={window.id}
            className="window-wrapper"
            style={{
              position: "absolute",
              left: `${window.position.x}px`,
              top: `${window.position.y}px`,
              zIndex: focusedWindow === window.id ? 1000 : 1,
            }}
            onMouseDown={(e) => {
              // ウィンドウクリックでフォーカス
              if (e.target !== e.currentTarget) {
                setFocusedWindow(window.id);
              }
            }}
          >
            <CodeWindow
              data={window}
              onClose={() => onWindowClose(window.id)}
              onResize={(width, height) =>
                onWindowResize(window.id, width, height)
              }
              onDragStart={(startX, startY) =>
                handleWindowDragStart(window.id, startX, startY)
              }
              zoom={zoom}
              pan={pan}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
