import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import EnterpriseHierarchyRenderer from "../renderers/EnterpriseHierarchyRenderer.jsx";
import SwimlaneFlowchartRenderer from "../renderers/SwimlaneFlowchartRenderer.jsx";
import UniversalStrategyRenderer from "../renderers/UniversalStrategyRenderer.jsx";
import ContainerBoxesRenderer from "../renderers/ContainerBoxesRenderer.jsx";
import RoadmapRenderer from "../renderers/RoadmapRenderer.jsx";

const MetaphorCanvas = forwardRef(function MetaphorCanvas(
  { data, onSelectNode, selectedNodeId, zoom = 1, onZoomChange },
  ref
) {
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current?.querySelector("svg") || svgRef.current,
    resetView: () => {
      setPan({ x: 0, y: 0 });
      if (onZoomChange) onZoomChange(1);
    }
  }));

  const handleMouseDown = (e) => {
    // Only drag on canvas background, not on interactive nodes
    if (e.target.tagName === "svg" || e.target.classList.contains("canvas-bg")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const nextZoom = Math.min(2.5, Math.max(0.4, zoom + delta));
      if (onZoomChange) onZoomChange(nextZoom);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#FFFFFF",
        cursor: isDragging ? "grabbing" : "default"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom / Pan Container */}
      <div
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {(() => {
          if (!data) return null;

          const pat = (data.visualPattern || data.visualType || data.metaphor || "").toLowerCase();

          // 1. Flowchart (ANSI / ISO with decision diamonds and Yes/No branches)
          if (pat === "flowchart" || (data.lanes && data.edges && !data.visualPattern && !data.levels)) {
            return (
              <SwimlaneFlowchartRenderer
                data={data}
                onSelectNode={onSelectNode}
                selectedNodeId={selectedNodeId}
              />
            );
          }

          // 2. Enterprise Hierarchy (Multi-tier tree / bus structure)
          if (pat === "enterprise_hierarchy" || (data.levels && data.levels.length > 0)) {
            return (
              <EnterpriseHierarchyRenderer
                data={data}
                onSelectNode={onSelectNode}
                selectedNodeId={selectedNodeId}
              />
            );
          }

          // 3. Physical Container Boxes / Storage Crates
          if (pat === "containers" || data.containers) {
            return (
              <svg viewBox="0 0 1180 620" width="100%" height="100%" style={{ display: "block" }}>
                <ContainerBoxesRenderer
                  data={data}
                  onSelectNode={onSelectNode}
                  selectedNodeId={selectedNodeId}
                />
              </svg>
            );
          }

          // 4. Physical Roadmap / Milestone Track
          if (pat === "roadmap" || (data.phases && !data.visualPattern)) {
            return (
              <svg viewBox="0 0 1180 620" width="100%" height="100%" style={{ display: "block" }}>
                <RoadmapRenderer
                  data={data}
                  onSelectNode={onSelectNode}
                  selectedNodeId={selectedNodeId}
                />
              </svg>
            );
          }

          // 5. Universal Strategy Renderer:
          // Covers Transformation Bridge, Hub & Spoke, 2x2 Matrix, Maturity Staircase, Problem-Impact, Layered Architecture
          return (
            <UniversalStrategyRenderer
              data={data}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
            />
          );
        })()}
      </div>

      {/* Floating Canvas Controls (Reset, Zoom Indicator) */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-card, #FFFFFF)",
          border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
          borderRadius: 8,
          padding: "4px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          zIndex: 10,
          fontSize: 12,
          fontFamily: "'Aptos', var(--font-mono)"
        }}
      >
        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            if (onZoomChange) onZoomChange(1);
          }}
          title="Reset Zoom & Pan"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted, #6B7280)",
            cursor: "pointer",
            fontWeight: 600,
            padding: "2px 6px"
          }}
        >
          Reset View
        </button>
        <span style={{ color: "var(--border-subtle, #CBD5E1)" }}>|</span>
        <button
          onClick={() => onZoomChange && onZoomChange(Math.max(0.4, zoom - 0.1))}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
        >
          -
        </button>
        <span style={{ minWidth: 42, textAlign: "center", fontWeight: 700 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange && onZoomChange(Math.min(2.5, zoom + 0.1))}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
        >
          +
        </button>
      </div>
    </div>
  );
});

export default MetaphorCanvas;
