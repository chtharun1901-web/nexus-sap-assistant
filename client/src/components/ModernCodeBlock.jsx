import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";

/**
 * Parses delimited text (semicolon, comma, or tab) into headers and rows.
 */
function parseDelimitedData(text) {
  if (!text || typeof text !== "string") return null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const firstLine = lines[0];
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = null;
  if (semiCount >= 2 && semiCount >= commaCount && semiCount >= tabCount) delimiter = ";";
  else if (tabCount >= 2 && tabCount >= commaCount) delimiter = "\t";
  else if (commaCount >= 2) delimiter = ",";

  if (!delimiter) return null;

  const headers = firstLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
  if (headers.length < 2) return null;

  const rows = [];
  for (let idx = 1; idx < lines.length; idx++) {
    const rawCells = lines[idx].split(delimiter);
    const cells = headers.map((_, cIdx) => (rawCells[cIdx] !== undefined ? rawCells[cIdx].trim().replace(/^["']|["']$/g, "") : ""));
    rows.push(cells);
  }

  return { headers, rows, delimiter, totalRows: rows.length, totalCols: headers.length };
}

/**
 * ModernCodeBlock
 * 
 * Replaces raw terminal dumps with an executive Claude-style interactive code/data artifact.
 * Features:
 * - Smart CSV / Delimited Auto-Detection: Automatically parses semicolon/comma/tab data into an interactive table!
 * - Toggle: [📊 Table View | 📝 Raw Code]
 * - 1-Click "⬇️ Download .CSV" with UTF-8 BOM
 * - 1-Click "📊 Download .XLSX" (Real Excel workbook generated via SheetJS)
 * - 1-Click "📋 Copy for Excel" (TSV)
 * - Dock into Claude Artifacts Split-Pane Sidecar
 */
export default function ModernCodeBlock({ code = "", language = "text", title = "" }) {
  const [copied, setCopied] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [isWrapped, setIsWrapped] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const cleanLang = (language || "text").trim().toLowerCase();
  
  // Detect if content is structured tabular/delimited data
  const parsedData = useMemo(() => {
    return parseDelimitedData(code);
  }, [code]);

  const isDelimited = !!parsedData || cleanLang === "csv" || cleanLang === "tsv";
  const [viewMode, setViewMode] = useState(isDelimited && parsedData ? "table" : "code");

  // Filter rows for Table View
  const filteredRows = useMemo(() => {
    if (!parsedData) return [];
    if (!searchTerm.trim()) return parsedData.rows;
    const term = searchTerm.toLowerCase();
    return parsedData.rows.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(term))
    );
  }, [parsedData, searchTerm]);

  // Handle Raw Copy
  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code snippet:", err);
    }
  };

  // 1-Click Copy for Excel (TSV)
  const handleCopyForExcel = async (e) => {
    e.stopPropagation();
    if (!parsedData) return handleCopy(e);
    try {
      const tsv = [
        parsedData.headers.join("\t"),
        ...parsedData.rows.map(r => r.join("\t"))
      ].join("\n");
      await navigator.clipboard.writeText(tsv);
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 2000);
    } catch (err) {
      console.warn("Failed to copy TSV:", err);
    }
  };

  // 1-Click Download .CSV (with UTF-8 BOM for clean Excel opening)
  const handleDownloadCSV = (e) => {
    e.stopPropagation();
    try {
      let content = code;
      if (parsedData && parsedData.delimiter !== ",") {
        // Re-export standard comma-separated or keep original
        content = [
          parsedData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
          ...parsedData.rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))
        ].join("\r\n");
      }
      const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = (title || "sanitized_data_template").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      a.download = `${baseName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Download failed:", err);
    }
  };

  // 1-Click Download .XLSX (Native Microsoft Excel Workbook)
  const handleDownloadXLSX = (e) => {
    e.stopPropagation();
    try {
      if (parsedData) {
        const aoa = [parsedData.headers, ...parsedData.rows];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data_Template");
        const baseName = (title || "sanitized_data_template").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        XLSX.writeFile(wb, `${baseName}.xlsx`);
      } else {
        handleDownloadCSV(e);
      }
    } catch (err) {
      console.error("XLSX Download failed:", err);
    }
  };

  const displayLang = cleanLang === "abap" 
    ? "SAP ABAP" 
    : cleanLang === "csv" || (parsedData && parsedData.delimiter === ";")
    ? "CSV (SEMICOLON)"
    : cleanLang === "tsv" || (parsedData && parsedData.delimiter === "\t")
    ? "TSV (TAB)"
    : cleanLang === "sh" || cleanLang === "bash" || cleanLang === "shell" 
    ? "BASH / CLI" 
    : cleanLang.toUpperCase();

  const linesCount = code.split("\n").length;

  return (
    <div
      className="modern-code-card-root"
      style={{
        margin: "14px 0 18px",
        borderRadius: 10,
        overflow: "hidden",
        background: "#18181B",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.14)",
        fontFamily: "var(--font-mono, 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace)"
      }}
    >
      <style>{`
        .modern-code-scroll::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .modern-code-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-code-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 4px;
        }
        .modern-code-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.32);
        }
        .modern-code-action-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #FFFFFF !important;
        }
        .modern-code-table-row:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "#222226",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          userSelect: "none",
          flexWrap: "wrap",
          gap: 8
        }}
      >
        {/* Left Side: macOS Dots + Badge + Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F56", opacity: 0.85 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E", opacity: 0.85 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27C93F", opacity: 0.85 }} />
          </div>

          {/* Language Pill */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: "0.04em",
              color: "#A1A1AA",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            {displayLang}
          </span>

          {/* Telemetry info */}
          {parsedData ? (
            <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600 }}>
              {parsedData.totalRows} rows · {parsedData.totalCols} cols
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#71717A" }}>
              {linesCount} {linesCount === 1 ? "line" : "lines"}
            </span>
          )}

          {/* Table / Code Toggle if delimited data */}
          {parsedData && (
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  background: viewMode === "table" ? "rgba(255,255,255,0.15)" : "transparent",
                  color: viewMode === "table" ? "#FFFFFF" : "#A1A1AA",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                📊 Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                style={{
                  background: viewMode === "code" ? "rgba(255,255,255,0.15)" : "transparent",
                  color: viewMode === "code" ? "#FFFFFF" : "#A1A1AA",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                📝 Raw Text
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Instant 1-Click File Downloads & Sidecar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {/* 1-Click CSV Download */}
          {parsedData && (
            <button
              type="button"
              onClick={handleDownloadCSV}
              title="Download real .csv file directly to your computer"
              className="modern-code-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                borderRadius: 5,
                padding: "3px 8px",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#93C5FD",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit"
              }}
            >
              <span>⬇️</span>
              <span>CSV</span>
            </button>
          )}

          {/* 1-Click XLSX Download */}
          {parsedData && (
            <button
              type="button"
              onClick={handleDownloadXLSX}
              title="Download formatted Excel (.xlsx) file"
              className="modern-code-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: 5,
                padding: "3px 8px",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#6EE7B7",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit"
              }}
            >
              <span>📊</span>
              <span>Excel (.xlsx)</span>
            </button>
          )}

          {/* Copy for Excel (TSV) */}
          {parsedData && (
            <button
              type="button"
              onClick={handleCopyForExcel}
              title="Copy tab-separated values ready to paste directly into Excel"
              className="modern-code-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: copiedExcel ? "rgba(16, 185, 129, 0.2)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 5,
                padding: "3px 8px",
                fontSize: 11.5,
                color: copiedExcel ? "#34D399" : "#E4E4E7",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit"
              }}
            >
              <span>{copiedExcel ? "✓" : "📋"}</span>
              <span>{copiedExcel ? "Copied TSV!" : "Copy for Excel"}</span>
            </button>
          )}

          {/* Open in Claude Artifact Sidecar */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-open-artifact', {
                detail: {
                  title: title || `${displayLang} Data Artifact`,
                  type: "code",
                  content: code,
                  language: cleanLang
                }
              }));
            }}
            title="Dock in Claude Artifact Sidecar"
            className="modern-code-action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 11.5,
              color: "#E4E4E7",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit"
            }}
          >
            <span>⤢</span>
            <span>Sidecar</span>
          </button>

          {/* Wrap / Unwrap (for code mode) */}
          {viewMode === "code" && (
            <button
              type="button"
              onClick={() => setIsWrapped(prev => !prev)}
              title={isWrapped ? "Switch to single-line horizontal scroll" : "Wrap lines to fit window"}
              className="modern-code-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: isWrapped ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 5,
                padding: "3px 8px",
                fontSize: 11.5,
                color: isWrapped ? "#E4E4E7" : "#A1A1AA",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit"
              }}
            >
              <span>{isWrapped ? "↩ Wrapped" : "↔ No Wrap"}</span>
            </button>
          )}

          {/* Raw Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy raw text to clipboard"
            className="modern-code-action-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
              border: `1px solid ${copied ? "#10B981" : "rgba(255, 255, 255, 0.14)"}`,
              borderRadius: 5,
              padding: "3px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              color: copied ? "#34D399" : "#F4F4F5",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit"
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied!" : "Copy Raw"}</span>
          </button>
        </div>
      </div>

      {/* Body: Structured Table View OR Raw Code View */}
      {viewMode === "table" && parsedData ? (
        <div style={{ background: "#18181B", padding: "12px 14px" }}>
          {/* Table Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${parsedData.totalRows} rows...`}
                style={{
                  width: "100%",
                  background: "#222226",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "5px 10px 5px 28px",
                  fontSize: 12,
                  color: "#EDEDED",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              />
              <span style={{ position: "absolute", left: 9, top: 6, fontSize: 11, opacity: 0.5 }}>🔍</span>
            </div>
            {searchTerm && (
              <span style={{ fontSize: 11, color: "#A1A1AA" }}>
                Found {filteredRows.length} matching {filteredRows.length === 1 ? "row" : "rows"}
              </span>
            )}
          </div>

          {/* Interactive Table Container */}
          <div
            className="modern-code-scroll"
            style={{
              overflowX: "auto",
              maxHeight: 460,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12.5,
                textAlign: "left",
                color: "#E4E4E7",
                fontFamily: "inherit"
              }}
            >
              <thead>
                <tr style={{ background: "#222226", borderBottom: "1.5px solid rgba(255,255,255,0.14)" }}>
                  <th style={{ padding: "8px 10px", color: "#71717A", fontSize: 11, fontWeight: 700, width: 40 }}>#</th>
                  {parsedData.headers.map((h, i) => (
                    <th
                      key={`th-${i}`}
                      style={{
                        padding: "8px 12px",
                        color: "#F4F4F5",
                        fontWeight: 700,
                        fontSize: 11.5,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid rgba(255,255,255,0.06)"
                      }}
                    >
                      {h || `COL_${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={parsedData.headers.length + 1} style={{ textAlign: "center", padding: 24, color: "#71717A" }}>
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      className="modern-code-table-row"
                      style={{
                        background: rIdx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <td style={{ padding: "7px 10px", color: "#71717A", fontSize: 11, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={`td-${rIdx}-${cIdx}`}
                          style={{
                            padding: "7px 12px",
                            whiteSpace: "nowrap",
                            borderRight: "1px solid rgba(255,255,255,0.05)",
                            color: cell ? "#EDEDED" : "rgba(255,255,255,0.25)"
                          }}
                        >
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <pre
          className="modern-code-scroll"
          style={{
            margin: 0,
            padding: "14px 18px",
            overflowX: isWrapped ? "visible" : "auto",
            whiteSpace: isWrapped ? "pre-wrap" : "pre",
            wordBreak: isWrapped ? "break-word" : "normal",
            fontSize: 13,
            lineHeight: 1.62,
            color: "#EDEDED",
            fontFamily: "inherit"
          }}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
