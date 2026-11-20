import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  copyTableToClipboard,
  exportTableCSV,
  stripMarkdown
} from "../utils/tableClipboardUtils.js";

/**
 * ModernTableCard
 * 
 * Claude-style interactive table card with:
 * - Floating action bar on hover
 * - 1-Click Clean Copy for Excel / Google Sheets (Multi-MIME: Rich HTML + Clean TSV without markdown clutter)
 * - 1-Click Export CSV (with UTF-8 BOM for native Excel opening)
 * - Optional Copy as Markdown for documentation
 * - In-table search & filter for large datasets
 * - Zebra row styling & subtle hover highlight
 */
export default function ModernTableCard({
  headers = [],
  rows = [],
  renderInline = (x) => x,
  className = "",
  style = {}
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedType, setCopiedType] = useState(null); // 'excel' | 'tsv' | 'md' | null
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    if (!showCopyMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowCopyMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCopyMenu]);

  // Filter rows based on search term (compares against clean stripped text and raw)
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => {
        const raw = String(cell || "").toLowerCase();
        const clean = stripMarkdown(cell).toLowerCase();
        return raw.includes(term) || clean.includes(term);
      })
    );
  }, [rows, searchTerm]);

  // Target rows to copy: filtered subset if actively searching, else all rows
  const targetRows = useMemo(() => {
    return searchTerm.trim() && filteredRows.length > 0 ? filteredRows : rows;
  }, [searchTerm, filteredRows, rows]);

  // Primary Copy: 1-Click formatted for Excel / Google Sheets / Word (multi-mime: text/html + clean TSV)
  const handleCopyForExcel = async (e) => {
    if (e) e.stopPropagation();
    setShowCopyMenu(false);
    const ok = await copyTableToClipboard(headers, targetRows, { asMarkdown: false });
    if (ok) {
      setCopiedType("excel");
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Copy as clean plain TSV
  const handleCopyCleanTSV = async (e) => {
    if (e) e.stopPropagation();
    setShowCopyMenu(false);
    const ok = await copyTableToClipboard(headers, targetRows, { asTSVOnly: true });
    if (ok) {
      setCopiedType("tsv");
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Copy as GitHub Flavored Markdown
  const handleCopyMarkdown = async (e) => {
    if (e) e.stopPropagation();
    setShowCopyMenu(false);
    const ok = await copyTableToClipboard(headers, targetRows, { asMarkdown: true });
    if (ok) {
      setCopiedType("md");
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Export as standardized .csv file with UTF-8 BOM
  const handleExportCSV = (e) => {
    e.stopPropagation();
    exportTableCSV(headers, targetRows, `nexus-table-${Date.now()}.csv`);
  };

  const isCopied = Boolean(copiedType);

  return (
    <div
      className={`modern-table-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        margin: "18px 0",
        borderRadius: 10,
        border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))",
        backgroundColor: "var(--bg-card, #FFFFFF)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        position: "relative",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        ...style
      }}
    >
      {/* Table Header Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "var(--bg-surface, #FAFAF7)",
          borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
          fontSize: 12,
          color: "var(--text-muted, #78716C)",
          gap: 10,
          flexWrap: "wrap"
        }}
      >
        {/* Left: Row & Column count info */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 550 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span>
            {rows.length} {rows.length === 1 ? "row" : "rows"} · {headers.length} columns
          </span>
          {searchTerm && (
            <span style={{ color: "#D97706", fontWeight: 600 }}>
              ({filteredRows.length} matching)
            </span>
          )}
        </div>

        {/* Right: Search Filter + 1-Click Copy / Export Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          {/* Quick Search Input (shows if >= 3 rows) */}
          {rows.length >= 3 && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter table..."
              style={{
                padding: "3px 8px",
                fontSize: 11.5,
                borderRadius: 6,
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.15))",
                background: "var(--bg-card, #FFFFFF)",
                color: "var(--text-primary, #1C1917)",
                outline: "none",
                width: 110,
                transition: "all 0.15s ease"
              }}
              onFocus={(e) => { e.currentTarget.style.width = "140px"; }}
              onBlur={(e) => { if (!searchTerm) e.currentTarget.style.width = "110px"; }}
            />
          )}

          {/* Copy Button Group: 1-Click Primary + Options Menu */}
          <div ref={menuRef} style={{ display: "inline-flex", position: "relative" }}>
            <button
              type="button"
              onClick={handleCopyForExcel}
              title="Copy clean table to clipboard (formatted natively for Excel, Sheets, and Word)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                background: isCopied ? "rgba(16, 185, 129, 0.1)" : "var(--bg-card, #FFFFFF)",
                border: `1px solid ${isCopied ? "#10B981" : "var(--border-subtle, rgba(0,0,0,0.15))"}`,
                borderRight: "none",
                color: isCopied ? "#059669" : "var(--text-primary, #1C1917)",
                fontSize: 11.5,
                fontWeight: 550,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>{isCopied ? "✓" : "📋"}</span>
              <span>{isCopied ? (copiedType === "md" ? "Copied MD" : "Copied!") : "Copy for Excel"}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCopyMenu((prev) => !prev);
              }}
              title="More copy formats (TSV, Markdown)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px 5px",
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                background: isCopied ? "rgba(16, 185, 129, 0.1)" : "var(--bg-card, #FFFFFF)",
                border: `1px solid ${isCopied ? "#10B981" : "var(--border-subtle, rgba(0,0,0,0.15))"}`,
                color: isCopied ? "#059669" : "var(--text-muted, #78716C)",
                fontSize: 10,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              ▾
            </button>

            {/* Dropdown Menu for Alternative Formats */}
            {showCopyMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "var(--bg-card, #FFFFFF)",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle, rgba(0,0,0,0.12))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  padding: "4px 0",
                  zIndex: 50,
                  minWidth: 170
                }}
              >
                <div
                  onClick={handleCopyForExcel}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11.5,
                    color: "var(--text-primary, #1C1917)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface, #F5F5F0)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span>📋</span>
                  <span>Copy for Excel / Sheets</span>
                </div>
                <div
                  onClick={handleCopyCleanTSV}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11.5,
                    color: "var(--text-primary, #1C1917)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface, #F5F5F0)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span>📄</span>
                  <span>Copy as Clean TSV</span>
                </div>
                <div
                  onClick={handleCopyMarkdown}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11.5,
                    color: "var(--text-primary, #1C1917)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface, #F5F5F0)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span>📑</span>
                  <span>Copy as Markdown</span>
                </div>
              </div>
            )}
          </div>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download clean table as UTF-8 .csv file"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: "var(--bg-card, #FFFFFF)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.15))",
              color: "var(--text-primary, #1C1917)",
              fontSize: 11.5,
              fontWeight: 550,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <span>⤓</span>
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content Scroll Viewport */}
      <div style={{ overflowX: "auto", width: "100%", maxHeight: 440 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13.5,
            fontFamily: "var(--font-sans, -apple-system, sans-serif)",
            textAlign: "left"
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--bg-surface, #FBFBF9)",
                borderBottom: "1.5px solid var(--border-subtle, rgba(0, 0, 0, 0.1))"
              }}
            >
              {headers.map((col, cIdx) => (
                <th
                  key={cIdx}
                  style={{
                    padding: "9px 14px",
                    fontWeight: 600,
                    color: "var(--text-primary, #1F1F1E)",
                    borderRight: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))",
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap"
                  }}
                >
                  {renderInline(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.05))",
                    background: rIdx % 2 === 0 ? "transparent" : "var(--bg-surface, #FAFAF7)",
                    transition: "background-color 0.1s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(217, 119, 6, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? "transparent" : "var(--bg-surface, #FAFAF7)";
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: "9px 14px",
                        borderRight: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))",
                        color: "var(--text-body, #333330)",
                        lineHeight: 1.5
                      }}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length || 1}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--text-muted, #78716C)",
                    fontStyle: "italic"
                  }}
                >
                  No matching rows found for "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
