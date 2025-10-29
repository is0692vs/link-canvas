import React from "react";
import ReactDOM from "react-dom";
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
  onContextMenu?: (
    action: "definition" | "references",
    filePath: string,
    line: number,
    column: number,
    selectedText: string
  ) => void;
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
  onContextMenu,
}) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  // refs to each window wrapper so we can compute screen rects for overlay handles
  const windowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  // overlay resize state
  const overlayResizeRef = React.useRef<{
    isResizing: boolean;
    windowId: string | null;
    direction: string | null;
    startClientX: number;
    startClientY: number;
    startWidth: number;
    startHeight: number;
    // starting top-left position of the window (canvas coordinates)
    startPosX?: number;
    startPosY?: number;
  } | null>(null);
  const [, setOverlayTick] = React.useState(0);
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
      // debug: log wheel events to help diagnose shift+wheel not firing
      console.log("[Link Canvas] wheel event", {
        shiftKey: e.shiftKey,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        clientX: e.clientX,
        clientY: e.clientY,
      });
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

  // DEBUG: グローバル pointerdown を捕捉して、クリックがブラウザに到達しているか確認
  React.useEffect(() => {
    const debugHandler = (e: PointerEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const className = target?.className ?? null;
        const id = target?.id ?? null;
        const rect = target?.getBoundingClientRect
          ? target.getBoundingClientRect()
          : null;
        console.log("[Link Canvas][GLOBAL] pointerdown", {
          pointerType: e.pointerType,
          clientX: e.clientX,
          clientY: e.clientY,
          targetClass: className,
          targetId: id,
          targetRect: rect,
        });
      } catch (err) {
        console.log("[Link Canvas][GLOBAL] pointerdown error", err);
      }
    };

    // capture フェーズで拾うことで、他のハンドラで stopPropagation される前に検出できる
    document.addEventListener("pointerdown", debugHandler, true);
    return () =>
      document.removeEventListener("pointerdown", debugHandler, true);
  }, []);

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

  // --- Overlay-based resize logic (ensures handles receive events above Monaco) ---
  // Attach overlay move/up handlers directly on pointerdown so they run immediately.
  const overlayMove = React.useCallback(
    (e: PointerEvent) => {
      const state = overlayResizeRef.current;
      if (!state || !state.isResizing || !state.windowId) return;

      const currentCanvasX = (e.clientX - pan.x) / zoom;
      const currentCanvasY = (e.clientY - pan.y) / zoom;

      const startCanvasX = (state.startClientX - pan.x) / zoom;
      const startCanvasY = (state.startClientY - pan.y) / zoom;

      const deltaX = currentCanvasX - startCanvasX;
      const deltaY = currentCanvasY - startCanvasY;

      let newWidth = state.startWidth;
      let newHeight = state.startHeight;
      // defaults: position may change when resizing from left/top edges
      let newPosX = state.startPosX ?? 0;
      let newPosY = state.startPosY ?? 0;

      // horizontal
      if (["nw", "w", "sw"].includes(state.direction || "")) {
        // dragging left edge: width decreases when pointer moves right (deltaX > 0)
        const proposed = state.startWidth - deltaX;
        newWidth = Math.max(200, proposed);
        // left movement = startWidth - newWidth
        newPosX = (state.startPosX ?? 0) + (state.startWidth - newWidth);
      } else if (["ne", "e", "se"].includes(state.direction || "")) {
        newWidth = Math.max(200, state.startWidth + deltaX);
      }
      // vertical
      if (["nw", "n", "ne"].includes(state.direction || "")) {
        const proposed = state.startHeight - deltaY;
        newHeight = Math.max(150, proposed);
        // top movement = startHeight - newHeight
        newPosY = (state.startPosY ?? 0) + (state.startHeight - newHeight);
      } else if (["sw", "s", "se"].includes(state.direction || "")) {
        newHeight = Math.max(150, state.startHeight + deltaY);
      }

      // apply size update
      onWindowResize(state.windowId, newWidth, newHeight);
      // if position changed (left/top dragging), notify parent to move window
      const roundedX = Math.round(newPosX * 100) / 100;
      const roundedY = Math.round(newPosY * 100) / 100;
      if (
        roundedX !== (state.startPosX ?? 0) ||
        roundedY !== (state.startPosY ?? 0)
      ) {
        onWindowMove(state.windowId, { x: roundedX, y: roundedY });
      }
    },
    [pan, zoom, onWindowResize, onWindowMove]
  );

  const overlayUp = React.useCallback(() => {
    overlayResizeRef.current = null;
    document.removeEventListener("pointermove", overlayMove as any);
    document.removeEventListener("pointerup", overlayUp as any);
    console.log("[Link Canvas] overlay resize end");
  }, [overlayMove]);

  // cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", overlayMove as any);
      document.removeEventListener("pointerup", overlayUp as any);
    };
  }, [overlayMove, overlayUp]);

  // keep overlay positions updated each render / on layout changes
  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      setOverlayTick((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
            ref={(el) => (windowRefs.current[window.id] = el)}
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
              onContextMenu={onContextMenu}
              zoom={zoom}
              pan={pan}
            />
          </div>
        ))}

        {/* Overlay handles portal - rendered at document.body so they sit above Monaco */}
        {typeof document !== "undefined"
          ? ReactDOM.createPortal(
              <div
                className="link-canvas-overlay"
                style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                  zIndex: 999999,
                }}
              >
                {windows.map((w) => {
                  const wrapper = windowRefs.current[w.id];
                  if (!wrapper) return null;
                  // prefer the white code content area rect so handles align to code region
                  // try to find the content area inside the code window
                  const contentEl =
                    (wrapper.querySelector &&
                      (wrapper.querySelector(
                        ".code-window__content"
                      ) as HTMLElement)) ||
                    null;
                  const wrapperRect = wrapper.getBoundingClientRect();
                  // If content area exists, use its rect. Otherwise, treat the
                  // wrapper minus titlebar as the virtual content area so handles
                  // avoid overlapping the close button / titlebar area.
                  const TITLEBAR_HEIGHT = 32;
                  const rect = contentEl
                    ? contentEl.getBoundingClientRect()
                    : ({
                        left: wrapperRect.left,
                        top: wrapperRect.top + TITLEBAR_HEIGHT,
                        width: wrapperRect.width,
                        height: Math.max(
                          0,
                          wrapperRect.height - TITLEBAR_HEIGHT
                        ),
                        right: wrapperRect.right,
                        bottom: wrapperRect.bottom - TITLEBAR_HEIGHT,
                      } as DOMRect);
                  // Use a fixed handle size so the red overlay area stays constant
                  // regardless of window dimensions or zoom.
                  const HANDLE = 30; // px (fixed)
                  // // Compute handle size relative to window so zoom/resize don't break hit areas
                  // const MIN_HANDLE = 28;
                  // const MAX_HANDLE = 72;
                  // const HANDLE_PCT = 0.08; // 8% of min(width,height)
                  // const base = Math.min(rect.width, rect.height);
                  // const HANDLE = Math.max(
                  //   MIN_HANDLE,
                  //   Math.min(MAX_HANDLE, Math.round(base * HANDLE_PCT))
                  // );

                  // Anchor handles so they align to edges/corners of the code content area.
                  // NW/NE are aligned to the top-left / top-right of the white code area
                  // (or the virtual content area if the content element isn't present).
                  const handles = {
                    nw: { left: rect.left, top: rect.top },
                    ne: {
                      left: rect.left + rect.width - HANDLE,
                      top: rect.top,
                    },
                    sw: {
                      left: rect.left,
                      top: rect.top + rect.height - HANDLE,
                    },
                    se: {
                      left: rect.left + rect.width - HANDLE,
                      top: rect.top + rect.height - HANDLE,
                    },
                  } as const;

                  const makeHandle = (dir: keyof typeof handles) => {
                    const pos = handles[dir];
                    return (
                      <div
                        key={`${w.id}-${dir}`}
                        className={`code-window__resize-handle code-window__resize-handle--${dir}`}
                        style={{
                          position: "fixed",
                          left: `${Math.round(pos.left)}px`,
                          top: `${Math.round(pos.top)}px`,
                          width: `${HANDLE}px`,
                          height: `${HANDLE}px`,
                          pointerEvents: "auto",
                          zIndex: 999999,
                          // debug-visuals to make handles obvious during troubleshooting
                          // backgroundColor: "rgba(255,0,0,0.45)", // commented out to make handles transparent
                          backgroundColor: "transparent",
                          // border: "2px solid rgba(0,0,0,0.6)", // commented out to remove visible frame
                          border: "none",
                          boxShadow: "none",
                          borderRadius: "4px",
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            // capture pointer so pointermove events are routed to this element
                            (e.target as Element).setPointerCapture?.(
                              (e as React.PointerEvent).pointerId
                            );
                          } catch (err) {
                            // ignore if not supported
                          }
                          overlayResizeRef.current = {
                            isResizing: true,
                            windowId: w.id,
                            direction: dir,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            startWidth: w.width,
                            startHeight: w.height,
                            startPosX: w.position.x,
                            startPosY: w.position.y,
                          };
                          // attach document pointer listeners immediately so move/up are captured
                          document.addEventListener(
                            "pointermove",
                            overlayMove as any
                          );
                          document.addEventListener(
                            "pointerup",
                            overlayUp as any
                          );
                          console.log(
                            "[Link Canvas] overlay resize start",
                            w.id,
                            dir
                          );
                        }}
                      >
                        {/*
                        <div
                          style={{
                            position: "absolute",
                            right: 2,
                            bottom: 2,
                            fontSize: 10,
                            color: "white",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            padding: "1px 4px",
                            borderRadius: 3,
                            pointerEvents: "none",
                            opacity: 0.9,
                          }}
                        >
                          {dir}
                        </div>
                        */}
                      </div>
                    );
                  };

                  return (
                    <React.Fragment key={`overlay-${w.id}`}>
                      {makeHandle("nw")}
                      {makeHandle("ne")}
                      {makeHandle("sw")}
                      {makeHandle("se")}
                      {console.log(
                        "[Link Canvas] overlay handles rendered for",
                        w.id,
                        {
                          nw: handles.nw,
                          ne: handles.ne,
                          sw: handles.sw,
                          se: handles.se,
                        }
                      )}
                    </React.Fragment>
                  );
                })}
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  );
};
