/**
 * Multi-Format File Parser for Intelligent Visual Strategy Engine
 * Supports:
 * 1. Plain text & Markdown
 * 2. Screenshots & Images (PNG, JPG, WebP)
 * 3. PowerPoint (.pptx) - via jszip parsing of slide XML
 * 4. Excel (.xlsx, .xls, .csv) - via xlsx parsing of sheets, rows & tables
 * 5. Word / Documents (.docx, .txt) - via jszip text extraction
 */

import * as XLSX from "xlsx";
import JSZip from "jszip";

/**
 * Reads a File object and extracts structured text, metadata, and image payloads.
 */
export async function parseUploadedFile(file) {
  if (!file) return null;

  const fileName = file.name || "uploaded_file";
  const fileType = file.type || "";
  const extension = fileName.split(".").pop().toLowerCase();

  // 1. Image Files (Screenshots, Diagrams, Scans)
  if (fileType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "bmp"].includes(extension)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(",")[1];
        resolve({
          fileName,
          fileType: "image",
          extension,
          mimeType: fileType || `image/${extension}`,
          dataUrl,
          base64Data,
          textContent: `[Uploaded Image/Screenshot: ${fileName}]`,
          previewSnippet: `Screenshot: ${fileName} (${Math.round(file.size / 1024)} KB)`
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // 2. PowerPoint Files (.pptx)
  if (extension === "pptx" || fileType.includes("presentation") || fileType.includes("powerpoint")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let extractedSlideText = [];
      let slideCount = 0;

      // Scan slide XMLs
      const slideFiles = Object.keys(zip.files).filter((path) =>
        path.startsWith("ppt/slides/slide") && path.endsWith(".xml")
      );

      for (const slidePath of slideFiles) {
        slideCount++;
        const xmlText = await zip.files[slidePath].async("text");
        // Extract text elements from <a:t> tags
        const matches = xmlText.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const slideLines = matches
          .map((m) => m.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean);

        if (slideLines.length > 0) {
          extractedSlideText.push(`--- Slide ${slideCount} ---\n` + slideLines.join("\n"));
        }
      }

      const fullText = extractedSlideText.join("\n\n");
      return {
        fileName,
        fileType: "powerpoint",
        extension: "pptx",
        slideCount,
        textContent: fullText || `[PowerPoint: ${fileName} - ${slideCount} slides detected]`,
        previewSnippet: `PowerPoint: ${fileName} (${slideCount} slide${slideCount !== 1 ? "s" : ""}, ${fullText.length} chars extracted)`
      };
    } catch (err) {
      console.warn("Failed to parse PPTX via zip:", err);
      return {
        fileName,
        fileType: "powerpoint",
        extension: "pptx",
        textContent: `[PowerPoint file: ${fileName} - raw binary attached]`,
        previewSnippet: `PowerPoint: ${fileName} (${Math.round(file.size / 1024)} KB)`
      };
    }
  }

  // 3. Excel Files (.xlsx, .xls, .csv)
  if (["xlsx", "xls", "csv"].includes(extension) || fileType.includes("spreadsheet") || fileType.includes("excel")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetTexts = [];
      let totalRows = 0;

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv && csv.trim()) {
          const rowCount = csv.split("\n").length;
          totalRows += rowCount;
          sheetTexts.push(`### Sheet: ${sheetName}\n` + csv);
        }
      });

      const fullText = sheetTexts.join("\n\n");
      return {
        fileName,
        fileType: "excel",
        extension,
        sheetCount: workbook.SheetNames.length,
        totalRows,
        textContent: fullText,
        previewSnippet: `Spreadsheet: ${fileName} (${workbook.SheetNames.length} sheet(s), ~${totalRows} rows)`
      };
    } catch (err) {
      console.warn("Failed to parse spreadsheet:", err);
      return {
        fileName,
        fileType: "excel",
        extension,
        textContent: `[Spreadsheet: ${fileName}]`,
        previewSnippet: `Excel: ${fileName} (${Math.round(file.size / 1024)} KB)`
      };
    }
  }

  // 4. Word Documents (.docx)
  if (extension === "docx") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      if (zip.files["word/document.xml"]) {
        const docXml = await zip.files["word/document.xml"].async("text");
        const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/gi) || [];
        const lines = matches.map((m) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
        const fullText = lines.join(" ");
        return {
          fileName,
          fileType: "word",
          extension: "docx",
          textContent: fullText,
          previewSnippet: `Word Document: ${fileName} (~${lines.length} paragraphs)`
        };
      }
    } catch (err) {
      console.warn("Failed to parse docx via zip:", err);
    }
  }

  // 5. Plain text, Markdown, JSON, etc.
  try {
    const text = await file.text();
    return {
      fileName,
      fileType: "text",
      extension,
      textContent: text,
      previewSnippet: `Text/Document: ${fileName} (${text.length} chars)`
    };
  } catch (err) {
    return {
      fileName,
      fileType: "generic",
      extension,
      textContent: `[Uploaded File: ${fileName}]`,
      previewSnippet: `File: ${fileName} (${Math.round(file.size / 1024)} KB)`
    };
  }
}
