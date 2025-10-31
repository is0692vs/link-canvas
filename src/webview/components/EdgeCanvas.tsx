import React from "react";
import type { EdgeData, EdgeCoordinates } from "../types/EdgeData";
import type { CodeWindowData } from "./CodeWindow";
import "./EdgeCanvas.css";

interface EdgeCanvasProps {
  edges: EdgeData[];
  windows: Array<
    CodeWindowData & { id: string; position: { x: number; y: number } }
  >;
  zoom: number;
  pan: { x: number; y: number };
  onEdgeClick?: (edgeId: string) => void;
  onEdgeHover?: (edgeId: string | null) => void;
}

/**
 * エッジ（依存関係の線）を描画するSVGキャンバス
 */
export const EdgeCanvas: React.FC<EdgeCanvasProps> = ({
  edges,
  windows,
  zoom,
  pan,
  onEdgeClick,
  onEdgeHover,
}) => {
  const [hoveredEdge, setHoveredEdge] = React.useState<string | null>(null);

  console.log("[Link Canvas] EdgeCanvas レンダリング", {
    edgeCount: edges.length,
    windowCount: windows.length,
    zoom: zoom.toFixed(3),
  });

  /**
   * ウィンドウの接続ポイントの座標を計算
   */
  const getConnectionPoint = (
    window: CodeWindowData & { id: string; position: { x: number; y: number } },
    handle?: string
  ): { x: number; y: number } => {
    const { position, width, height } = window;
    const centerX = position.x + width / 2;
    const centerY = position.y + height / 2;

    switch (handle) {
      case "top":
        return { x: centerX, y: position.y };
      case "bottom":
        return { x: centerX, y: position.y + height };
      case "left":
        return { x: position.x, y: centerY };
      case "right":
        return { x: position.x + width, y: centerY };
      default:
        // デフォルトは右端の中央
        return { x: position.x + width, y: centerY };
    }
  };

  /**
   * エッジの座標を計算
   */
  const calculateEdgeCoordinates = (edge: EdgeData): EdgeCoordinates | null => {
    const sourceWindow = windows.find((w) => w.id === edge.source);
    const targetWindow = windows.find((w) => w.id === edge.target);

    if (!sourceWindow || !targetWindow) {
      console.warn(
        `[Link Canvas] エッジ ${edge.id} の始点または終点ウィンドウが見つかりません`
      );
      return null;
    }

    const sourcePoint = getConnectionPoint(sourceWindow, edge.sourceHandle);
    const targetPoint = getConnectionPoint(targetWindow, edge.targetHandle);

    // ベジェ曲線の制御点を計算（始点と終点の中間で少し外側に）
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlDistance = Math.min(distance * 0.3, 150);

    // 接続ハンドルの方向に基づいて制御点を調整
    let controlX = sourcePoint.x + dx / 2;
    let controlY = sourcePoint.y + dy / 2;

    if (edge.sourceHandle === "right") {
      controlX = sourcePoint.x + controlDistance;
    } else if (edge.sourceHandle === "left") {
      controlX = sourcePoint.x - controlDistance;
    }

    return {
      x1: sourcePoint.x,
      y1: sourcePoint.y,
      x2: targetPoint.x,
      y2: targetPoint.y,
      controlX,
      controlY,
    };
  };

  /**
   * SVGパスを生成（二次ベジェ曲線）
   */
  const generatePath = (coords: EdgeCoordinates): string => {
    const { x1, y1, x2, y2, controlX, controlY } = coords;

    if (controlX !== undefined && controlY !== undefined) {
      // 二次ベジェ曲線
      return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    } else {
      // 直線
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
  };

  const handleEdgeClick = (edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("[Link Canvas] エッジクリック:", edgeId);
    onEdgeClick?.(edgeId);
  };

  const handleEdgeMouseEnter = (edgeId: string) => {
    setHoveredEdge(edgeId);
    onEdgeHover?.(edgeId);
    console.log("[Link Canvas] エッジホバー開始:", edgeId);
  };

  const handleEdgeMouseLeave = () => {
    setHoveredEdge(null);
    onEdgeHover?.(null);
  };

  return (
    <svg
      className="edge-canvas"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "10000px",
        height: "10000px",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* 矢印マーカーの定義 */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#888" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#4a9eff" />
        </marker>
      </defs>

      {/* エッジの描画 */}
      {edges.map((edge) => {
        const coords = calculateEdgeCoordinates(edge);
        if (!coords) return null;

        const isHovered = hoveredEdge === edge.id;
        const style = edge.style || {};
        const color = isHovered ? "#4a9eff" : style.color || "#888";
        const width = style.width || 2;
        const dashed = style.dashed || false;
        const animated = style.animated || false;

        const pathData = generatePath(coords);
        const strokeDasharray = dashed ? "5,5" : undefined;
        const markerEnd = isHovered
          ? "url(#arrowhead-hover)"
          : "url(#arrowhead)";

        return (
          <g key={edge.id} className="edge-group">
            {/* 透明な太い線（クリック/ホバー用） */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(width + 10, 15)}
              style={{
                pointerEvents: "stroke",
                cursor: "pointer",
              }}
              onClick={(e) => handleEdgeClick(edge.id, e)}
              onMouseEnter={() => handleEdgeMouseEnter(edge.id)}
              onMouseLeave={handleEdgeMouseLeave}
            />
            {/* 実際に表示される線 */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? width + 1 : width}
              strokeDasharray={strokeDasharray}
              markerEnd={markerEnd}
              style={{
                pointerEvents: "none",
                transition: "stroke 0.2s ease, stroke-width 0.2s ease",
              }}
              className={animated ? "edge-animated" : ""}
            />
            {/* エッジラベル（あれば） */}
            {edge.label && (
              <text
                x={(coords.x1 + coords.x2) / 2}
                y={(coords.y1 + coords.y2) / 2}
                fill={color}
                fontSize="12"
                textAnchor="middle"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
