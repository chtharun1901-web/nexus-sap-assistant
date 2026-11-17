/**
 * Nexus Anti-Repetition Visual History Tracker
 * Prevents repetitive diagram templates by recording previously used
 * layouts, metaphors, design families, and color themes.
 * Recommends fresh presentation-grade visual patterns based on content meaning.
 */

const HISTORY_STORAGE_KEY = "nexus_visual_design_history";

/**
 * Retrieves the history of recent visualizations.
 */
export function getVisualHistory(limit = 15) {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch (err) {
    console.warn("Failed to read visual history:", err);
    return [];
  }
}

/**
 * Records a newly generated visualization into history.
 */
export function recordVisualGeneration(record = {}) {
  try {
    const history = getVisualHistory(30);
    const entry = {
      id: record.id || "vis-" + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      visualPattern: record.visualPattern || record.visualType || "cross_functional_swimlane",
      designFamily: record.designFamily || record.designTheme || "sap_enterprise",
      layoutStyle: record.layoutMode || "balanced",
      title: (record.title || "").slice(0, 60),
      dominantColor: record.theme?.primary || "#0A2540"
    };

    const updated = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, 30);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return entry;
  } catch (err) {
    console.warn("Failed to record visual history:", err);
    return null;
  }
}

/**
 * Evaluates whether a proposed visual pattern or design family repeats recent patterns.
 */
export function auditDesignRepetition(proposedPattern, proposedFamily) {
  const history = getVisualHistory(5);
  if (history.length === 0) {
    return {
      isRepeated: false,
      repetitionScore: 0,
      badgeText: "Fresh Design Archetype",
      auditSummary: "Design repetition check: Passed. First diagram in session."
    };
  }

  const lastEntry = history[0];
  const samePatternAsLast = lastEntry.visualPattern === proposedPattern;
  const sameFamilyAsLast = lastEntry.designFamily === proposedFamily;

  const patternCountRecent = history.filter((h) => h.visualPattern === proposedPattern).length;
  const familyCountRecent = history.filter((h) => h.designFamily === proposedFamily).length;

  if (samePatternAsLast && sameFamilyAsLast) {
    return {
      isRepeated: true,
      repetitionScore: 90,
      badgeText: "Identical to Previous Slide",
      auditSummary: `Warning: Both visual pattern "${proposedPattern}" and design family "${proposedFamily}" match the previous slide.`,
      previousPattern: lastEntry.visualPattern,
      previousFamily: lastEntry.designFamily
    };
  }

  if (samePatternAsLast) {
    return {
      isRepeated: true,
      repetitionScore: 60,
      badgeText: "Pattern Repeated",
      auditSummary: `Visual pattern "${proposedPattern}" was used in the immediate previous slide.`,
      previousPattern: lastEntry.visualPattern
    };
  }

  if (sameFamilyAsLast && familyCountRecent >= 3) {
    return {
      isRepeated: true,
      repetitionScore: 40,
      badgeText: "Theme Repetition",
      auditSummary: `Design family "${proposedFamily}" used ${familyCountRecent} times consecutively.`,
      previousFamily: lastEntry.designFamily
    };
  }

  return {
    isRepeated: false,
    repetitionScore: 0,
    badgeText: "Design Repetition Check: Passed",
    auditSummary: `Passed: Visually distinct from previous slide (${lastEntry.visualPattern} / ${lastEntry.designFamily}).`
  };
}

/**
 * Chooses the best diverse alternative pattern & family from candidate options
 * to ensure visual variation without sacrificing semantic fit.
 */
export function getDiverseSelection(candidatePatterns = [], candidateFamilies = [], preferredPattern = null, preferredFamily = null) {
  const history = getVisualHistory(3);
  const lastPattern = history[0]?.visualPattern;
  const lastFamily = history[0]?.designFamily;

  let chosenPattern = preferredPattern || candidatePatterns[0];
  let chosenFamily = preferredFamily || candidateFamilies[0];

  // If the preferred pattern matches the last one, pick the next best candidate
  if (chosenPattern === lastPattern && candidatePatterns.length > 1) {
    chosenPattern = candidatePatterns.find((p) => p !== lastPattern) || candidatePatterns[1];
  }

  // If the chosen family matches the last one, rotate to a complementary family
  if (chosenFamily === lastFamily && candidateFamilies.length > 1) {
    chosenFamily = candidateFamilies.find((f) => f !== lastFamily) || candidateFamilies[1];
  }

  return {
    pattern: chosenPattern,
    family: chosenFamily,
    antiRepetitionApplied: chosenPattern !== preferredPattern || chosenFamily !== preferredFamily
  };
}
