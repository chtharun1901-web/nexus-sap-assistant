/**
 * Nexus Gemini Intelligence Service
 * 
 * Integrates cutting-edge Gemini Multimodal APIs:
 * 1. Text-to-Speech (TTS): gemini-3.8-flash-tts
 * 2. Semantic Dense Vector Search: gemini-embedding-2 (3072-dim cosine similarity)
 * 3. Deep Autonomous SAP Investigation & RCA Engine
 * 4. Multimodal Screen Error & RF Gun Visual OCR Analyzer: gemini-3.5-flash-lite
 */

const fs = require('fs');
const path = require('path');
const db = require('../db.js');

// Helper to get Gemini API key
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();
  const keyPath = path.join(__dirname, '..', '.apikey');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8').trim();
  }
  return '';
}

// Cosine similarity for 3072-dim vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

// ── 1. Voice Synthesis (TTS) ────────────────────────────────────────────────
async function synthesizeSpeech(text, { title = 'Briefing' } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is not configured');

  // Strip markdown, asterisks, brackets, and code blocks for crisp speech
  let cleanText = (text || '')
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();

  if (cleanText.length > 1400) {
    cleanText = cleanText.substring(0, 1400) + '... Audio briefing completed.';
  }

  let audioBase64 = null;
  let mimeType = 'audio/wav';

  // Strategy A: gemini-3.8-flash-tts
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: { responseModalities: ['AUDIO'] }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        audioBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'audio/wav';
      }
    }
  } catch (err) {
    console.warn('[Nexus Gemini Intelligence] gemini-3.8-flash-tts notice:', err.message);
  }

  // Strategy B: gemini-2.5-flash-preview-tts
  if (!audioBase64) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cleanText }] }],
          generationConfig: { responseModalities: ['AUDIO'] }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          audioBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'audio/wav';
        }
      }
    } catch (err) {
      console.warn('[Nexus Gemini Intelligence] gemini-2.5-flash-preview-tts notice:', err.message);
    }
  }

  if (!audioBase64) {
    throw new Error('TTS service could not generate audio for the requested text.');
  }

  return { ok: true, audioData: audioBase64, mimeType };
}

// ── 2. Semantic Vector Search ───────────────────────────────────────────────
// Real AMS Archetypes extracted from 2,292 rows of Wakefit/Chezzion Hypercare Tracker
const AMS_INCIDENT_ARCHETYPES = [
  {
    id: 'arch-pgi-queue',
    title: 'PGI done in EWM but not reflecting in MB51 (Queue Stuck in SMQ2)',
    category: 'Outbound & Interface',
    tcode: 'SMQ2 / /SCWM/PRDO',
    symptom: 'Outbound delivery stuck at loading door. PGI posted in EWM, but S/4HANA stock and MB51 show no goods movement. qRFC queue locked.',
    rootCause: 'LUW queue error or Handling Unit already existed in S/4 causing a communication queue lock in SMQ2.',
    resolution: 'Check SMQ2 in EWM and S/4. Clear locked LUW. If HU exists in target, reverse PGI in /SCWM/PRDO, repack into fresh Pick HU, link to door, and re-trigger queue.',
    plant: 'TN03 / TN10'
  },
  {
    id: 'arch-hu-partially-sorted',
    title: 'Handling Unit Partially Sorted / Cannot Load at Staging Door',
    category: 'Handling Unit & Staging',
    tcode: '/SCWM/RFUI / /SCWM/PRDO',
    symptom: 'Operator attempts to load truck via RF gun but receives error: "HU partially sorted" or "Loading not allowed". Products remain in GI-PACK.',
    rootCause: 'Operator missed scanning the final sort destination step, or Pick HU is not assigned to the active loading door.',
    resolution: 'In RF terminal or /SCWM/PRDO, create a new Pick HU, pack items into it, link HU to the staging door, and proceed with loading and PGI.',
    plant: 'TN03 / Mattress'
  },
  {
    id: 'arch-picking-b2-f2',
    title: 'Picking Pending / Warehouse Task Not Created (Stock in B2 Blocked)',
    category: 'Inventory & Stock Types',
    tcode: '/SCWM/POST / /SCWM/MON',
    symptom: 'Delivery wave generated but system reports: "No stock available" or fails to create warehouse task even though physical mattresses exist.',
    rootCause: 'Physical stock is stored under stock type B2 (Blocked / Quality) instead of F2 (Unrestricted Saleable), or an aged batch is locked in the HU.',
    resolution: 'Execute posting change from B2 to F2 in /SCWM/POST or repack aged batches away from the target pick handling unit.',
    plant: 'TN03 / TN10'
  },
  {
    id: 'arch-master-wildcard',
    title: 'Storage Type Search Wildcard / Missing PACI or SRCI Master Data',
    category: 'Master Data & Putaway',
    tcode: '/SCWM/MAT1 / /SCWM/PACKSPEC',
    symptom: 'Putaway WT fails with error: "No destination bin found" or "Storage type search wildcard no entry".',
    rootCause: 'Product not extended to EWM warehouse view; PACI (Putaway Control Indicator), SRCI (Storage Section Control), or MTOM / Packaging Specification missing.',
    resolution: 'Extend product in /SCWM/MAT1, assign PACI and SRCI indicators, and activate packaging specification in /SCWM/PACKSPEC.',
    plant: 'TN03 / TN10'
  },
  {
    id: 'arch-open-task-drop',
    title: 'Open Task on Handling Unit / "Do Drop" / Open Resource Lock',
    category: 'Floor Operations & RF',
    tcode: '/SCWM/MON / /SCWM/RFUI',
    symptom: 'Operator scans HU on RF terminal and receives "Open task exists on resource" or "Do drop before continuing".',
    rootCause: 'Prior operator logged off without confirming the putaway or drop step, leaving the warehouse task locked to their resource ID.',
    resolution: 'Open Warehouse Monitor (/SCWM/MON) under Resource Management, confirm the open warehouse task, and complete the HU drop.',
    plant: 'TN03'
  },
  {
    id: 'arch-wave-not-released',
    title: 'Wave Created but No Warehouse Tasks Generated',
    category: 'Wave Management',
    tcode: '/SCWM/WAVE / /SCWM/MON',
    symptom: 'Supervisor sees wave status Created, but operators receive no picking orders on RF terminals.',
    rootCause: 'Wave was saved but not released by the shift supervisor, or wave release criteria were unmet.',
    resolution: 'Select wave in /SCWM/WAVE or /SCWM/MON and click "Release Wave" to dispatch tasks to the pickers.',
    plant: 'TN03 / TN10'
  },
  {
    id: 'arch-damaged-mattress',
    title: 'Physical Damage on Mattress / Cancel Pick in Warehouse',
    category: 'Exceptions & Quality',
    tcode: '/SCWM/CANCPICK',
    symptom: 'Operator identifies torn fabric or crushed frame on mattress during picking wave.',
    rootCause: 'Physical damage incurred during replenishment or staging.',
    resolution: 'Trigger exception code in RFUI or transaction /SCWM/CANCPICK for that product and batch. Stock moves to damaged scrap bin.',
    plant: 'TN03'
  },
  {
    id: 'arch-wrong-bin-putaway',
    title: 'Wrong Bin Putaway / Stock Bin Mismatch',
    category: 'Putaway Discrepancy',
    tcode: '/SCWM/ADPROD / /SCWM/MON',
    symptom: 'Operator inadvertently placed pallet into adjacent bin without confirming the system bin change.',
    rootCause: 'Physical scanner mismatch on high-reach aisle.',
    resolution: 'Use transaction /SCWM/ADPROD (Ad-Hoc Product Transfer) to move the quant from the misplaced physical bin to the correct system storage bin.',
    plant: 'TN03 / TN10'
  }
];

// In-memory embedding cache for archetypes
let archetypeVectorsCache = null;
let isIndexingArchetypes = false;

async function getEmbedding(text) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key missing');

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Embedding API failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  return data.embedding?.values || [];
}

async function ensureArchetypeVectors() {
  if (archetypeVectorsCache && archetypeVectorsCache.length > 0) return;
  if (isIndexingArchetypes) return;
  isIndexingArchetypes = true;

  try {
    const vectors = [];
    for (const arch of AMS_INCIDENT_ARCHETYPES) {
      const compositeText = `${arch.title}. Category: ${arch.category}. Symptoms: ${arch.symptom}. Root Cause: ${arch.rootCause}. Fix: ${arch.resolution}`;
      try {
        const vec = await getEmbedding(compositeText);
        vectors.push({ archetype: arch, vector: vec });
      } catch (err) {
        console.warn('[Semantic Indexer] Warning indexing archetype:', arch.title, err.message);
      }
    }
    archetypeVectorsCache = vectors;
    console.log(`\x1b[32m[Semantic Indexer] Successfully indexed ${archetypeVectorsCache.length} AMS archetypes with gemini-embedding-2\x1b[0m`);
  } finally {
    isIndexingArchetypes = false;
  }
}

// Background warmup of vectors
setTimeout(() => {
  ensureArchetypeVectors().catch(() => {});
}, 3000);

async function semanticSearch(query, limit = 5) {
  if (!query || typeof query !== 'string') return { ok: true, matches: [] };
  await ensureArchetypeVectors();

  if (!archetypeVectorsCache || archetypeVectorsCache.length === 0) {
    return { ok: true, matches: [] };
  }

  const queryVector = await getEmbedding(query);
  if (!queryVector || queryVector.length === 0) {
    return { ok: true, matches: [] };
  }

  const scored = archetypeVectorsCache.map(item => {
    const sim = cosineSimilarity(queryVector, item.vector);
    return {
      archetype: item.archetype,
      similarity: sim,
      matchPercentage: Math.min(99, Math.max(50, Math.round(sim * 100)))
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  const topMatches = scored.slice(0, limit).map(s => ({
    ...s.archetype,
    similarity: s.similarity,
    matchPercentage: s.matchPercentage
  }));

  return {
    ok: true,
    query,
    matches: topMatches
  };
}

// ── 3. Deep Autonomous SAP Investigation & RCA Engine ────────────────────────
async function deepResearch(topic, { context = '', module = 'EWM', userId = 'default' } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is not configured');

  const researchPrompt = `You are the Nexus Principal Enterprise Research Agent specializing in SAP S/4HANA, EWM, TM, MM, PP, Basis, and high-volume warehouse AMS operations.
Conduct an exhaustive, forensic-grade technical investigation on this problem:
---
Investigation Topic: ${topic}
Domain Context: ${context || 'High-volume distribution center live operations (Wakefit/Chezzion Hypercare patterns)'}
Module: ${module}
---
Structure your deep research into these 5 comprehensive, highly actionable sections formatted in clean GitHub Markdown:

# Deep Technical Investigation Report: ${topic}

## 1. Executive Perimeter & Operational Blast Radius
- Exact business process affected (e.g., Outbound PGI Sync, RF Loading, Wave Picking, Batch Assignment)
- Immediate operational impact (stuck trucks at dock doors, SLA penalty, inventory valuation discrepancy)

## 2. Technical Architecture & Communication Flow
- Interface mechanics: qRFC LUWs, SMQ2 / SMQ1 queues, BAPI synchronization, or IDoc message types
- Key monitoring transactions (/SCWM/PRDO, /SCWM/MON, SMQ2, SLG1, ST22)
- Database tables & quants involved (/SCWM/AQUA, /SCWM/QUAN, /SCWM/HUHDR)

## 3. Deep Root Cause Analysis (RCA Matrix)
- Classification: User Execution Error vs Master Data Defect vs System Interface Lock
- Forensic breakdown of how the error triggers in live operations

## 4. Immediate Floor Resolution Playbook (Step-by-Step)
- Tactical workaround for warehouse operators & supervisors right now on the floor
- Exact screens, buttons, and transaction inputs required

## 5. Permanent Prevention & Supervisor SOP Playbook
- Master data / configuration fix to prevent repeat occurrences
- Daily hypercare routine for supervisors in /SCWM/MON to catch this early
`;

  let reportText = '';

  // Call gemini-3.5-flash-lite for deep thinking
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: researchPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Deep Research generation failed: ${errText}`);
  }

  const data = await resp.json();
  reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Save report automatically to Nexus Docs
  let createdDoc = null;
  try {
    let validUserId = userId;
    if (!validUserId || !db.getUserById(validUserId)) {
      const defaultUser = db.getUserByEmail('test@example.com');
      if (defaultUser) validUserId = defaultUser.id;
    }
    if (validUserId) {
      const docTitle = `RCA Investigation: ${topic.substring(0, 50)}`;
      createdDoc = db.createNexusDoc(validUserId, {
        title: docTitle,
        content: reportText,
        sourceConversationId: null,
        sourceTurnId: null
      });
    }
  } catch (dbErr) {
    console.warn('[Deep Research] Warning saving doc to database:', dbErr.message);
  }

  return {
    ok: true,
    topic,
    doc: createdDoc,
    rcaReport: reportText
  };
}

// ── 4. Multimodal Screen Error & RF Gun Visual OCR Analyzer ──────────────────
async function analyzeScreen(imageBase64, mimeType = 'image/png') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key is not configured');

  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
  const cleanMime = (mimeType || 'image/png').split(';')[0].trim();

  const ocrPrompt = `You are an expert SAP GUI, Fiori, and RF Terminal (/SCWM/RFUI) visual diagnostic engine.
Inspect this screen capture carefully.
Extract the technical error details, status bar message, transaction code, visible handling units, and provide immediate step-by-step resolution.

Return ONLY a valid JSON object matching this schema:
{
  "tcode": "string (e.g. /SCWM/PRDO, /SCWM/RFUI, SMQ2, VL02N)",
  "screenTitle": "string",
  "messageClass": "string (e.g. /SCWM/DELIVERY, M7, VL)",
  "messageNumber": "string (e.g. 045, 021, 150)",
  "errorMessage": "exact text from status bar or dialog",
  "extractedEntities": {
    "hu": "Handling Unit number or null",
    "bin": "Storage Bin or null",
    "delivery": "Delivery number or null",
    "batch": "Batch number or null"
  },
  "rootCause": "Detailed explanation of why this error occurred",
  "immediateFixSteps": ["Step 1", "Step 2", "Step 3"],
  "summary": "1-2 sentence executive explanation"
}`;

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
          { text: ocrPrompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Screen visual analysis failed: ${errText}`);
  }

  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let parsed = {};
  try {
    parsed = JSON.parse(rawText);
  } catch (pErr) {
    parsed = { summary: rawText };
  }

  return {
    ok: true,
    analysis: parsed
  };
}

module.exports = {
  synthesizeSpeech,
  semanticSearch,
  deepResearch,
  analyzeScreen,
  ensureArchetypeVectors
};
