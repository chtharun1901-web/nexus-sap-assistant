/**
 * Nexus Data Visualizations - Export Utilities
 * Exports diagrams as editable SVGs, high-res PNGs, and JSON templates.
 */

/**
 * Downloads the SVG element as an editable .svg file.
 */
export function downloadSvg(svgElement, filename = "nexus_visualization.svg") {
  if (!svgElement) return;

  const clone = svgElement.cloneNode(true);

  // Ensure xmlns and standalone properties
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the SVG rendered as a high-resolution PNG (2x scale for sharp slides).
 */
export function downloadPng(svgElement, filename = "nexus_visualization.png", scale = 2) {
  if (!svgElement) return;

  const bbox = svgElement.getBoundingClientRect();
  const width = (bbox.width || 1200) * scale;
  const height = (bbox.height || 800) * scale;

  const clone = svgElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clone);

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Optional background fill
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  img.src = url;
}

/**
 * Copies the SVG markup to the system clipboard for immediate pasting into Figma/Illustrator.
 */
export async function copySvgToClipboard(svgElement) {
  if (!svgElement) return false;
  const clone = svgElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clone);

  try {
    await navigator.clipboard.writeText(svgData);
    return true;
  } catch (err) {
    console.error("Failed to copy SVG to clipboard:", err);
    return false;
  }
}

/**
 * Exports the raw JSON diagram spec.
 */
export function downloadJson(dataModel, filename = "nexus_diagram.json") {
  const jsonStr = JSON.stringify(dataModel, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
