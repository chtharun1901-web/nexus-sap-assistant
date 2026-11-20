/**
 * tableClipboardUtils.js
 * 
 * Production-grade clipboard and export utilities for table data:
 * - Strips raw markdown syntax (bold **, italic *, inline code `, strikethrough ~~, html tags)
 * - Multi-MIME clipboard writing: produces native HTML tables for Excel, Google Sheets, Word, and clean TSV for plain text
 * - RFC 4180 CSV export with UTF-8 BOM (\uFEFF) for native Excel opening without encoding glitches
 * - GitHub-flavored markdown export for developers / documentation
 */

/**
 * Strips markdown symbols from a cell string to produce clean, professional plain text.
 */
export function stripMarkdown(text) {
  if (text === null || text === undefined) return "";
  let s = String(text);

  // 1. Remove markdown bold/italic combinations (***text*** or ___text___)
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, "$1");
  s = s.replace(/___(.*?)___/g, "$1");

  // 2. Remove bold (**text** or __text__)
  s = s.replace(/\*\*(.*?)\*\*/g, "$1");
  s = s.replace(/__(.*?)__/g, "$1");

  // 3. Remove italic (*text* or _text_)
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");

  // 4. Remove inline code (`code` or ``code``)
  s = s.replace(/`+([^`]+)`+/g, "$1");

  // 5. Remove strikethrough (~~text~~)
  s = s.replace(/~~(.*?)~~/g, "$1");

  // 6. Remove markdown links: [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 7. Remove raw HTML tags: <span ...>, <code>, </span>, etc.
  s = s.replace(/<[^>]+>/g, " ");

  // 8. Decode standard HTML entities
  s = s.replace(/&nbsp;/g, " ")
       .replace(/&amp;/g, "&")
       .replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");

  // 9. Normalize tabs and newlines inside cell so they don't corrupt TSV/CSV row-column structure
  s = s.replace(/[\r\n\t]+/g, " ").trim();

  // 10. Strip outer pipes if accidentally captured
  s = s.replace(/^\||\|$/g, "").trim();

  return s;
}

/**
 * Converts markdown cell text into clean, safe HTML for rich paste targets (Excel, Sheets, Word).
 */
export function formatCellForHtml(text) {
  if (text === null || text === undefined) return "";
  let s = String(text);

  // Basic HTML escape first to avoid injection
  s = s.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#39;");

  // Convert bold
  s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Convert italic
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Convert inline code with subtle pill styling
  s = s.replace(/`+([^`]+)`+/g, '<code style="font-family:Consolas,monospace;font-size:9.5pt;background:#F1F5F9;color:#0F172A;padding:1px 4px;border-radius:3px;">$1</code>');

  // Convert strikethrough
  s = s.replace(/~~(.*?)~~/g, "<del>$1</del>");

  // Convert links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563EB;text-decoration:underline;">$1</a>');

  // Convert newlines to breaks
  s = s.replace(/\r?\n/g, "<br/>");

  return s;
}

/**
 * Builds clean TSV (Tab-Separated Values) string.
 * Strips all markdown so it pastes cleanly into plain text editors or spreadsheet cells.
 */
export function buildTableTSV(headers = [], rows = []) {
  const cleanHeaders = headers.map(stripMarkdown);
  const cleanRows = rows.map((r) => r.map(stripMarkdown));
  return [cleanHeaders.join("\t"), ...cleanRows.map((r) => r.join("\t"))].join("\n");
}

/**
 * Builds an RFC/Excel-compatible HTML table string with inline styles.
 * When placed on the clipboard as 'text/html', Microsoft Excel, Google Sheets,
 * and Word automatically paste it as a native, formatted table.
 */
export function buildTableHtml(headers = [], rows = []) {
  const htmlHeaders = headers.map(formatCellForHtml);
  const htmlRows = rows.map((r) => r.map(formatCellForHtml));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  table { border-collapse: collapse; width: 100%; font-family: Calibri, Aptos, -apple-system, sans-serif; font-size: 11pt; color: #1F2937; }
  th { background-color: #F1F5F9; color: #0F172A; font-weight: bold; border: 1px solid #CBD5E1; padding: 7px 12px; text-align: left; }
  td { border: 1px solid #E2E8F0; padding: 7px 12px; vertical-align: top; }
  tr:nth-child(even) td { background-color: #F8FAFC; }
</style>
</head>
<body>
<!--StartFragment-->
<table>
  <thead>
    <tr>
      ${htmlHeaders.map((h) => `<th>${h}</th>`).join("")}
    </tr>
  </thead>
  <tbody>
    ${htmlRows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
  </tbody>
</table>
<!--EndFragment-->
</body>
</html>`;
}

/**
 * Builds a clean GitHub Flavored Markdown (GFM) table.
 */
export function buildTableMarkdown(headers = [], rows = []) {
  const cleanHeaders = headers.map(stripMarkdown);
  const cleanRows = rows.map((r) => r.map(stripMarkdown));

  const separator = cleanHeaders.map(() => "---");
  const lines = [
    `| ${cleanHeaders.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...cleanRows.map((r) => `| ${r.join(" | ")} |`)
  ];
  return lines.join("\n");
}

/**
 * Copies table data to clipboard using multi-MIME payload (text/html + text/plain).
 * - Excel / Sheets / Word read 'text/html' -> pastes as formatted native grid
 * - Plaintext apps read 'text/plain' -> pastes clean TSV without raw markdown symbols
 * 
 * @param {Array<string>} headers
 * @param {Array<Array<string>>} rows
 * @param {Object} options - { asMarkdown?: boolean, asTSVOnly?: boolean }
 * @returns {Promise<boolean>}
 */
export async function copyTableToClipboard(headers = [], rows = [], options = {}) {
  const { asMarkdown = false, asTSVOnly = false } = options;

  if (asMarkdown) {
    const md = buildTableMarkdown(headers, rows);
    return writeToClipboardFallback(md);
  }

  const tsv = buildTableTSV(headers, rows);
  const html = buildTableHtml(headers, rows);

  if (!asTSVOnly && typeof ClipboardItem !== "undefined" && navigator?.clipboard?.write) {
    try {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([tsv], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob
        })
      ]);
      return true;
    } catch (err) {
      console.warn("Multi-mime table clipboard write failed, falling back to writeText:", err);
    }
  }

  return writeToClipboardFallback(tsv);
}

/**
 * Robust fallback for copying plain text
 */
async function writeToClipboardFallback(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (err) {
    console.error("Clipboard copy failed completely:", err);
    return false;
  }
}

/**
 * Exports table as a clean, standardized .csv file with UTF-8 BOM.
 */
export function exportTableCSV(headers = [], rows = [], filename = "table.csv") {
  const escapeCsv = (val) => {
    const clean = stripMarkdown(val);
    const s = String(clean || "").replace(/"/g, '""');
    return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(","))
  ].join("\r\n");

  // Prepend UTF-8 BOM (\uFEFF) so Excel natively recognizes UTF-8 characters (arrows, degree signs, etc.)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
