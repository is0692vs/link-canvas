import React from "react";
import { useZoomLevel } from "../hooks/useZoomLevel";
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
  onClose?: () => void;
  onResize?: (width: number, height: number) => void;
}

/**
 * OSウィンドウ風のコードウィンドウコンポーネント
 * ズームレベルに応じてプレビューまたはMonaco Editorを表示
 */
export const CodeWindow: React.FC<CodeWindowProps> = ({
  data,
  onClose,
  onResize,
}) => {
  const [width, setWidth] = React.useState(data.width);
  const [height, setHeight] = React.useState(data.height);
  const zoomLevel = useZoomLevel();

  const handleResize = React.useCallback(
    (newWidth: number, newHeight: number) => {
      console.log("[Link Canvas] ウィンドウリサイズ:", { newWidth, newHeight });
      setWidth(newWidth);
      setHeight(newHeight);
      onResize?.(newWidth, newHeight);
    },
    [onResize]
  );

  const { handleResizeStart } = useResize(handleResize, width, height);

  const isPreviewMode = zoomLevel < 1.0;
  console.log("[Link Canvas] CodeWindow レンダリング", {
    fileName: data.fileName,
    isPreviewMode,
    zoomLevel,
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
      <div className="code-window__title-bar">
        <div className="code-window__title">{data.fileName}</div>
        <button
          className="code-window__close-btn nodrag"
          onClick={onClose}
          title="ウィンドウを閉じる"
        >
          ✕
        </button>
      </div>

      {/* コンテンツ（ドラッグ不可） */}
      <div
        className={`code-window__content nodrag ${
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
          className="code-window__resize-handle code-window__resize-handle--nw nodrag"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--ne nodrag"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--sw nodrag"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--se nodrag"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />

        {/* 四辺 */}
        <div
          className="code-window__resize-handle code-window__resize-handle--n nodrag"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--s nodrag"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--w nodrag"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        />
        <div
          className="code-window__resize-handle code-window__resize-handle--e nodrag"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
      </div>
    </div>
  );
};
