/**
 * exportPptx.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Knowledge-Preserving SAP PowerPoint Presentation (.pptx) Exporter
 * 
 * Transforms the structured 8-part Nexus SAP answer into a 12-slide,
 * 100% native PowerPoint presentation using pptxgenjs and the Aptos font.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { parseNexusSapAnswer } from "../services/sapAnswerPptxParser.js";
import { generateSapKnowledgeDeck } from "../services/sapKnowledgeDeckGenerator.js";

/**
 * Generate an executive SAP PowerPoint Presentation (.pptx)
 * @param {Object} doc - Active case or preset topic object
 * @param {string} aiText - Markdown/text response from Nexus
 * @param {Array} citations - Grounded SAP sources / notes
 */
export async function exportSapPresentationPptx(doc, aiText, citations = []) {
  // 1. Parse structured Nexus SAP answer into internal knowledge model
  const parsedModel = parseNexusSapAnswer(doc, aiText, citations);

  // 2. Generate 12-slide native PowerPoint presentation
  const result = await generateSapKnowledgeDeck(parsedModel);

  return {
    ...result,
    parsedModel
  };
}

export { parseNexusSapAnswer, generateSapKnowledgeDeck };
