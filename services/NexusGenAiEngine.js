/**
 * ══════════════════════════════════════════════════════════════════════════════
 * NEXUS GENERATIVE AI ENGINE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Provides specialized generative AI capabilities for Nexus:
 * 1. AI-Powered Conversation Auto-Titling & Summarization
 * 2. Contextual Smart Follow-Up Suggestions
 * 3. SAP Practice & Certification Quiz Generation
 * 4. Conversation-to-Knowledge Base Article Synthesis
 * 5. Personalized News & Intelligence Digest Briefing
 */

const { OFFICIAL_SAP_NEWS_REGISTRY } = require('./SapNewsKnowledgeEngine.js');

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.6-flash';

async function callGeminiJson({ prompt, systemInstruction = '', apiKey, temperature = 0.2, maxTokens = 2048 }) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Attempt primary model, fallback if needed
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastErr = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(`Gemini ${model} HTTP ${resp.status}: ${errJson.error?.message || resp.statusText}`);
      }

      const data = await resp.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from model');

      // Parse JSON safely
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```$/, '').trim();

      return JSON.parse(cleaned);
    } catch (err) {
      lastErr = err;
      console.warn(`[NexusGenAiEngine] Model ${model} failed, trying fallback...`, err.message);
    }
  }

  throw lastErr || new Error('Failed to generate content from all Gemini models');
}

/**
 * Generates an executive summary and structured metadata from a conversation transcript.
 */
async function generateConversationSummary({ messages, apiKey }) {
  if (!messages || messages.length === 0) {
    return {
      title: 'Empty Investigation',
      summary: 'No messages recorded yet.',
      keyTakeaways: [],
      tcodes: [],
      modules: []
    };
  }

  // Sample conversation context (up to 12 recent messages)
  const transcriptSnippet = messages.slice(-12).map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 800)}`).join('\n---\n');

  const prompt = `You are an expert SAP Enterprise Solution Architect and Technical Lead.
Analyze the following SAP conversation between a consultant and the Nexus Copilot:

${transcriptSnippet}

Generate a concise, authoritative enterprise summary formatted strictly as JSON with this schema:
{
  "title": "Concise 3-7 word title reflecting the core SAP problem or solution",
  "summary": "1-2 paragraphs detailing the business process, technical root cause or architecture question, and the agreed resolution path.",
  "keyTakeaways": ["Takeaway 1 with exact SAP concepts", "Takeaway 2", "Takeaway 3"],
  "tcodes": ["SMQ1", "SM59"],
  "modules": ["SD", "EWM", "PP"]
}`;

  try {
    return await callGeminiJson({ prompt, apiKey, temperature: 0.2 });
  } catch (e) {
    // Fallback extraction
    const firstUser = messages.find(m => m.role === 'user')?.content || 'SAP Investigation';
    return {
      title: firstUser.slice(0, 48) + (firstUser.length > 48 ? '...' : ''),
      summary: `Automated summary of ${messages.length} messages focusing on SAP technical triage.`,
      keyTakeaways: ['Conversation preserved with full transactional context.'],
      tcodes: [],
      modules: ['General']
    };
  }
}

/**
 * Generates 3 contextual, high-value follow-up questions tailored to SAP consultants.
 */
async function generateFollowUpSuggestions({ lastUserPrompt, lastAssistantResponse, module = 'General', apiKey }) {
  const prompt = `You are an SAP Principal Consultant.
Based on the consultant's question and the Copilot's answer, suggest exactly 3 intelligent, forward-looking follow-up questions the consultant should investigate next.
Focus on SAP transaction codes, release specifics (Cloud Public vs Private), edge-case safeguards, or configuration steps.

Consultant Question:
${(lastUserPrompt || '').slice(0, 500)}

Copilot Answer:
${(lastAssistantResponse || '').slice(0, 1000)}

Domain Module: ${module}

Return strictly a JSON array of 3 strings:
["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]`;

  try {
    const res = await callGeminiJson({ prompt, apiKey, temperature: 0.3 });
    if (Array.isArray(res)) return res.slice(0, 3);
    if (res.followUps && Array.isArray(res.followUps)) return res.followUps.slice(0, 3);
    return [];
  } catch (e) {
    // Intelligent fallback suggestions
    return [
      `What are the relevant configuration steps in SPRO for this ${module} scenario?`,
      `How does this behavior differ between S/4HANA Cloud Public Edition and On-Premise?`,
      `What official SAP Notes or monitoring transaction codes apply here?`
    ];
  }
}

/**
 * Generates an interactive multiple-choice SAP quiz for learning and certification.
 */
async function generateSapQuiz({ topic, module = 'General', difficulty = 'intermediate', count = 5, apiKey }) {
  const prompt = `You are an SAP Certification Exam Author and Solution Architect.
Create an interactive ${count}-question multiple-choice quiz on the topic: "${topic}" in SAP module "${module}".
Difficulty level: ${difficulty}.

Each question MUST:
1. Reflect realistic enterprise S/4HANA or SAP ERP scenarios.
2. Have exactly 4 plausible options.
3. Include clear reasoning explaining why the correct answer is right and why distractors are wrong.
4. Reference real SAP transaction codes or Help documentation where applicable.

Output strictly valid JSON with this schema:
[
  {
    "id": "q1",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Comprehensive explanation of the SAP standard behavior...",
    "tcode": "VF01 / VA02",
    "docRef": "SAP Help Portal - S/4HANA Sales"
  }
]`;

  try {
    const res = await callGeminiJson({ prompt, apiKey, temperature: 0.25, maxTokens: 3000 });
    if (Array.isArray(res)) return res;
    if (res.questions && Array.isArray(res.questions)) return res.questions;
    return [];
  } catch (e) {
    console.error('[NexusGenAiEngine] Quiz generation error:', e);
    // Provide a resilient default question if API call fails
    return [
      {
        id: "q1",
        question: `In SAP ${module}, what is the primary consideration when configuring ${topic}?`,
        options: [
          "Verifying organizational unit assignment and active customizing",
          "Hardcoding values in standard SAP tables via SE16N",
          "Disabling SAP standard authority checks",
          "Skipping transport request creation in development system"
        ],
        correctIndex: 0,
        explanation: "Organizational unit assignments and standard IMG configuration ensure proper transactional integrity and authorization checks.",
        tcode: "SPRO",
        docRef: "SAP Help Portal"
      }
    ];
  }
}

/**
 * Converts a troubleshooting or design conversation into a structured Knowledge Base Article.
 */
async function convertConversationToArticle({ conversationTitle, messages, module = 'General', apiKey }) {
  const transcriptSnippet = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---\n\n').slice(0, 8000);

  const prompt = `You are a Chief SAP Knowledge Manager.
Transform the following technical consultation conversation into a formal, structured SAP Knowledge Base Article (similar to high-tier SAP Community technical guides or SAP OSS resolution notes).

Topic: ${conversationTitle}
Module: ${module}

Transcript:
${transcriptSnippet}

Produce strictly valid JSON with this schema:
{
  "title": "KB: Title of the article",
  "category": "Troubleshooting / Best Practice / Architecture",
  "module": "${module}",
  "problemStatement": "Clear description of the business issue or design challenge",
  "rootCauseAnalysis": "Technical root cause explanation citing standard SAP mechanisms, queues, or condition tables",
  "stepByStepResolution": [
    "Step 1: Check transaction...",
    "Step 2: Inspect parameter...",
    "Step 3: Apply configuration change or reactivation..."
  ],
  "applicableTransactions": ["TCODE1", "TCODE2"],
  "safeguardsAndGovernance": "Production warning and rollback safeguards before executing steps",
  "verifiedOssNotes": ["SAP Note 123456", "SAP Note 789012"],
  "fullMarkdown": "A complete, beautifully formatted markdown document of the entire article with code blocks, tables, and step-by-step instructions."
}`;

  try {
    return await callGeminiJson({ prompt, apiKey, temperature: 0.2, maxTokens: 3500 });
  } catch (e) {
    return {
      title: `KB: ${conversationTitle}`,
      category: 'Investigation Summary',
      module,
      problemStatement: `Documentation of resolution steps for ${conversationTitle}.`,
      rootCauseAnalysis: 'Identified during active troubleshooting in Nexus session.',
      stepByStepResolution: [
        'Review logged transactional error in system logs.',
        'Execute verification in relevant transaction codes.',
        'Ensure system safeguards and authorizations are validated.'
      ],
      applicableTransactions: [],
      safeguardsAndGovernance: 'Always test changes in Quality / Sandbox before applying in Production.',
      verifiedOssNotes: [],
      fullMarkdown: `# KB: ${conversationTitle}\n\n## Overview\nGenerated from Nexus session on ${new Date().toLocaleDateString()}.`
    };
  }
}

/**
 * Personalizes a news & intelligence digest tailored to user's favorite module and edition.
 */
async function generatePersonalNewsDigest({ userPreferences = {}, apiKey }) {
  const targetModule = userPreferences.defaultModule || 'ALL';
  const targetEdition = userPreferences.defaultEdition || 'ALL';

  // Filter registry
  let items = OFFICIAL_SAP_NEWS_REGISTRY;
  if (targetModule !== 'ALL') {
    const modUpper = targetModule.toUpperCase();
    items = items.filter(i => (i.module || '').toUpperCase().includes(modUpper) || (i.title || '').toUpperCase().includes(modUpper));
  }
  if (!items.length) items = OFFICIAL_SAP_NEWS_REGISTRY.slice(0, 4);

  const itemsContext = items.map(i => `Title: ${i.title}\nModule: ${i.module}\nRelease: ${i.release}\nEditions: ${JSON.stringify(i.editionApplicability)}\nSummary: ${i.summary}`).join('\n\n');

  const prompt = `You are the Nexus SAP Intelligence Briefing Editor.
Create an executive personal digest briefing for an SAP Lead Consultant based on these verified SAP release items:

${itemsContext}

Consultant Preferences:
- Preferred Module: ${targetModule}
- Preferred Landscape Edition: ${targetEdition}
- Tone: ${userPreferences.languageTone || 'professional'}
- Style: ${userPreferences.responseStyle || 'detailed'}

Produce strictly valid JSON with this schema:
{
  "headline": "Compelling executive headline for this week's SAP innovations",
  "executiveSummary": "1-2 paragraphs highlighting the strategic impact on business processes and Joule AI adoption",
  "topStories": [
    {
      "title": "Story title",
      "module": "SD / EWM / GTS",
      "impact": "High / Medium",
      "takeaway": "Actionable takeaway for consultants",
      "editionAvailability": "Cloud Public / Private / On-Premise applicability"
    }
  ],
  "recommendedAction": "Concrete next step for the consultant's enterprise landscape"
}`;

  try {
    return await callGeminiJson({ prompt, apiKey, temperature: 0.25 });
  } catch (e) {
    return {
      headline: `Latest SAP ${targetModule} Innovations & Release Intelligence`,
      executiveSummary: `Verified updates across SAP S/4HANA releases and Joule AI enhancements.`,
      topStories: items.slice(0, 3).map(i => ({
        title: i.title,
        module: i.module,
        impact: 'High',
        takeaway: i.summary,
        editionAvailability: Object.entries(i.editionApplicability || {}).map(([k, v]) => `${k}: ${v}`).join('; ')
      })),
      recommendedAction: 'Review release notes in SAP Help Portal and schedule regression test cycles.'
    };
  }
}

/**
 * Structures raw AI response content into a well-formatted Nexus Doc with a title.
 */
async function structureNexusDoc({ rawContent, apiKey }) {
  const snippet = (rawContent || '').slice(0, 10000);
  const prompt = `You are an expert technical editor. Given the following AI-generated consultation content, transform it into a polished, executive-ready document in the style of Claude Docs.

Raw Content:
${snippet}

Produce strictly valid JSON:
{
  "title": "A concise, descriptive title for this document (e.g. 'Outbound Queue Monitoring - Talking Points', max 70 chars)",
  "content": "The full content reformatted as clean, well-structured markdown. Preserve all key facts, SAP transaction codes, steps, safeguards, and reasoning. Use clean headings (##, ###), bullet points, blockquotes ('> ') for key executive statements, and code blocks for technical IDs/configs. Make it read like a polished reference document ready for team presentation or documentation."
}`;

  try {
    return await callGeminiJson({ prompt, apiKey, temperature: 0.15, maxTokens: 4096 });
  } catch (e) {
    // Fallback: use raw content with clean first line as title
    const lines = (rawContent || 'Nexus Document').split('\n').map(l => l.trim()).filter(Boolean);
    let autoTitle = 'Nexus Document';
    if (lines.length > 0) {
      autoTitle = lines[0].replace(/^[#*>\s\-]+/, '').slice(0, 70) || 'Nexus Document';
    }
    return {
      title: autoTitle,
      content: rawContent || ''
    };
  }
}

/**
 * Enhances/polishes a brief user prompt into an executive-grade structured prompt (Claude-style prompt enhancer).
 */
async function enhancePrompt({ draftPrompt, activeModule = 'AUTO', apiKey }) {
  const trimmed = (draftPrompt || '').trim();
  if (!trimmed) {
    return { enhancedPrompt: '' };
  }

  const prompt = `You are an expert prompt engineer specializing in enterprise systems, SAP S/4HANA architecture, and advanced AI assistants (Claude, Gemini).
Your task is to take the user's raw, brief, or draft query and rewrite it into a clear, high-impact, well-structured prompt for an AI copilot.

User's Raw Draft:
"${trimmed}"

Active Context / Module:
"${activeModule || 'AUTO'}"

Guidelines:
1. Preserve the user's core intent 100%. Do NOT invent unrelated questions.
2. Expand abbreviations and technical terms where helpful (e.g., if discussing qRFC or staging, mention relevant SAP transaction codes like SMQ1/SMQ2, /SCWM/STAGE, tables, or SPRO customizing).
3. If the query is an inquiry, structure it to ask for: root causes, architectural mechanics, step-by-step procedures, and necessary production safeguards.
4. If it's a general daily work query, make it concise, professional, and well-targeted.
5. Return strictly valid JSON:
{
  "enhancedPrompt": "The polished prompt ready to be inserted directly into the prompt bar without extra conversational quotes or preamble."
}`;

  try {
    const res = await callGeminiJson({ prompt, apiKey, temperature: 0.2, maxTokens: 1024 });
    return {
      enhancedPrompt: res?.enhancedPrompt?.trim() || trimmed
    };
  } catch (err) {
    console.warn('[NexusGenAiEngine] enhancePrompt fallback:', err.message);
    // Graceful fallback: return the original draft
    return {
      enhancedPrompt: trimmed
    };
  }
}

module.exports = {
  generateConversationSummary,
  generateFollowUpSuggestions,
  generateSapQuiz,
  convertConversationToArticle,
  generatePersonalNewsDigest,
  structureNexusDoc,
  enhancePrompt
};

