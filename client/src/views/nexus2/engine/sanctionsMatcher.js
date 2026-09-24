// Nexus 2.0 Transparent Match Simulation Engine
// Built using India GTS Sanctions Source Pack (Snapshot 2026-09-23)
// DISCLAIMER: Training simulation score — not a production SAP GTS screening result.

import unSanctions from "../data/unSanctionsSample.json";
import nonSdnEntities from "../data/nonSdnEntities.json";
import ofacSdn from "../data/ofacSdnSample.json";

// Normalization helper
export function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/gi, " ")       // Remove punctuation
    .replace(/\s+/g, " ")            // Normalize spaces
    .trim();
}

// Token similarity calculation (Dice / Token overlap)
function calculateTokenOverlap(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  let matches = 0;
  for (const t of tokensA) {
    if (setB.has(t)) {
      matches++;
    } else {
      // Check partial substring match for tokens >= 4 chars
      for (const tb of setB) {
        if (t.length >= 4 && tb.length >= 4 && (t.includes(tb) || tb.includes(t))) {
          matches += 0.8;
          break;
        }
      }
    }
  }
  return (2 * matches) / (tokensA.length + tokensB.length);
}

// Levenshtein distance for fuzzy ratio
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarityRatio(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}

/**
 * Screen an input query against the live loaded sanctions dataset
 * @param {Object} input - { name, alternateName, country, city, address, dob, threshold }
 */
export function screenParty(input = {}) {
  const queryName = normalizeText(input.name || "");
  const queryAlt = normalizeText(input.alternateName || "");
  const queryCountry = (input.country || "").toUpperCase().trim();
  const queryCity = normalizeText(input.city || "");
  const threshold = input.threshold !== undefined ? Number(input.threshold) : 70;

  if (!queryName) return { matches: [], totalEvaluated: 0 };

  const queryTokens = queryName.split(" ").filter(t => t.length > 1);

  const allRecords = [
    ...nonSdnEntities,
    ...unSanctions,
    ...ofacSdn
  ];

  const results = [];

  for (const entity of allRecords) {
    let bestScore = 0;
    let matchBasis = [];
    let matchedNameOrAlias = entity.name;
    let matchType = "Name Partial Match";

    // 1. Direct Name Comparison
    const normEntityName = normalizeText(entity.name);
    const entityTokens = normEntityName.split(" ").filter(t => t.length > 1);

    if (queryName === normEntityName) {
      bestScore = 100;
      matchType = "Exact Name Match";
      matchBasis.push("Exact 100% full-name identity");
    } else {
      const tokenOverlap = calculateTokenOverlap(queryTokens, entityTokens);
      const fuzzyRatio = stringSimilarityRatio(queryName, normEntityName);
      const compositeNameScore = Math.round((tokenOverlap * 0.6 + fuzzyRatio * 0.4) * 100);

      if (compositeNameScore > bestScore) {
        bestScore = compositeNameScore;
        matchedNameOrAlias = entity.name;
        matchBasis.push(`Primary Name similarity (${compositeNameScore}%)`);
      }
    }

    // 2. Alias Comparison (High Priority in GTS)
    if (entity.aliases && entity.aliases.length > 0) {
      for (const alias of entity.aliases) {
        const normAlias = normalizeText(alias);
        if (!normAlias) continue;

        if (queryName === normAlias || (queryAlt && queryAlt === normAlias)) {
          bestScore = Math.max(bestScore, 98);
          matchedNameOrAlias = alias;
          matchType = "Exact Alias Match";
          matchBasis = [`Exact match against official alias: "${alias}"`];
          break;
        }

        const aliasTokens = normAlias.split(" ").filter(t => t.length > 1);
        const aliasOverlap = calculateTokenOverlap(queryTokens, aliasTokens);
        const aliasFuzzy = stringSimilarityRatio(queryName, normAlias);
        const aliasScore = Math.round((aliasOverlap * 0.6 + aliasFuzzy * 0.4) * 100);

        if (aliasScore > bestScore) {
          bestScore = aliasScore;
          matchedNameOrAlias = alias;
          matchType = "Fuzzy Alias Match";
          matchBasis = [`Alias similarity against "${alias}" (${aliasScore}%)`];
        }
      }
    }

    // 3. Country / Address Correlation Bonus/Penalty
    let addressCorroboration = false;
    if (entity.addresses && entity.addresses.length > 0 && (queryCountry || queryCity)) {
      const addrString = entity.addresses.join(" ").toUpperCase();
      if (queryCountry && addrString.includes(queryCountry)) {
        addressCorroboration = true;
        bestScore = Math.min(100, bestScore + 8);
        matchBasis.push(`Country corroboration (${queryCountry})`);
      }
      if (queryCity && normalizeText(addrString).includes(queryCity)) {
        addressCorroboration = true;
        bestScore = Math.min(100, bestScore + 10);
        matchBasis.push(`City/Address corroboration (${queryCity})`);
      }
    }

    // 4. Threshold check
    if (bestScore >= threshold) {
      let riskStatus = "Potential match — manual review required";
      if (bestScore >= 90) riskStatus = "High Confidence Match — Immediate Block Recommended";
      else if (bestScore < 75) riskStatus = "Low Confidence — Likely False Positive";

      results.push({
        entityId: entity.entityId,
        sourceList: entity.listName,
        sourceType: entity.sourceList,
        program: entity.program || entity.unListType || "N/A",
        matchedEntity: entity.name,
        matchedAlias: matchedNameOrAlias,
        matchScore: bestScore,
        matchType,
        matchBasis: matchBasis.join(" + "),
        riskStatus,
        aliases: entity.aliases || [],
        addresses: entity.addresses || [],
        remarks: entity.remarks || entity.comments || "",
        datesOfBirth: entity.datesOfBirth || "",
        documents: entity.documents || "",
        addressCorroboration,
        snapshotDate: "2026-09-23"
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.matchScore - a.matchScore);

  return {
    query: input,
    matches: results.slice(0, 15),
    totalMatches: results.length,
    totalEvaluated: allRecords.length,
    disclaimer: "Training simulation score — not a production SAP GTS screening result"
  };
}
