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

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    // 閉じるボタンの場合はドラッグしない
    if (
      (e.target as HTMLElement).classList.contains("code-window__close-btn")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    console.log("[Link Canvas] タイトルバードラッグ開始:", data.fileName);
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
    >
      {/* タイトルバー（ドラッグハンドル） */}
      <div
        className="code-window__title-bar"
        onMouseDown={handleTitleBarMouseDown}
        style={{ cursor: "move" }}
      >
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
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--ne"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--sw"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--se"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />
      </div>
    </div>
  );
};
