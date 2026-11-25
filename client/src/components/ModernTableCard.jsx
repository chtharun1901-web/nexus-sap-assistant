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
  const [sortConfig, setSortConfig] = useState({ colIndex: null, direction: null });
  const [hoveredCol, setHoveredCol] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const menuRef = useRef(null);

  const dispatchToast = (message, type = "success") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("nexus-toast", {
          detail: { message, type }
        })
      );
    }
  };

  const parseNumericValue = (cell) => {
    const cleaned = stripMarkdown(cell ?? "")
      .trim()
      .replace(/[$€£¥,\s%]/g, "");
    if (!cleaned || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

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

  // Sort filtered rows based on sortConfig
  const sortedRows = useMemo(() => {
    const { colIndex, direction } = sortConfig;
    if (colIndex === null || !direction) return filteredRows;

    const factor = direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((rowA, rowB) => {
      const cellA = rowA?.[colIndex];
      const cellB = rowB?.[colIndex];
      const textA = stripMarkdown(cellA ?? "").trim();
      const textB = stripMarkdown(cellB ?? "").trim();

      if (!textA && !textB) return 0;
      if (!textA) return 1;
      if (!textB) return -1;

      const numA = parseNumericValue(cellA);
      const numB = parseNumericValue(cellB);
      if (numA !== null && numB !== null) {
        return (numA - numB) * factor;
      }

      return (
        textA.localeCompare(textB, undefined, {
          numeric: true,
          sensitivity: "base"
        }) * factor
      );
    });
  }, [filteredRows, sortConfig]);

  const handleSortColumn = (colIndex) => {
    setSortConfig((prev) => {
      if (prev.colIndex !== colIndex) {
        return { colIndex, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { colIndex, direction: "desc" };
      }
      return { colIndex: null, direction: null };
    });
  };

  // Derive chart data from sortedRows
  const chartData = useMemo(() => {
    if (!sortedRows.length || !headers.length) {
      return { items: [], labelHeader: "", valueHeader: "", isFallback: false };
    }

    let valueCol = -1;
    for (let c = 0; c < headers.length; c++) {
      let nonEmptyCount = 0;
      let numericCount = 0;
      for (let r = 0; r < sortedRows.length; r++) {
        const raw = stripMarkdown(sortedRows[r]?.[c] ?? "").trim();
        if (raw !== "") {
          nonEmptyCount++;
          if (parseNumericValue(sortedRows[r]?.[c]) !== null) {
            numericCount++;
          }
        }
      }
      if (numericCount > 0 && numericCount >= nonEmptyCount * 0.5) {
        valueCol = c;
        break;
      }
    }

    const isFallback = valueCol === -1;
    let labelCol = 0;
    if (!isFallback && valueCol === 0) {
      labelCol = headers.length > 1 ? 1 : 0;
    }

    const items = sortedRows.map((row, idx) => {
      const labelText = stripMarkdown(row?.[labelCol] ?? "").trim() || `Row ${idx + 1}`;
      if (isFallback) {
        const fallbackVal = Math.max(1, stripMarkdown(row?.[labelCol] ?? "").trim().length);
        return {
          label: labelText,
          value: fallbackVal,
          displayValue: `${fallbackVal} chars`
        };
      }
      const rawVal = stripMarkdown(row?.[valueCol] ?? "").trim();
      const parsed = parseNumericValue(row?.[valueCol]);
      const val = parsed !== null ? parsed : 0;
      return {
        label: labelText,
        value: val,
        displayValue: rawVal || "0"
      };
    });

    const maxVal = Math.max(...items.map((d) => Math.abs(d.value)), 1);

    return {
      items: items.map((d) => ({
        ...d,
        percent: Math.max(0, Math.min(100, (Math.abs(d.value) / maxVal) * 100))
      })),
      labelHeader: stripMarkdown(headers[labelCol] ?? ""),
      valueHeader: isFallback ? "Cell Length" : stripMarkdown(headers[valueCol] ?? ""),
      isFallback
    };
  }, [sortedRows, headers]);

  // Target rows to copy: filtered/sorted subset if active, else all rows
  const targetRows = useMemo(() => {
    if ((searchTerm.trim() || sortConfig.direction) && sortedRows.length > 0) {
      return sortedRows;
    }
    return rows;
  }, [searchTerm, sortConfig.direction, sortedRows, rows]);

  // Primary Copy: 1-Click formatted for Excel / Google Sheets / Word (multi-mime: text/html + clean TSV)
  const handleCopyForExcel = async (e) => {
    if (e) e.stopPropagation();
    setShowCopyMenu(false);
    const ok = await copyTableToClipboard(headers, targetRows, { asMarkdown: false });
    if (ok) {
      setCopiedType("excel");
      dispatchToast("✓ Table copied to clipboard for Excel", "success");
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
      dispatchToast("✓ Table copied to clipboard as TSV", "success");
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
      dispatchToast("✓ Table copied to clipboard as Markdown", "success");
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Export as standardized .csv file with UTF-8 BOM
  const handleExportCSV = (e) => {
    e.stopPropagation();
    exportTableCSV(headers, targetRows, `nexus-table-${Date.now()}.csv`);
    dispatchToast("✓ Table exported as CSV", "success");
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

          {/* 1-Click Quick Chart Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowChart((prev) => !prev);
            }}
            title={showChart ? "Switch back to table view" : "Visualize table data as an inline bar chart"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: showChart ? "rgba(212, 98, 43, 0.1)" : "var(--bg-card, #FFFFFF)",
              border: `1px solid ${showChart ? "#D4622B" : "var(--border-subtle, rgba(0,0,0,0.15))"}`,
              color: showChart ? "#D4622B" : "var(--text-primary, #1C1917)",
              fontSize: 11.5,
              fontWeight: 550,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <span>{showChart ? "📋" : "📈"}</span>
            <span>{showChart ? "Table" : "Chart"}</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Chart View or Table Content Scroll Viewport */}
      {showChart ? (
        <div
          style={{
            backgroundColor: "var(--bg-card, #FFFFFF)",
            padding: "16px 18px",
            maxHeight: 440,
            overflowY: "auto"
          }}
        >
          {chartData.items.length > 0 ? (
            <>
              <style>{`
                @keyframes nexusBarGrow {
                  from { transform: scaleX(0); }
                  to { transform: scaleX(1); }
                }
              `}</style>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  fontSize: 11.5,
                  color: "var(--text-muted, #78716C)"
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary, #1C1917)" }}>
                  {chartData.valueHeader}
                  {chartData.labelHeader && chartData.labelHeader !== chartData.valueHeader
                    ? ` by ${chartData.labelHeader}`
                    : ""}
                </span>
                {chartData.isFallback && (
                  <span style={{ fontStyle: "italic" }}>
                    Row distribution (cell length)
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {chartData.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div
                      title={item.label}
                      style={{
                        width: "30%",
                        minWidth: 100,
                        maxWidth: 200,
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "var(--text-primary, #1C1917)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        backgroundColor: "var(--bg-surface, #F5F5F0)",
                        borderRadius: 6,
                        overflow: "hidden",
                        position: "relative"
                      }}
                    >
                      <div
                        style={{
                          width: `${item.percent}%`,
                          minWidth: item.percent > 0 ? 4 : 0,
                          height: "100%",
                          borderRadius: 6,
                          background: "linear-gradient(90deg, #D4622B 0%, #EA7B46 100%)",
                          transformOrigin: "left center",
                          animation: "nexusBarGrow 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                          transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
                        }}
                      />
                    </div>

                    <div
                      style={{
                        minWidth: 64,
                        textAlign: "right",
                        fontSize: 12.5,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-primary, #1C1917)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.displayValue}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--text-muted, #78716C)",
                fontStyle: "italic",
                fontSize: 13
              }}
            >
              No matching rows found for "{searchTerm}"
            </div>
          )}
        </div>
      ) : (
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
                {headers.map((col, cIdx) => {
                  const isSorted = sortConfig.colIndex === cIdx && sortConfig.direction !== null;
                  const isColHovered = hoveredCol === cIdx;
                  const sortIndicator = isSorted
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕";

                  return (
                    <th
                      key={cIdx}
                      onClick={() => handleSortColumn(cIdx)}
                      onMouseEnter={() => setHoveredCol(cIdx)}
                      onMouseLeave={() => setHoveredCol(null)}
                      title="Click to sort column"
                      style={{
                        padding: "9px 14px",
                        fontWeight: 600,
                        color: "var(--text-primary, #1F1F1E)",
                        borderRight: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))",
                        letterSpacing: "0.01em",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        userSelect: "none",
                        backgroundColor: isColHovered
                          ? "rgba(0, 0, 0, 0.03)"
                          : "transparent",
                        transition: "background-color 0.12s ease"
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{renderInline(col)}</span>
                        <span
                          style={{
                            fontSize: 10,
                            lineHeight: 1,
                            color: isSorted ? "#D4622B" : "var(--text-muted, #78716C)",
                            opacity: isSorted ? 1 : isColHovered ? 0.65 : 0,
                            transition: "opacity 0.12s ease"
                          }}
                        >
                          {sortIndicator}
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length > 0 ? (
                sortedRows.map((row, rIdx) => (
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
      )}
    </div>
  );
}
