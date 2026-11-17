import React, { useState, useMemo } from "react";

/**
 * ModernTableCard
 * 
 * Claude-style interactive table card with:
 * - Floating action bar on hover
 * - 1-Click Copy Table (TSV formatted for Excel / Sheets)
 * - 1-Click Export CSV
 * - In-table search & filter for large datasets (BOMs, queues, storage bins)
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
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  // Copy as TSV (Tab Separated Values) for native Excel/Sheets pasting
  const handleCopyTSV = (e) => {
    e.stopPropagation();
    const tsv = [
      headers.join("\t"),
      ...rows.map((r) => r.join("\t"))
    ].join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(tsv).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Export as .csv file
  const handleExportCSV = (e) => {
    e.stopPropagation();
    const escapeCsv = (val) => {
      const s = String(val || "").replace(/"/g, '""');
      return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
    };

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-table-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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

          {/* Copy for Excel / TSV */}
          <button
            type="button"
            onClick={handleCopyTSV}
            title="Copy table to clipboard formatted for Excel or Google Sheets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: copied ? "rgba(16, 185, 129, 0.1)" : "var(--bg-card, #FFFFFF)",
              border: `1px solid ${copied ? "#10B981" : "var(--border-subtle, rgba(0,0,0,0.15))"}`,
              color: copied ? "#059669" : "var(--text-primary, #1C1917)",
              fontSize: 11.5,
              fontWeight: 550,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied" : "Copy for Excel"}</span>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download table as .csv file"
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
