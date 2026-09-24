import PptxGenJS from "pptxgenjs";

/**
 * Generate a Complete Session PowerPoint Presentation (.pptx)
 * 
 * @param {Object} deckGraph - Structured output from sessionDeckAnalyzer
 * @param {Object} options - { theme: "executive" | "midnight" | "slate", selectedSlideIds: string[], includeNotes: boolean }
 */
export async function exportSessionPresentationPptx(deckGraph, options = {}) {
  const {
    theme = "executive",
    selectedSlideIds = null,
    includeNotes = true
  } = options;

  const pptx = new PptxGenJS();

  // Configure Global Deck Properties
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Nexus SAP Enterprise Copilot";
  pptx.company = "Nexus SAP Enterprise Intelligence";
  pptx.title = deckGraph.sessionTitle || "SAP End-to-End Learning Summary";

  // Define Theme Color Palettes
  const THEMES = {
    executive: {
      bgMain: "0A1128",
      bgSlide: "0F172A",
      bgCard: "1E293B",
      bgCardAccent: "162032",
      headerBar: "0A1128",
      textPrimary: "FFFFFF",
      textSecondary: "94A3B8",
      textBody: "E2E8F0",
      accentOrange: "F59E0B",
      accentBurgundy: "991B1B",
      accentBlue: "3B82F6",
      accentTeal: "0D9488",
      accentPurple: "8B5CF6",
      accentGreen: "10B981",
      borderSubtle: "334155",
      borderStrong: "475569"
    },
    midnight: {
      bgMain: "060D1E",
      bgSlide: "0B132B",
      bgCard: "1C2541",
      bgCardAccent: "172038",
      headerBar: "060D1E",
      textPrimary: "FFFFFF",
      textSecondary: "8D99AE",
      textBody: "E0E1DD",
      accentOrange: "FB923C",
      accentBurgundy: "6E1A2D",
      accentBlue: "60A5FA",
      accentTeal: "14B8A6",
      accentPurple: "A78BFA",
      accentGreen: "34D399",
      borderSubtle: "2B3A5A",
      borderStrong: "3E517A"
    },
    slate: {
      bgMain: "F1F5F9",
      bgSlide: "F8FAFC",
      bgCard: "FFFFFF",
      bgCardAccent: "F1F5F9",
      headerBar: "0F172A",
      textPrimary: "0F172A",
      textSecondary: "64748B",
      textBody: "334155",
      accentOrange: "D97706",
      accentBurgundy: "6E1A2D",
      accentBlue: "1D4ED8",
      accentTeal: "0F766E",
      accentPurple: "6D28D9",
      accentGreen: "047857",
      borderSubtle: "CBD5E1",
      borderStrong: "94A3B8"
    }
  };

  const colors = THEMES[theme] || THEMES.executive;
  const isLight = theme === "slate";

  // Common Header Generator
  const addSlideHeader = (slide, slideTitle, categoryTag = "SAP END-TO-END INTELLIGENCE") => {
    // Header Bar Shape
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.9,
      fill: { color: colors.headerBar }
    });

    // Category Tag
    slide.addText(categoryTag.toUpperCase(), {
      x: 0.8,
      y: 0.15,
      w: 8,
      h: 0.25,
      fontSize: 9,
      fontFace: "Arial",
      color: colors.accentOrange,
      bold: true,
      charSpacing: 1.5
    });

    // Slide Title
    slide.addText(slideTitle, {
      x: 0.8,
      y: 0.4,
      w: 9.5,
      h: 0.42,
      fontSize: 16,
      fontFace: "Arial",
      color: "FFFFFF",
      bold: true
    });

    // Case ID / Module Badge (Top Right)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.5,
      y: 0.25,
      w: 2.1,
      h: 0.4,
      rectRadius: 0.08,
      fill: { color: isLight ? "1E293B" : colors.bgCard },
      line: { color: colors.accentBlue, width: 1 }
    });
    slide.addText(deckGraph.crossModuleLabel || deckGraph.caseId || "SAP NEXUS", {
      x: 10.5,
      y: 0.25,
      w: 2.1,
      h: 0.4,
      align: "center",
      valign: "middle",
      fontSize: 10,
      fontFace: "Courier New",
      color: "93C5FD",
      bold: true
    });

    // Slide Bottom Footer
    slide.addText(`Nexus SAP Copilot · Complete Session Deck · ${new Date().toLocaleDateString()} · Confidential`, {
      x: 0.8,
      y: 7.1,
      w: 8.5,
      h: 0.3,
      fontSize: 8.5,
      fontFace: "Arial",
      color: colors.textSecondary
    });
  };

  // Filter slides if user selected specific slides
  const slidesToRender = selectedSlideIds
    ? deckGraph.slides.filter(s => selectedSlideIds.includes(s.id))
    : deckGraph.slides;

  // Render each slide
  slidesToRender.forEach(slideData => {
    const slide = pptx.addSlide();
    slide.background = { color: colors.bgSlide };

    if (includeNotes && slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }

    switch (slideData.type) {
      case "TITLE": {
        // Full Dark Background Cover
        slide.background = { color: colors.bgMain };

        // Left Colored Brand Accent Stripe
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.2,
          w: 0.15,
          h: 4.8,
          fill: { color: colors.accentOrange }
        });

        // Subtitle / Scope Pill
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.2,
          y: 1.2,
          w: 3.6,
          h: 0.35,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.accentOrange, width: 1 }
        });
        slide.addText("NEXUS SAP ENTERPRISE COPILOT", {
          x: 1.2,
          y: 1.2,
          w: 3.6,
          h: 0.35,
          align: "center",
          valign: "middle",
          fontSize: 9.5,
          fontFace: "Arial",
          color: colors.accentOrange,
          bold: true,
          charSpacing: 1.5
        });

        // Presentation Main Title
        slide.addText(slideData.data.title || deckGraph.sessionTitle, {
          x: 1.2,
          y: 1.75,
          w: 10.5,
          h: 1.3,
          fontSize: 26,
          fontFace: "Arial",
          color: "FFFFFF",
          bold: true,
          lineSpacingMultiple: 1.1
        });

        // Subtitle
        slide.addText(slideData.data.subtitle || "SAP End-to-End Learning Summary", {
          x: 1.2,
          y: 3.1,
          w: 10.5,
          h: 0.4,
          fontSize: 14,
          fontFace: "Arial",
          color: colors.textSecondary
        });

        // Metadata Cards Grid
        const metaY = 3.9;
        const metaCards = [
          { label: "TARGET LANDSCAPE", value: slideData.data.landscape, color: colors.accentBlue },
          { label: "DETECTED MODULES", value: (slideData.data.detectedModules || []).slice(0, 3).join(", ") || deckGraph.crossModuleLabel, color: colors.accentTeal },
          { label: "GENERATED DATE", value: slideData.data.date, color: colors.accentOrange }
        ];

        metaCards.forEach((card, idx) => {
          const cardX = 1.2 + idx * 3.6;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: metaY,
            w: 3.4,
            h: 1.2,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          slide.addText(card.label, {
            x: cardX + 0.2,
            y: metaY + 0.15,
            w: 3.0,
            h: 0.25,
            fontSize: 8.5,
            fontFace: "Arial",
            color: card.color,
            bold: true,
            charSpacing: 1
          });

          slide.addText(card.value, {
            x: cardX + 0.2,
            y: metaY + 0.45,
            w: 3.0,
            h: 0.6,
            fontSize: 11,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });
        });

        // Footnote
        slide.addText(slideData.data.footnote || "Generated from complete session analysis", {
          x: 1.2,
          y: 6.5,
          w: 10.5,
          h: 0.3,
          fontSize: 9.5,
          fontFace: "Arial",
          color: colors.textSecondary
        });
        break;
      }

      case "EXECUTIVE_SUMMARY": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // Top Context Banner
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.15,
          w: 11.7,
          h: 1.15,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.borderSubtle, width: 1 }
        });
        slide.addText("OBJECTIVE & PROCESS SCOPE", {
          x: 1.1,
          y: 1.25,
          w: 11.0,
          h: 0.25,
          fontSize: 8.5,
          fontFace: "Arial",
          color: colors.accentOrange,
          bold: true
        });
        slide.addText(`${slideData.data.sessionScope} Primary Flow: ${slideData.data.primaryProcess}`, {
          x: 1.1,
          y: 1.5,
          w: 11.0,
          h: 0.65,
          fontSize: 11.5,
          fontFace: "Arial",
          color: colors.textPrimary,
          lineSpacingMultiple: 1.15
        });

        // 4 Key Takeaways Cards (2x2 Grid)
        const takeaways = slideData.data.takeaways || [];
        takeaways.slice(0, 4).forEach((item, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          const cardX = 0.8 + col * 5.95;
          const cardY = 2.45 + row * 1.55;

          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: 5.75,
            h: 1.4,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          slide.addShape(pptx.ShapeType.oval, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 0.35,
            h: 0.35,
            fill: { color: colors.accentBlue }
          });
          slide.addText(`${idx + 1}`, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 0.35,
            h: 0.35,
            align: "center",
            valign: "middle",
            fontSize: 10,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          slide.addText(item, {
            x: cardX + 0.7,
            y: cardY + 0.15,
            w: 4.85,
            h: 1.1,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary,
            lineSpacingMultiple: 1.15
          });
        });

        // Correction Callout if Present
        if (slideData.data.correctionCallout) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 5.7,
            w: 11.7,
            h: 0.9,
            rectRadius: 0.08,
            fill: { color: isLight ? "FEF3C7" : "2A1B0E" },
            line: { color: colors.accentOrange, width: 1 }
          });
          slide.addText(`⚠️ CLARIFICATION / CORRECTED GUIDANCE: ${slideData.data.correctionCallout}`, {
            x: 1.1,
            y: 5.8,
            w: 11.1,
            h: 0.7,
            fontSize: 10,
            fontFace: "Arial",
            color: isLight ? "92400E" : "FDE68A",
            bold: true
          });
        }
        break;
      }

      case "LANDSCAPE_ARCHITECTURE": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        const nodes = slideData.data.nodes || [];
        nodes.forEach((node, idx) => {
          const cardX = 0.8 + idx * 2.95;
          const cardY = 1.3;

          // Architecture Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: 2.8,
            h: 2.8,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          // Top Badge
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 2.4,
            h: 0.35,
            rectRadius: 0.06,
            fill: { color: node.color.replace("#", "") }
          });
          slide.addText(`TIER ${idx + 1}`, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 2.4,
            h: 0.35,
            align: "center",
            valign: "middle",
            fontSize: 9,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          // Node Name
          slide.addText(node.name, {
            x: cardX + 0.2,
            y: cardY + 0.7,
            w: 2.4,
            h: 0.7,
            fontSize: 12,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true,
            align: "center"
          });

          // Node Subtext
          slide.addText(node.sub, {
            x: cardX + 0.2,
            y: cardY + 1.45,
            w: 2.4,
            h: 1.1,
            fontSize: 10,
            fontFace: "Arial",
            color: colors.textSecondary,
            align: "center"
          });

          // Connector Arrow between nodes
          if (idx < nodes.length - 1) {
            slide.addShape(pptx.ShapeType.rightArrow, {
              x: cardX + 2.75,
              y: cardY + 1.25,
              w: 0.2,
              h: 0.3,
              fill: { color: colors.accentOrange },
              line: { color: colors.accentOrange }
            });
          }
        });

        // Bottom Integration & Decision Box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 4.4,
          w: 11.7,
          h: 2.2,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.borderSubtle, width: 1 }
        });

        slide.addText("END-TO-END DATA ORCHESTRATION & GATEWAY DECISION", {
          x: 1.1,
          y: 4.6,
          w: 11.1,
          h: 0.3,
          fontSize: 9.5,
          fontFace: "Arial",
          color: colors.accentTeal,
          bold: true
        });

        slide.addText(`Flow: ${slideData.data.integrationFlow}`, {
          x: 1.1,
          y: 4.95,
          w: 11.1,
          h: 0.6,
          fontSize: 11,
          fontFace: "Arial",
          color: colors.textPrimary
        });

        slide.addText(`Decision Protocol: ${slideData.data.decisionPoint}`, {
          x: 1.1,
          y: 5.65,
          w: 11.1,
          h: 0.7,
          fontSize: 10.5,
          fontFace: "Arial",
          color: colors.accentOrange
        });
        break;
      }

      case "MODULE_MAP": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        const moduleCards = slideData.data.moduleCards || [];
        moduleCards.slice(0, 4).forEach((mod, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          const cardX = 0.8 + col * 5.95;
          const cardY = 1.3 + row * 2.65;

          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: 5.75,
            h: 2.45,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          // Module Color Header
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 1.2,
            h: 0.35,
            rectRadius: 0.06,
            fill: { color: (mod.color || "#3B82F6").replace("#", "") }
          });
          slide.addText(mod.code, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 1.2,
            h: 0.35,
            align: "center",
            valign: "middle",
            fontSize: 10,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          slide.addText(mod.name, {
            x: cardX + 1.55,
            y: cardY + 0.2,
            w: 4.0,
            h: 0.35,
            fontSize: 12,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true
          });

          // Responsibility
          slide.addText("Core Function:", {
            x: cardX + 0.2,
            y: cardY + 0.7,
            w: 5.35,
            h: 0.22,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.accentOrange,
            bold: true
          });
          slide.addText(mod.responsibility, {
            x: cardX + 0.2,
            y: cardY + 0.95,
            w: 5.35,
            h: 0.45,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary
          });

          // T-Codes & Dependencies
          slide.addText(`Signature T-Codes: ${mod.keyTcodes}`, {
            x: cardX + 0.2,
            y: cardY + 1.5,
            w: 5.35,
            h: 0.35,
            fontSize: 10,
            fontFace: "Courier New",
            color: colors.accentBlue,
            bold: true
          });
          slide.addText(`Dependency: ${mod.dependency}`, {
            x: cardX + 0.2,
            y: cardY + 1.9,
            w: 5.35,
            h: 0.35,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.textSecondary
          });
        });
        break;
      }

      case "E2E_PROCESS": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        const steps = slideData.data.steps || [];
        const stepWidth = Math.min(2.7, (11.7 / Math.max(steps.length, 1)) - 0.2);

        steps.slice(0, 5).forEach((st, idx) => {
          const cardX = 0.8 + idx * (stepWidth + 0.25);
          const cardY = 1.3;

          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: stepWidth,
            h: 4.8,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          // Step Circle
          slide.addShape(pptx.ShapeType.oval, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 0.4,
            h: 0.4,
            fill: { color: colors.accentOrange }
          });
          slide.addText(`${st.stepNumber}`, {
            x: cardX + 0.2,
            y: cardY + 0.2,
            w: 0.4,
            h: 0.4,
            align: "center",
            valign: "middle",
            fontSize: 11,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          // Owner Badge
          slide.addText(st.owner, {
            x: cardX + 0.7,
            y: cardY + 0.25,
            w: stepWidth - 0.8,
            h: 0.3,
            fontSize: 9.5,
            fontFace: "Courier New",
            color: colors.accentBlue,
            bold: true
          });

          // Step Name
          slide.addText(st.stepName, {
            x: cardX + 0.2,
            y: cardY + 0.8,
            w: stepWidth - 0.4,
            h: 0.8,
            fontSize: 11,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true
          });

          // Input / Output Details
          slide.addText("INPUT TRIGGER:", {
            x: cardX + 0.2,
            y: cardY + 1.8,
            w: stepWidth - 0.4,
            h: 0.22,
            fontSize: 8,
            fontFace: "Arial",
            color: colors.accentOrange,
            bold: true
          });
          slide.addText(st.input, {
            x: cardX + 0.2,
            y: cardY + 2.05,
            w: stepWidth - 0.4,
            h: 0.8,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.textSecondary
          });

          slide.addText("EXPECTED OUTPUT:", {
            x: cardX + 0.2,
            y: cardY + 3.0,
            w: stepWidth - 0.4,
            h: 0.22,
            fontSize: 8,
            fontFace: "Arial",
            color: colors.accentTeal,
            bold: true
          });
          slide.addText(st.output, {
            x: cardX + 0.2,
            y: cardY + 3.25,
            w: stepWidth - 0.4,
            h: 1.1,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.textPrimary
          });

          if (idx < steps.length - 1 && idx < 4) {
            slide.addShape(pptx.ShapeType.rightArrow, {
              x: cardX + stepWidth + 0.05,
              y: cardY + 2.2,
              w: 0.15,
              h: 0.3,
              fill: { color: colors.accentOrange },
              line: { color: colors.accentOrange }
            });
          }
        });
        break;
      }

      case "MASTER_DATA_CONFIG": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // Left Column: Master Data Architecture
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.2,
          w: 5.75,
          h: 4.8,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.borderSubtle, width: 1 }
        });
        slide.addText("1. MASTER DATA OBJECTS & CONTROL ENTITIES", {
          x: 1.1,
          y: 1.4,
          w: 5.15,
          h: 0.3,
          fontSize: 10,
          fontFace: "Arial",
          color: colors.accentBlue,
          bold: true
        });

        (slideData.data.masterDataItems || []).forEach((m, idx) => {
          const itemY = 1.85 + idx * 1.15;
          slide.addText(`• ${m.entity}`, {
            x: 1.1,
            y: itemY,
            w: 5.15,
            h: 0.3,
            fontSize: 11,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true
          });
          slide.addText(m.desc, {
            x: 1.3,
            y: itemY + 0.28,
            w: 4.95,
            h: 0.7,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.textSecondary
          });
        });

        // Right Column: SPRO Configuration & Customizing Paths
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 6.75,
          y: 1.2,
          w: 5.75,
          h: 4.8,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.borderSubtle, width: 1 }
        });
        slide.addText("2. SPRO CUSTOMIZING & LOGIC PATHS", {
          x: 7.05,
          y: 1.4,
          w: 5.15,
          h: 0.3,
          fontSize: 10,
          fontFace: "Arial",
          color: colors.accentTeal,
          bold: true
        });

        (slideData.data.configPaths || []).forEach((c, idx) => {
          const itemY = 1.85 + idx * 1.15;
          slide.addText(`• ${c.area}`, {
            x: 7.05,
            y: itemY,
            w: 5.15,
            h: 0.3,
            fontSize: 11,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true
          });
          slide.addText(c.path, {
            x: 7.25,
            y: itemY + 0.28,
            w: 4.95,
            h: 0.7,
            fontSize: 9.5,
            fontFace: "Courier New",
            color: colors.accentOrange
          });
        });

        // Safeguard Alert at Bottom of Config
        slide.addText(`⚠ ${slideData.data.safeguardNote}`, {
          x: 7.05,
          y: 5.4,
          w: 5.15,
          h: 0.4,
          fontSize: 8.5,
          fontFace: "Arial",
          color: colors.accentOrange,
          bold: true
        });
        break;
      }

      case "TRANSACTION_GUIDE": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // Render Native Table
        const rows = slideData.data.tableRows || [];
        const tableData = [
          [
            { text: "STEP", options: { bold: true, color: "FFFFFF", fill: colors.headerBar, fontSize: 9.5 } },
            { text: "T-CODE", options: { bold: true, color: "FFFFFF", fill: colors.headerBar, fontSize: 9.5 } },
            { text: "MODULE", options: { bold: true, color: "FFFFFF", fill: colors.headerBar, fontSize: 9.5 } },
            { text: "OPERATIONAL PURPOSE", options: { bold: true, color: "FFFFFF", fill: colors.headerBar, fontSize: 9.5 } },
            { text: "EXPECTED SYSTEM RESULT", options: { bold: true, color: "FFFFFF", fill: colors.headerBar, fontSize: 9.5 } }
          ],
          ...rows.map((r, idx) => [
            { text: r.step, options: { fontSize: 9, bold: true, color: colors.accentOrange, fill: idx % 2 === 0 ? colors.bgCard : colors.bgCardAccent } },
            { text: r.tcode, options: { fontSize: 9.5, bold: true, color: colors.accentBlue, fontFace: "Courier New", fill: idx % 2 === 0 ? colors.bgCard : colors.bgCardAccent } },
            { text: r.module, options: { fontSize: 9, bold: true, color: colors.textPrimary, fill: idx % 2 === 0 ? colors.bgCard : colors.bgCardAccent } },
            { text: r.action, options: { fontSize: 9, color: colors.textPrimary, fill: idx % 2 === 0 ? colors.bgCard : colors.bgCardAccent } },
            { text: r.expectedResult, options: { fontSize: 9, color: colors.textSecondary, fill: idx % 2 === 0 ? colors.bgCard : colors.bgCardAccent } }
          ])
        ];

        slide.addTable(tableData, {
          x: 0.8,
          y: 1.2,
          w: 11.7,
          colW: [0.9, 1.8, 1.4, 3.8, 3.8],
          border: { type: "solid", pt: 1, color: colors.borderSubtle }
        });
        break;
      }

      case "INTEGRATION_FLOW": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        const scenarios = slideData.data.scenarios || [];
        scenarios.forEach((sc, idx) => {
          const cardX = 0.8 + idx * 5.95;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: 1.2,
            w: 5.75,
            h: 4.2,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: idx === 0 ? colors.accentTeal : colors.accentOrange, width: 1.5 }
          });

          slide.addText(sc.title.toUpperCase(), {
            x: cardX + 0.3,
            y: 1.4,
            w: 5.15,
            h: 0.3,
            fontSize: 11,
            fontFace: "Arial",
            color: idx === 0 ? colors.accentTeal : colors.accentOrange,
            bold: true
          });

          slide.addText("TRIGGER EVENT:", {
            x: cardX + 0.3,
            y: 1.8,
            w: 5.15,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.textSecondary,
            bold: true
          });
          slide.addText(sc.trigger, {
            x: cardX + 0.3,
            y: 2.05,
            w: 5.15,
            h: 0.6,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary
          });

          slide.addText("INTERFACE TRANSPORT:", {
            x: cardX + 0.3,
            y: 2.75,
            w: 5.15,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.textSecondary,
            bold: true
          });
          slide.addText(sc.interface, {
            x: cardX + 0.3,
            y: 3.0,
            w: 5.15,
            h: 0.6,
            fontSize: 10.5,
            fontFace: "Courier New",
            color: colors.accentBlue
          });

          slide.addText("EXECUTION BEHAVIOR:", {
            x: cardX + 0.3,
            y: 3.7,
            w: 5.15,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.textSecondary,
            bold: true
          });
          slide.addText(sc.result, {
            x: cardX + 0.3,
            y: 3.95,
            w: 5.15,
            h: 1.2,
            fontSize: 10,
            fontFace: "Arial",
            color: colors.textPrimary
          });
        });

        // Unblocking Protocol Banner
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 5.65,
          w: 11.7,
          h: 0.9,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.borderSubtle, width: 1 }
        });
        slide.addText(`UNBLOCKING PROTOCOL: ${slideData.data.unblockingProtocol}`, {
          x: 1.1,
          y: 5.8,
          w: 11.1,
          h: 0.6,
          fontSize: 10,
          fontFace: "Arial",
          color: colors.accentOrange,
          bold: true
        });
        break;
      }

      case "TROUBLESHOOTING": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        const issues = slideData.data.issues || [];
        issues.forEach((iss, idx) => {
          const cardX = 0.8 + idx * 3.95;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: 1.2,
            w: 3.8,
            h: 5.4,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX + 0.2,
            y: 1.4,
            w: 3.4,
            h: 0.35,
            rectRadius: 0.06,
            fill: { color: idx === 0 ? colors.accentBurgundy : (idx === 1 ? colors.accentPurple : colors.accentTeal) }
          });
          slide.addText(iss.category, {
            x: cardX + 0.2,
            y: 1.4,
            w: 3.4,
            h: 0.35,
            align: "center",
            valign: "middle",
            fontSize: 9.5,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          slide.addText("SYMPTOM OBSERVED:", {
            x: cardX + 0.2,
            y: 1.95,
            w: 3.4,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.accentOrange,
            bold: true
          });
          slide.addText(iss.symptom, {
            x: cardX + 0.2,
            y: 2.2,
            w: 3.4,
            h: 0.8,
            fontSize: 10,
            fontFace: "Arial",
            color: colors.textPrimary
          });

          slide.addText("ROOT CAUSE:", {
            x: cardX + 0.2,
            y: 3.1,
            w: 3.4,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.textSecondary,
            bold: true
          });
          slide.addText(iss.cause, {
            x: cardX + 0.2,
            y: 3.35,
            w: 3.4,
            h: 0.9,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.textPrimary
          });

          slide.addText("TRIAGE & FIX ACTION:", {
            x: cardX + 0.2,
            y: 4.4,
            w: 3.4,
            h: 0.2,
            fontSize: 8.5,
            fontFace: "Arial",
            color: colors.accentTeal,
            bold: true
          });
          slide.addText(iss.triage, {
            x: cardX + 0.2,
            y: 4.65,
            w: 3.4,
            h: 1.6,
            fontSize: 9.5,
            fontFace: "Arial",
            color: colors.accentBlue
          });
        });
        break;
      }

      case "INTERVIEW_READY": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // 4-Quadrant Consultant Pitch Layout
        const sections = [
          { title: "1. DIRECT CONSULTANT ANSWER", text: slideData.data.directAnswer, color: colors.accentBlue },
          { title: "2. STRATEGIC BUSINESS CONTEXT", text: slideData.data.businessContext, color: colors.accentTeal },
          { title: "3. TECHNICAL ARCHITECTURE & FLOW", text: slideData.data.technicalFlow, color: colors.accentPurple },
          { title: "4. CONSULTANT CLOSING STATEMENT", text: slideData.data.consultantClosing, color: colors.accentOrange }
        ];

        sections.forEach((sec, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          const cardX = 0.8 + col * 5.95;
          const cardY = 1.2 + row * 2.75;

          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: 5.75,
            h: 2.55,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          slide.addText(sec.title, {
            x: cardX + 0.25,
            y: cardY + 0.2,
            w: 5.25,
            h: 0.3,
            fontSize: 9.5,
            fontFace: "Arial",
            color: sec.color,
            bold: true
          });

          slide.addText(sec.text, {
            x: cardX + 0.25,
            y: cardY + 0.55,
            w: 5.25,
            h: 1.85,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary,
            lineSpacingMultiple: 1.18
          });
        });
        break;
      }

      case "KEY_TAKEAWAYS": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // Left Column: Golden Rules
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.2,
          w: 5.75,
          h: 5.4,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.accentTeal, width: 1.5 }
        });
        slide.addText("CORE BEST PRACTICES & GOLDEN RULES", {
          x: 1.1,
          y: 1.4,
          w: 5.15,
          h: 0.3,
          fontSize: 10,
          fontFace: "Arial",
          color: colors.accentTeal,
          bold: true
        });

        (slideData.data.goldenRules || []).forEach((rule, idx) => {
          const itemY = 1.9 + idx * 1.1;
          slide.addShape(pptx.ShapeType.oval, {
            x: 1.1,
            y: itemY + 0.05,
            w: 0.25,
            h: 0.25,
            fill: { color: colors.accentTeal }
          });
          slide.addText(rule, {
            x: 1.45,
            y: itemY,
            w: 4.8,
            h: 0.95,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary,
            lineSpacingMultiple: 1.15
          });
        });

        // Right Column: Common Anti-Patterns & Mistakes
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 6.75,
          y: 1.2,
          w: 5.75,
          h: 5.4,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.accentBurgundy, width: 1.5 }
        });
        slide.addText("CRITICAL MISTAKES & ANTI-PATTERNS TO AVOID", {
          x: 7.05,
          y: 1.4,
          w: 5.15,
          h: 0.3,
          fontSize: 10,
          fontFace: "Arial",
          color: colors.accentBurgundy,
          bold: true
        });

        (slideData.data.commonMistakes || []).forEach((mst, idx) => {
          const itemY = 1.9 + idx * 1.4;
          slide.addShape(pptx.ShapeType.oval, {
            x: 7.05,
            y: itemY + 0.05,
            w: 0.25,
            h: 0.25,
            fill: { color: colors.accentBurgundy }
          });
          slide.addText(mst, {
            x: 7.4,
            y: itemY,
            w: 4.8,
            h: 1.2,
            fontSize: 10.5,
            fontFace: "Arial",
            color: colors.textPrimary,
            lineSpacingMultiple: 1.15
          });
        });
        break;
      }

      case "SOURCES_EVIDENCE": {
        addSlideHeader(slide, slideData.title, slideData.categoryTag);

        // Sources Grid
        const sources = slideData.data.sourcesList || [];
        sources.forEach((src, idx) => {
          const cardY = 1.2 + idx * 1.25;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: cardY,
            w: 11.7,
            h: 1.1,
            rectRadius: 0.08,
            fill: { color: colors.bgCard },
            line: { color: colors.borderSubtle, width: 1 }
          });

          slide.addShape(pptx.ShapeType.roundRect, {
            x: 1.1,
            y: cardY + 0.2,
            w: 1.4,
            h: 0.35,
            rectRadius: 0.06,
            fill: { color: "10B981" }
          });
          slide.addText(src.status, {
            x: 1.1,
            y: cardY + 0.2,
            w: 1.4,
            h: 0.35,
            align: "center",
            valign: "middle",
            fontSize: 9,
            fontFace: "Arial",
            color: "FFFFFF",
            bold: true
          });

          slide.addText(src.title, {
            x: 2.7,
            y: cardY + 0.2,
            w: 9.5,
            h: 0.35,
            fontSize: 12,
            fontFace: "Arial",
            color: colors.textPrimary,
            bold: true
          });

          slide.addText(`Citation Ref: [${src.citationId}] · URL: ${src.url}`, {
            x: 2.7,
            y: cardY + 0.6,
            w: 9.5,
            h: 0.35,
            fontSize: 9.5,
            fontFace: "Courier New",
            color: colors.accentBlue
          });
        });

        // Audit Sign-off Box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 5.3,
          w: 11.7,
          h: 1.3,
          rectRadius: 0.08,
          fill: { color: colors.bgCard },
          line: { color: colors.accentTeal, width: 1 }
        });
        slide.addText("AUDIT GOVERNANCE & COMPLIANCE SIGN-OFF", {
          x: 1.1,
          y: 5.45,
          w: 11.1,
          h: 0.25,
          fontSize: 9,
          fontFace: "Arial",
          color: colors.accentTeal,
          bold: true
        });
        slide.addText(slideData.data.governanceStatement, {
          x: 1.1,
          y: 5.75,
          w: 11.1,
          h: 0.7,
          fontSize: 10.5,
          fontFace: "Arial",
          color: colors.textPrimary
        });
        break;
      }

      default:
        break;
    }
  });

  const cleanFileName = `Nexus_SAP_Session_${(deckGraph.sessionTitle || "Presentation").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 40)}.pptx`;
  await pptx.writeFile({ fileName: cleanFileName });
  return cleanFileName;
}
