/**
 * Nexus Intent & Context Analysis Service (Layer 1)
 * 
 * Separates:
 * 1. What the user asked
 * 2. What the user is trying to accomplish (Intent)
 * 3. Which expert mode should answer (Daily Task Assistant vs SAP Specialist)
 * 
 * STRICT INVARIANT:
 * Preserves 100% of existing SAP answer generation style when SAP is relevant.
 * When generic work or daily tasks are requested, prevents unsolicited SAP assumptions.
 */

// 22 Supported Intent Classifications
export const INTENTS = {
  GENERAL_QUESTION: 'GENERAL_QUESTION',
  DAILY_TASK: 'DAILY_TASK',
  TASK_PLANNING: 'TASK_PLANNING',
  RESEARCH: 'RESEARCH',
  DOCUMENT_ANALYSIS: 'DOCUMENT_ANALYSIS',
  DOCUMENT_CREATION: 'DOCUMENT_CREATION',
  DATA_ANALYSIS: 'DATA_ANALYSIS',
  WRITING_OR_REWRITING: 'WRITING_OR_REWRITING',
  SUMMARIZATION: 'SUMMARIZATION',
  COMPARISON: 'COMPARISON',
  TRACKER_AUDIT: 'TRACKER_AUDIT',
  TROUBLESHOOTING: 'TROUBLESHOOTING',
  LEARNING: 'LEARNING',
  INTERVIEW_PREPARATION: 'INTERVIEW_PREPARATION',
  SYSTEM_EXECUTION: 'SYSTEM_EXECUTION',
  SAP_TECHNICAL_QUERY: 'SAP_TECHNICAL_QUERY',
  SAP_PROCESS_QUERY: 'SAP_PROCESS_QUERY',
  SAP_CONFIGURATION_QUERY: 'SAP_CONFIGURATION_QUERY',
  SAP_INTEGRATION_QUERY: 'SAP_INTEGRATION_QUERY',
  EXPORT_REQUEST: 'EXPORT_REQUEST',
  FOLLOW_UP: 'FOLLOW_UP',
  CLARIFICATION: 'CLARIFICATION',
  CASUAL_CONVERSATION: 'CASUAL_CONVERSATION'
};

// Known SAP Modules & Technology Keywords
const SAP_CORE_KEYWORDS = [
  'sap', 's/4hana', 's4hana', 's4/hana', 's4', 'ecc', 'ecc6', 'r/3', 'fiori', 'abap', 'btp',
  'netweaver', 'hana', 'solution manager', 'solman'
];

const SAP_MODULE_KEYWORDS = [
  'gts', 'global trade services', 'ewm', 'extended warehouse management',
  'sd', 'sales and distribution', 'mm', 'materials management', 'pp', 'production planning',
  'fi/co', 'fico', 'financial accounting', 'controlling', 'qm', 'quality management',
  'pm', 'plant maintenance', 'tm', 'transportation management', 'is-retail', 'is retail',
  'ariba', 'successfactors', 'ibp', 'integrated business planning', 'e-wm', 'wm'
];

const SAP_TECHNICAL_TERMS = [
  'tcode', 't-code', 'transaction code', 'spro', 'customizing', 'img', 'bapi', 'badi',
  'user exit', 'enhancement point', 'cif', 'qrfc', 'bgrpc', 'idoc', 'ale', 'smq1', 'smq2',
  'slg1', 'sm21', 'se11', 'se16', 'se16n', 'se38', 'se80', 'st05', 'st22', 'su01', 'pfcg',
  'vbak', 'vbap', 'likp', 'lips', 'vbrk', 'vbrp', 'mara', 'marc', 'mard', 'kna1', 'lfa1',
  'ekko', 'ekpo', 'afko', 'afpo', 'mseg', 'mkpf', 'bkpf', 'bseg', 'acdoca',
  'spl screening', 'sanctioned party list', 'scomet', 'atlas', 'aes', 'eccn',
  'storage type', 'warehouse task', 'warehouse order', 'wave picking', 'pmr', 'delivery-based staging',
  'condition technique', 'pricing procedure', 'access sequence', 'output determination',
  'account determination', 'availability check', 'atp', 'transfer order', 'luw', 'goods receipt',
  'goods issue', 'post goods issue', 'pgi', 'billing document', 'sales order', 'purchase order'
];

// Regex for standard SAP T-Codes and Tables
const SAP_TCODE_REGEX = /\b(?:\/SAPSLL\/[A-Z0-9_]+|\/SCWM\/[A-Z0-9_]+|\/ISDFPS\/[A-Z0-9_]+|[A-Z]{2,4}\d{2,3}[A-Z]?)\b/i;

export class IntentRouter {
  /**
   * Primary Entry Point: Classify Intent, Detect SAP Relevance, and Route Query
   * 
   * @param {string} userPrompt - Current user prompt
   * @param {Array} history - Previous messages in active session
   * @param {Object} options - { userMode: 'AUTO'|'SAP'|'DAILY_TASK', selectedModule, uploadedDocs }
   */
  static analyze(userPrompt = '', history = [], options = {}) {
    const prompt = (userPrompt || '').trim();
    const userMode = (options.userMode || options.mode || 'AUTO').toUpperCase();
    const historyMsgs = Array.isArray(history) ? history : [];
    const lastTurn = historyMsgs.length > 0 ? historyMsgs[historyMsgs.length - 1] : null;

    // 1. Detect SAP Relevance
    const sapRelevance = this.detectSapRelevance(prompt, historyMsgs, userMode, options);

    // 2. Classify Multi-Label Intents
    const intents = this.classifyIntents(prompt, sapRelevance.isRelevant, historyMsgs, options);
    const primaryIntent = intents[0] || INTENTS.GENERAL_QUESTION;

    // 3. Determine Routing Mode
    let mode = 'GENERAL';
    if (userMode === 'SAP') {
      mode = 'SAP';
    } else if (userMode === 'DAILY_TASK') {
      mode = sapRelevance.isExplicitlyPrompted ? 'SAP' : 'DAILY_TASK';
    } else {
      // AUTO Mode Routing Logic
      if (intents.includes(INTENTS.TRACKER_AUDIT)) {
        mode = 'SAP';
      } else if (sapRelevance.isRelevant && (
        intents.some(i => i.startsWith('SAP_')) ||
        primaryIntent === INTENTS.SYSTEM_EXECUTION ||
        primaryIntent === INTENTS.INTERVIEW_PREPARATION ||
        primaryIntent === INTENTS.TROUBLESHOOTING
      )) {
        mode = 'SAP';
      } else if (
        intents.includes(INTENTS.DAILY_TASK) || 
        intents.includes(INTENTS.TASK_PLANNING) ||
        (intents.includes(INTENTS.WRITING_OR_REWRITING) && /\b(?:email|manager|memo|letter|status update|agenda)\b/i.test(prompt))
      ) {
        mode = 'DAILY_TASK';
      } else if (
        intents.includes(INTENTS.DOCUMENT_ANALYSIS) || 
        intents.includes(INTENTS.DATA_ANALYSIS)
      ) {
        mode = 'DOCUMENT_TASK';
      } else if (intents.includes(INTENTS.RESEARCH)) {
        mode = 'RESEARCH';
      } else {
        mode = sapRelevance.isRelevant ? 'SAP' : 'GENERAL';
      }
    }

    // 4. Generate User-Facing "Understanding" Label
    const understandingLabel = this.generateUnderstandingLabel(prompt, primaryIntent, mode, sapRelevance);

    return {
      mode,
      intents,
      primaryIntent,
      isSapRelevant: mode === 'SAP',
      sapRelevanceDetails: sapRelevance,
      understandingLabel,
      userMode
    };
  }

  /**
   * Multi-Criteria SAP Relevance Detection
   * Avoids false positives from workspace context or historic turns.
   */
  static detectSapRelevance(prompt, history, userMode, options = {}) {
    const lowerPrompt = prompt.toLowerCase();

    // Forced modes
    if (userMode === 'SAP') {
      return { isRelevant: true, confidence: 'FORCED_USER_SETTING', matchedKeywords: ['USER_MODE_SAP'] };
    }

    // Check for explicit user request for generic / non-SAP output
    const isExplicitGenericRequest = /\b(?:asked generic|make it generic|want it generic|generic not|not related to (?:sap|sd|ewm|gts|mm|pp)|not related (?:sd|ewm|gts|mm|pp)|without sap|not sap)\b/i.test(prompt);

    // Helper to check if a specific keyword is preceded by negation words
    const isNegated = (kw) => {
      const negRegex = new RegExp(`(?:not|no|without|unrelated to|not related to|not related|non-?|instead of|rather than|generic not)\\s+(?:sap\\s+)?${kw}\\b`, 'i');
      return negRegex.test(prompt);
    };

    // Check direct evidence in current user message (Highest Priority)
    const directKeywords = [];
    
    // Check SAP core keywords
    for (const kw of SAP_CORE_KEYWORDS) {
      if (isNegated(kw)) continue;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(prompt)) directKeywords.push(kw);
    }

    // Check SAP module keywords (only in explicit context or module names)
    for (const kw of SAP_MODULE_KEYWORDS) {
      if (isNegated(kw)) continue;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(prompt)) directKeywords.push(kw);
    }

    // Check SAP technical terms and T-Codes
    for (const kw of SAP_TECHNICAL_TERMS) {
      if (isNegated(kw)) continue;
      if (lowerPrompt.includes(kw)) directKeywords.push(kw);
    }

    if (SAP_TCODE_REGEX.test(prompt) && !isExplicitGenericRequest) {
      directKeywords.push('TCODE_MATCH');
    }

    const hasDirectEvidence = directKeywords.length > 0 && !isExplicitGenericRequest;

    // Daily task explicit indicators (Negative weighting against assuming SAP)
    const genericDailyTaskKeywords = [
      'plan my day', 'daily tasks', 'daily task list', 'organize my work', 'organize my tasks',
      'meeting agenda', 'email to my manager', 'draft an email', 'write an email',
      'summarize this document', 'what should i do first', 'what should i do today',
      'what should i do next', 'track the tasks', 'pending items', 'to-do list', 'todo list',
      'personal schedule', 'work calendar', 'prepare for my meeting'
    ];

    const isGenericDailyRequest = genericDailyTaskKeywords.some(kw => lowerPrompt.includes(kw)) || isExplicitGenericRequest;

    if (userMode === 'DAILY_TASK' || isExplicitGenericRequest) {
      return {
        isRelevant: hasDirectEvidence,
        isExplicitlyPrompted: hasDirectEvidence,
        confidence: isExplicitGenericRequest ? 'EXPLICIT_GENERIC_OVERRIDE' : (hasDirectEvidence ? 'EXPLICIT_IN_DAILY_MODE' : 'DAILY_TASK_MODE_DEFAULT'),
        matchedKeywords: directKeywords
      };
    }

    // If current query has generic daily work phrasing and NO direct SAP keywords:
    // STRICT RULE: Do not let old SAP context force it into an SAP query!
    if (isGenericDailyRequest && !hasDirectEvidence) {
      return {
        isRelevant: false,
        confidence: 'GENERIC_TASK_OVERRIDE',
        matchedKeywords: []
      };
    }

    // Check immediate predecessor follow-up (Turn n-1)
    let isFollowUpContinuation = false;
    if (!hasDirectEvidence && history.length > 0) {
      const lastMsg = history[history.length - 1];
      const secondLastMsg = history.length > 1 ? history[history.length - 2] : null;
      
      const isShortFollowUp = prompt.split(/\s+/).length <= 8;
      const followUpPhrases = [
        'what about', 'why did', 'how to test', 'can you improve', 'explain that',
        'what next', 'how do i configure', 'show me step', 'which tcode'
      ];
      const hasFollowUpTone = followUpPhrases.some(p => lowerPrompt.startsWith(p) || lowerPrompt.includes(p));

      // Only inherit SAP mode if immediate predecessor was explicitly an SAP topic
      const lastContent = (lastMsg?.content || '') + ' ' + (secondLastMsg?.content || '');
      const prevWasSap = SAP_CORE_KEYWORDS.some(k => new RegExp(`\\b${k}\\b`, 'i').test(lastContent));

      if (isShortFollowUp && hasFollowUpTone && prevWasSap && !isGenericDailyRequest) {
        isFollowUpContinuation = true;
      }
    }

    const isRelevant = hasDirectEvidence || isFollowUpContinuation;

    return {
      isRelevant,
      isExplicitlyPrompted: hasDirectEvidence,
      confidence: hasDirectEvidence ? 'HIGH_CURRENT_PROMPT' : (isFollowUpContinuation ? 'MEDIUM_FOLLOWUP' : 'NONE'),
      matchedKeywords: directKeywords
    };
  }

  /**
   * Multi-label Intent Classification
   */
  static classifyIntents(prompt, isSap, history, options = {}) {
    const q = prompt.toLowerCase();
    const intents = [];

    // Forensic Tracker Audit & Issue Log Analysis (Highest Priority for Tabular Data)
    if (
      q.includes('tracker') || q.includes('tickets') || q.includes('ticket') || q.includes('issue log') ||
      q.includes('ams') || q.includes('hypercare') || (q.includes('difference between') && (q.includes('claude') || q.includes('tracker'))) ||
      (q.includes('like this') && q.includes('think')) ||
      (options?.uploadedDocs && options.uploadedDocs.length > 0 && (q.includes('analyze') || q.includes('read') || q.includes('go through') || q.includes('look at') || q.includes('check') || q.includes('rows') || q.includes('issues')))
    ) {
      intents.push(INTENTS.TRACKER_AUDIT);
    }

    // Daily task & planning
    if (
      q.includes('today') || q.includes('daily task') || q.includes('what should i do') ||
      q.includes('to-do') || q.includes('todo') || q.includes('organize my work') ||
      q.includes('pending items') || q.includes('schedule')
    ) {
      intents.push(INTENTS.DAILY_TASK);
    }

    if (
      q.includes('plan') || q.includes('agenda') || q.includes('calendar') ||
      q.includes('timeline') || q.includes('milestone') || q.includes('pacing') ||
      q.includes('roadmap')
    ) {
      intents.push(INTENTS.TASK_PLANNING);
    }

    // Writing & Rewriting
    if (
      q.includes('email') || q.includes('draft') || q.includes('rewrite') ||
      q.includes('make it professional') || q.includes('compose') || q.includes('write a letter') ||
      q.includes('polite') || q.includes('executive tone')
    ) {
      intents.push(INTENTS.WRITING_OR_REWRITING);
    }

    // Document / Data Analysis
    if (
      q.includes('document') || q.includes('report') || q.includes('attached') ||
      q.includes('spreadsheet') || q.includes('excel') || q.includes('file') ||
      q.includes('pdf') || q.includes('sheet')
    ) {
      if (q.includes('analyze') || q.includes('review') || q.includes('inspect') || q.includes('check this')) {
        intents.push(INTENTS.DOCUMENT_ANALYSIS);
      }
      if (q.includes('create') || q.includes('make') || q.includes('generate')) {
        intents.push(INTENTS.DOCUMENT_CREATION);
      }
      if (q.includes('data') || q.includes('columns') || q.includes('numbers')) {
        intents.push(INTENTS.DATA_ANALYSIS);
      }
    }

    // Summarization
    if (q.includes('summarize') || q.includes('summary') || q.includes('recap') || q.includes('key takeaways')) {
      intents.push(INTENTS.SUMMARIZATION);
    }

    // Comparison
    if (q.includes('compare') || q.includes('difference between') || q.includes('versus') || q.includes('vs')) {
      intents.push(INTENTS.COMPARISON);
    }

    // Interview Preparation
    if (q.includes('interview') || q.includes('mock interview') || q.includes('how to answer') || q.includes('star method')) {
      intents.push(INTENTS.INTERVIEW_PREPARATION);
    }

    // Export Requests
    if (q.includes('export') || q.includes('powerpoint') || q.includes('pptx') || q.includes('slides') || q.includes('word')) {
      intents.push(INTENTS.EXPORT_REQUEST);
    }

    // Follow-ups & Short clarifications
    if (prompt.split(/\s+/).length <= 4 && (q.includes('next') || q.includes('more') || q.includes('why') || q.includes('how'))) {
      intents.push(INTENTS.FOLLOW_UP);
    }

    // SAP-Specific Intents (Active only when SAP relevance is confirmed)
    if (isSap) {
      if (q.includes('spro') || q.includes('config') || q.includes('customiz') || q.includes('path') || q.includes('setup')) {
        intents.push(INTENTS.SAP_CONFIGURATION_QUERY);
      }
      if (q.includes('cif') || q.includes('rfc') || q.includes('integration') || q.includes('queue') || q.includes('sync')) {
        intents.push(INTENTS.SAP_INTEGRATION_QUERY);
      }
      if (q.includes('flow') || q.includes('process') || q.includes('step') || q.includes('order to cash') || q.includes('screening')) {
        intents.push(INTENTS.SAP_PROCESS_QUERY);
      }
      if (q.includes('table') || q.includes('field') || q.includes('bapi') || q.includes('badi') || q.includes('abap') || q.includes('tcode')) {
        intents.push(INTENTS.SAP_TECHNICAL_QUERY);
      }
      if (q.includes('error') || q.includes('stuck') || q.includes('fail') || q.includes('dump') || q.includes('block') || q.includes('troubleshoot')) {
        intents.push(INTENTS.TROUBLESHOOTING);
      }
      if (q.includes('execute') || q.includes('run') || q.includes('release') || q.includes('post') || q.includes('cancel')) {
        intents.push(INTENTS.SYSTEM_EXECUTION);
      }
    }

    // Casual Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|thanks|thank you)\b/i.test(prompt)) {
      intents.push(INTENTS.CASUAL_CONVERSATION);
    }

    if (intents.length === 0) {
      intents.push(INTENTS.GENERAL_QUESTION);
    }

    return intents;
  }

  /**
   * Generates a concise, single-sentence "Understanding" label
   * (e.g. "Understanding: You want a practical strategy for organizing your daily work, not an SAP-specific explanation.")
   */
  static generateUnderstandingLabel(prompt, primaryIntent, mode, sapRelevance) {
    if (mode === 'DAILY_TASK') {
      if (primaryIntent === INTENTS.TASK_PLANNING) {
        return "Understanding: You need a structured calendar, timeline, and task allocation plan for your deliverables.";
      }
      if (primaryIntent === INTENTS.WRITING_OR_REWRITING) {
        return "Understanding: You want a clear, professional communication draft tailored for your stakeholder.";
      }
      return "Understanding: You want a practical strategy for organizing your daily work, prioritizing tasks, and tracking next actions.";
    }

    if (mode === 'DOCUMENT_TASK') {
      return "Understanding: You want an objective breakdown and key task extraction based on the provided document.";
    }

    if (mode === 'SAP') {
      if (primaryIntent === INTENTS.TRACKER_AUDIT) {
        return "Understanding: You want deep forensic data aggregation, ticket counts, and root-cause-to-fix correlation from the issue tracker.";
      }
      if (primaryIntent === INTENTS.SAP_PROCESS_QUERY) {
        return "Understanding: You need the end-to-end SAP process flow, document status transitions, and integration touchpoints.";
      }
      if (primaryIntent === INTENTS.SAP_CONFIGURATION_QUERY) {
        return "Understanding: You need the exact SPRO configuration path, controlling parameters, and governance impact.";
      }
      if (primaryIntent === INTENTS.TROUBLESHOOTING) {
        return "Understanding: You are diagnosing an SAP technical or process failure requiring root-cause triage.";
      }
      if (primaryIntent === INTENTS.INTERVIEW_PREPARATION) {
        return "Understanding: You want an authoritative, speakable SAP consultant interview answer structured for Tier-1 evaluation.";
      }
      return "Understanding: You are consulting on an SAP enterprise functional and technical architecture topic.";
    }

    return "Understanding: You are requesting clear, structured executive work assistance.";
  }
}
