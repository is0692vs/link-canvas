import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CodeWindow, type CodeWindowData } from "../components/CodeWindow";
import { useZoomLevel } from "../hooks/useZoomLevel";

/**
 * React FlowのノードとしてのCodeWindow
 * ズームレベルに応じてプレビューまたはコード表示を切り替える
 */
export const CodeWindowNode: React.FC<NodeProps> = ({
  data,
  isConnectable = true,
}) => {
  const nodeData = data as CodeWindowData;
  const zoom = useZoomLevel();

  // ズームレベル変更を監視
  React.useEffect(() => {
    console.log("[Link Canvas] CodeWindowNode ズームレベル:", {
      fileName: nodeData.fileName,
      zoom: zoom.toFixed(3),
      isEditorMode: zoom >= 1.0,
    });
  }, [zoom, nodeData.fileName]);

  console.log("[Link Canvas] CodeWindowNode レンダリング:", nodeData.fileName);

  return (
    <div>
      <CodeWindow
        data={nodeData}
        onClose={() =>
          console.log("[Link Canvas] ウィンドウクローズ:", nodeData.fileName)
        }
      />
      {/* 接続ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
};
