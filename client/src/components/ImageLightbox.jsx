import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * ImageLightbox
 * 
 * Executive-grade fullscreen modal lightbox for images with:
 * - Ultra-smooth zoom (mouse wheel + toolbar buttons + double-click)
 * - Click & drag pan when zoomed in
 * - 1-Click Copy Image directly to clipboard (as PNG Blob)
 * - Download PNG button
 * - Keyboard shortcuts (Esc, +, -, 0, C)
 * - Global event listener: window.dispatchEvent(new CustomEvent('nexus-open-lightbox', { detail: { src, alt, title } }))
 */
export default function ImageLightbox({
  src: propSrc,
  alt: propAlt,
  title: propTitle,
  isOpen: propIsOpen,
  onClose: propOnClose
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState({ src: "", alt: "", title: "" });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;
  const currentSrc = propSrc || activeImage.src;
  const currentAlt = propAlt || activeImage.alt || "Visual Preview";
  const currentTitle = propTitle || activeImage.title || currentAlt;

  // Listen to global open event
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      if (e.detail?.src) {
        setActiveImage({
          src: e.detail.src,
          alt: e.detail.alt || "Preview",
          title: e.detail.title || e.detail.alt || "Visual Artifact"
        });
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setInternalOpen(true);
      }
    };

    window.addEventListener("nexus-open-lightbox", handleGlobalOpen);
    return () => window.removeEventListener("nexus-open-lightbox", handleGlobalOpen);
  }, []);

  const handleClose = useCallback(() => {
    if (propOnClose) {
      propOnClose();
    } else {
      setInternalOpen(false);
    }
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [propOnClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((prev) => Math.min(prev + 0.25, 4));
      } else if (e.key === "-") {
        e.preventDefault();
        setScale((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === "0") {
        e.preventDefault();
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 4.5));
  };

  // Pan / Drag handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click toggles between fit (1x) and 2x zoom
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  // 1-Click Copy Image as Blob
  const handleCopyImage = async (e) => {
    e.stopPropagation();
    try {
      if (!currentSrc) return;
      
      const res = await fetch(currentSrc);
      const blob = await res.blob();
      
      if (window.ClipboardItem && navigator.clipboard?.write) {
        const pngBlob = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
        await navigator.clipboard.write([
          new ClipboardItem({ [pngBlob.type]: pngBlob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentSrc);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentSrc);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  // 1-Click Download Image
  const handleDownloadImage = (e) => {
    e.stopPropagation();
    if (!currentSrc) return;
    const a = document.createElement("a");
    a.href = currentSrc;
    const cleanName = (currentTitle || "nexus-image")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");
    a.download = `${cleanName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !currentSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentTitle}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(10, 10, 10, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        animation: "lightboxFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        userSelect: "none"
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) handleClose();
      }}
    >
      <style>{`
        @keyframes lightboxFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .lightbox-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          backdrop-filter: blur(8px);
        }
        .lightbox-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-0.5px);
        }
        .lightbox-btn:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          width: "100%",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title and Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "50%" }}>
          <span style={{ fontSize: 16 }}>🖼️</span>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTitle}
            </div>
            <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontFamily: "monospace" }}>
              Zoom: {Math.round(scale * 100)}% • Double-click to toggle fit
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.08)", borderRadius: 8, padding: "2px 4px", border: "1px solid rgba(255, 255, 255, 0.14)" }}>
            <button
              type="button"
              className="lightbox-btn"
              style={{ padding: "4px 8px", background: "transparent", border: "none" }}
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
              title="Zoom out (-)"
            >
              −
            </button>
            <span style={{ color: "#FFFFFF", fontSize: 12, fontFamily: "monospace", minWidth: 44, textAlign: "center" }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="lightbox-btn"
              style={{ padding: "4px 8px", background: "transparent", border: "none" }}
              onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
              title="Zoom in (+)"
            >
              +
            </button>
            <button
              type="button"
              className="lightbox-btn"
              style={{ padding: "4px 8px", background: "transparent", border: "none", fontSize: 11 }}
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
              title="Reset Zoom (0)"
            >
              1:1
            </button>
          </div>

          {/* Copy Image Button */}
          <button
            type="button"
            className="lightbox-btn"
            onClick={handleCopyImage}
            title="Copy image directly to clipboard"
          >
            <span>{copySuccess ? "✓" : "📋"}</span>
            <span>{copySuccess ? "Copied!" : "Copy Image"}</span>
          </button>

          {/* Download Image Button */}
          <button
            type="button"
            className="lightbox-btn"
            onClick={handleDownloadImage}
            title="Download PNG image"
          >
            <span>⤓</span>
            <span>Download</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="lightbox-btn"
            style={{
              padding: "6px 10px",
              background: "rgba(255, 255, 255, 0.18)",
              fontSize: 14,
              fontWeight: 700
            }}
            onClick={handleClose}
            title="Close Lightbox (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in"
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <img
          ref={imageRef}
          src={currentSrc}
          alt={currentAlt}
          draggable={false}
          style={{
            maxWidth: "92vw",
            maxHeight: "84vh",
            objectFit: "contain",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            userSelect: "none"
          }}
        />
      </div>

      {/* Bottom Hint Pill */}
      <div
        style={{
          padding: "12px 24px 20px",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 12,
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
          display: "flex",
          gap: 16
        }}
      >
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Drag to pan</span>
        <span>•</span>
        <span>Double-click to reset</span>
        <span>•</span>
        <span>Press <kbd style={{ background: "rgba(255,255,255,0.15)", padding: "1px 5px", borderRadius: 4, color: "#FFFFFF" }}>Esc</kbd> to exit</span>
      </div>
    </div>
  );
}
