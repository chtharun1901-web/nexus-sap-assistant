import React, { useState, useEffect } from "react";

/**
 * ModernImageLoader (Claude Organic Caustic Shimmer & Lightbox Engine)
 * 
 * Props:
 * - src: image URL or dataUrl
 * - alt: alt text
 * - title: optional title for lightbox
 * - className: optional CSS class
 * - style: optional style overrides
 * - aspectRatio: optional aspect ratio string (e.g. "16/9", "4/3", "auto")
 * - maxHeight: optional maxHeight string or number
 * - enableLightbox: boolean, default true
 */
export default function ModernImageLoader({
  src,
  alt = "Visual Artifact",
  title,
  className = "",
  style = {},
  aspectRatio = "auto",
  maxHeight = "520px",
  enableLightbox = true,
  onClick
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (enableLightbox && src && !hasError) {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("nexus-open-lightbox", {
          detail: {
            src,
            alt: alt || "Visual Preview",
            title: title || alt || "Visual Artifact"
          }
        })
      );
    }
  };

  return (
    <div
      className={`modern-image-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#FAF8F5",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        cursor: enableLightbox && !hasError ? "zoom-in" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: aspectRatio,
        maxHeight: maxHeight,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        margin: "12px 0",
        ...style
      }}
      title={enableLightbox ? "Click to expand in fullscreen lightbox" : title || alt}
    >
      <style>{`
        @keyframes claudeCausticShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes claudeIconPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      {/* Concept 1: Claude Warm Organic Caustic Shimmer Loader */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FAF8F5",
            zIndex: 1,
            overflow: "hidden",
            minHeight: 180,
            padding: 24
          }}
        >
          {/* 45° Caustic Light Sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(236, 230, 218, 0.75) 50%, transparent 100%)",
              animation: "claudeCausticShimmer 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              pointerEvents: "none"
            }}
          />

          {/* Center Minimalist Emblem */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#EDE7DD",
                border: "1px solid #DDD5C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
                animation: "claudeIconPulse 2.4s ease-in-out infinite"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9E8E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: "#786C5E",
                letterSpacing: "0.01em",
                fontFamily: "var(--font-sans, -apple-system, sans-serif)"
              }}
            >
              Developing visual artifact...
            </span>
          </div>
        </div>
      )}

      {/* Target Image with Smooth Gaussian Blur Dissolve on Load */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            opacity: isLoaded ? 1 : 0,
            filter: isLoaded ? "blur(0px)" : "blur(14px)",
            transform: isLoaded ? (isHovered && enableLightbox ? "scale(1.008)" : "scale(1)") : "scale(1.03)",
            transition: "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease",
            maxHeight: maxHeight
          }}
        />
      )}

      {/* Hover Lightbox Indicator Pill */}
      {isLoaded && enableLightbox && isHovered && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: "rgba(28, 25, 23, 0.85)",
            backdropFilter: "blur(8px)",
            color: "#FFFFFF",
            padding: "5px 11px",
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 550,
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            pointerEvents: "none",
            animation: "lightboxFadeIn 0.15s ease"
          }}
        >
          <span>🔍</span>
          <span>Click to expand</span>
        </div>
      )}

      {/* Error Fallback Card */}
      {hasError && (
        <div
          style={{
            padding: "24px 20px",
            textAlign: "center",
            color: "var(--text-muted, #78716C)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            width: "100%"
          }}
        >
          <span style={{ fontSize: 24, opacity: 0.6 }}>🖼️</span>
          <div style={{ fontSize: 13, fontWeight: 550, color: "var(--text-primary, #1C1917)" }}>
            Unable to render visual image
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted, #78716C)" }}>
            {alt || "The image source may be unavailable or expired."}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsLoaded(false);
            }}
            style={{
              marginTop: 4,
              padding: "4px 10px",
              fontSize: 11,
              borderRadius: 6,
              background: "var(--bg-surface, rgba(0,0,0,0.06))",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
              cursor: "pointer",
              color: "var(--text-primary, #1C1917)"
            }}
          >
            Retry Loading
          </button>
        </div>
      )}
    </div>
  );
}
