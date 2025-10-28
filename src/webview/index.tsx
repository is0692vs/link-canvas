import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

function App() {
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.1}
        maxZoom={1.0}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
