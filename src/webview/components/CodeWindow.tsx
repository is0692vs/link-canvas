import React from "react";
import { useResize } from "../hooks/useResize";
import { FilePreview } from "./FilePreview";
import { MonacoEditorComponent } from "./MonacoEditor";
import "./CodeWindow.css";

export interface CodeWindowData {
  filePath: string;
  fileName: string;
  content: string;
  width: number;
  height: number;
  classes?: string[];
  functions?: string[];
  [key: string]: unknown;
}

interface CodeWindowProps {
  data: CodeWindowData;
  zoom: number;
  pan: { x: number; y: number };
  onClose?: () => void;
  onResize?: (width: number, height: number) => void;
  onDragStart?: (startX: number, startY: number) => void;
}

/**
 * OSウィンドウ風のコードウィンドウコンポーネント
 * ズームレベルに応じてプレビューまたはMonaco Editorを表示
 */
export const CodeWindow: React.FC<CodeWindowProps> = ({
  data,
  zoom,
  pan,
  onClose,
  onResize,
  onDragStart,
}) => {
  const [width, setWidth] = React.useState(data.width);
  const [height, setHeight] = React.useState(data.height);

  const handleResize = React.useCallback(
    (newWidth: number, newHeight: number) => {
      console.log("[Link Canvas] ウィンドウリサイズ:", { newWidth, newHeight });
      setWidth(newWidth);
      setHeight(newHeight);
      onResize?.(newWidth, newHeight);
    },
    [onResize]
  );

  const { handleResizeStart } = useResize(
    handleResize,
    width,
    height,
    zoom,
    pan
  );

  const handleWindowMouseDown = (e: React.MouseEvent) => {
    // タイトルバー領域のクリック
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // タイトルバー内かチェック (y <= 32)
    if (y > 32) return; // タイトルバー外

    // 四隅除外
    const isInCorner =
      (x <= 20 && y <= 20) || // nw
      (x >= rect.width - 20 && y <= 20) || // ne
      (x <= 20 && y >= 32 - 20) || // sw (タイトルバー下)
      (x >= rect.width - 20 && y >= 32 - 20); // se

    if (isInCorner) return;

    // タイトルバー中央クリック - ドラッグ開始
    e.preventDefault();
    e.stopPropagation();

    console.log("[Link Canvas] タイトルバー中央ドラッグ開始:", data.fileName);
    onDragStart?.(e.clientX, e.clientY);
  };

  const isPreviewMode = zoom < 1.0;
  console.log("[Link Canvas] CodeWindow レンダリング", {
    fileName: data.fileName,
    isPreviewMode,
    zoom,
  });

  const contentHeight = Math.max(height - 32, 0);

  if (!isPreviewMode) {
    console.log("[Link Canvas] Monaco表示領域", {
      fileName: data.fileName,
      width,
      height,
      contentHeight,
    });
  }

  return (
    <div
      className="code-window"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: "none",
      }}
      onMouseDown={handleWindowMouseDown}
    >
      {/* タイトルバー（ドラッグハンドル） */}
      <div className="code-window__title-bar" style={{ cursor: "move" }}>
        <div className="code-window__title">{data.fileName}</div>
        <button
          className="code-window__close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          title="ウィンドウを閉じる"
        >
          ✕
        </button>
      </div>

      {/* コンテンツ */}
      <div
        className={`code-window__content ${
          isPreviewMode ? "code-window__content--preview" : ""
        }`}
        style={!isPreviewMode ? { height: `${contentHeight}px` } : undefined}
      >
        {isPreviewMode ? (
          <FilePreview
            fileName={data.fileName}
            classes={data.classes}
            functions={data.functions}
          />
        ) : (
          <MonacoEditorComponent
            content={data.content}
            fileName={data.fileName}
          />
        )}
      </div>

      {/* リサイズハンドル */}
      <div className="code-window__resize-handles">
        {/* 四隅 */}
        <div
          className="code-window__resize-handle code-window__resize-handle--nw"
          onMouseDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: nw (mouse)");
            console.log(" target/currentTarget", e.target, e.currentTarget);
            e.stopPropagation();
            handleResizeStart(e, "nw");
          }}
          onPointerDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: nw (pointer)", {
              pointerType: (e as React.PointerEvent).pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
            });
            (e as React.PointerEvent).stopPropagation();
            // pass through to existing handler (cast for compatibility)
            handleResizeStart(e as unknown as React.MouseEvent, "nw");
          }}
          onClick={() => console.log("[Link Canvas] リサイズハンドル onClick: nw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--ne"
          onMouseDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: ne (mouse)");
            console.log(" target/currentTarget", e.target, e.currentTarget);
            e.stopPropagation();
            handleResizeStart(e, "ne");
          }}
          onPointerDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: ne (pointer)", {
              pointerType: (e as React.PointerEvent).pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
            });
            (e as React.PointerEvent).stopPropagation();
            handleResizeStart(e as unknown as React.MouseEvent, "ne");
          }}
          onClick={() => console.log("[Link Canvas] リサイズハンドル onClick: ne")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--sw"
          onMouseDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: sw (mouse)");
            console.log(" target/currentTarget", e.target, e.currentTarget);
            e.stopPropagation();
            handleResizeStart(e, "sw");
          }}
          onPointerDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: sw (pointer)", {
              pointerType: (e as React.PointerEvent).pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
            });
            (e as React.PointerEvent).stopPropagation();
            handleResizeStart(e as unknown as React.MouseEvent, "sw");
          }}
          onClick={() => console.log("[Link Canvas] リサイズハンドル onClick: sw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--se"
          onMouseDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: se (mouse)");
            console.log(" target/currentTarget", e.target, e.currentTarget);
            e.stopPropagation();
            handleResizeStart(e, "se");
          }}
          onPointerDown={(e) => {
            console.log("[Link Canvas] リサイズハンドルクリック: se (pointer)", {
              pointerType: (e as React.PointerEvent).pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
            });
            (e as React.PointerEvent).stopPropagation();
            handleResizeStart(e as unknown as React.MouseEvent, "se");
          }}
          onClick={() => console.log("[Link Canvas] リサイズハンドル onClick: se")}
        />
      </div>
    </div>
  );
};
