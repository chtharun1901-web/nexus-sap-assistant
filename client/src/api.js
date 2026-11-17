// All API calls to backend server.js
const BASE = '';

function getAuthToken() {
  try {
    return localStorage.getItem('nexus_auth_token') || '';
  } catch (e) {
    return '';
  }
}

function setAuthToken(token) {
  try {
    if (token) localStorage.setItem('nexus_auth_token', token);
    else localStorage.removeItem('nexus_auth_token');
  } catch (e) {}
}

export function jsonHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function codeExecute({ prompt, context }) {
  const res = await fetch('/api/code-execute', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ prompt, context })
  });
  return res.json();
}

async function req(method, path, body, opts = {}) {
  const token = getAuthToken();
  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  if (!res.ok) {
    let errData = {};
    try {
      errData = await res.json();
    } catch (e) {
      errData = { error: res.statusText };
    }
    const errMsg =
      (typeof errData.error === 'string' ? errData.error : errData?.error?.message) ||
      errData.message ||
      `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const data = await res.json().catch(() => ({}));
  if (data && data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export const api = {
  // Auth
  register: (d) => req('POST', '/api/auth/register', d),
  login:    (d) => req('POST', '/api/auth/login', d),
  googleLogin: (d) => req('POST', '/api/auth/google-login', d),
  sendOtp: (d) => req('POST', '/api/auth/send-otp', d),
  verifyOtp: (d) => req('POST', '/api/auth/verify-otp', d),
  logout:   async () => {
    try {
      await req('POST', '/api/auth/logout');
    } finally {
      setAuthToken('');
    }
  },
  me:       ()  => req('GET',  '/api/auth/me'),
  updateProfile: (d) => req('PATCH', '/api/auth/profile', d),
  exportData: () => req('GET', '/api/auth/export'),
  passwordReset:  (d) => req('POST', '/api/auth/password-reset', d),
  resetPasswordConfirm: (d) => req('POST', '/api/auth/reset-password-confirm', d),
  getLatestEmail: (email) => req('GET', '/api/auth/latest-email?email=' + encodeURIComponent(email || '')),
  configureSmtp: (d) => req('POST', '/api/auth/configure-smtp', d),
  passwordChange: (d) => req('POST', '/api/auth/password-change', d),

  // Conversations
  getConversations:    ()   => req('GET',  '/api/conversations'),
  getConversation:     (id) => req('GET',  '/api/conversations/' + id),
  createConversation:  (d)  => req('POST', '/api/conversations', d),
  updateConversation:  (id, d) => req('PATCH', '/api/conversations/' + id, d),
  deleteConversation:  (id) => req('DELETE', '/api/conversations/' + id),

  // Chat (Grounded Streaming & Normal)
  streamChat: async (payload, onChunk, onSources, onClassification, signal, onIntent, onTaskInfo, onSearchEntry) => {
    const token = getAuthToken();
    const res = await fetch(BASE + '/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok) {
      let errText = '';
      try {
        const errJson = await res.json();
        errText = errJson.error?.message || errJson.message || `HTTP ${res.status}`;
      } catch(e) {
        errText = `HTTP ${res.status}`;
      }
      throw new Error(errText);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let citations = [];
    let classification = null;
    let taskInfo = null;
    let searchEntryHtml = null;
    let buffer = '';

    let currentEventType = 'message';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ''; // retain incomplete trailing line

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          currentEventType = 'message';
          continue;
        }

        if (line.startsWith('event:')) {
          currentEventType = line.slice(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const dataPayload = line.slice(5).trim();
          if (!dataPayload) continue;

          try {
            if (currentEventType === 'nexus-classification') {
              const classData = JSON.parse(dataPayload);
              classification = classData.classification || null;
              if (onClassification) onClassification(classification);
            } else if (currentEventType === 'nexus-intent') {
              const intentData = JSON.parse(dataPayload);
              if (onIntent) onIntent(intentData);
            } else if (currentEventType === 'nexus-sources') {
              const srcData = JSON.parse(dataPayload);
              citations = srcData.sources || [];
              if (onSources) onSources(citations);
            } else if (currentEventType === 'nexus-search-entry') {
              const entryData = JSON.parse(dataPayload);
              searchEntryHtml = entryData.html || null;
              if (onSearchEntry) onSearchEntry(searchEntryHtml);
            } else if (currentEventType === 'nexus-complete') {
              const completeData = JSON.parse(dataPayload);
              if (completeData.text) {
                fullText = completeData.text;
                if (onChunk) onChunk('', fullText);
              }
              if (completeData.taskInfo) {
                taskInfo = completeData.taskInfo;
                if (onTaskInfo) onTaskInfo(completeData.taskInfo);
              }
            } else if (currentEventType === 'nexus-conversation') {
              // Handled or ignored
            } else if (currentEventType === 'nexus-error') {
              const errData = JSON.parse(dataPayload);
              const errMsg = errData.error || 'Server error occurred.';
              fullText += `\n\n⚠ Upstream notice: ${errMsg}\n`;
              if (onChunk) onChunk('', fullText);
            } else {
              const dataJson = JSON.parse(dataPayload);
              const chunk = dataJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                fullText += chunk;
                if (onChunk) onChunk(chunk, fullText);
              }
            }
          } catch (e) {
            // Ignore JSON parse errors for heartbeats/pings
          }
          currentEventType = 'message';
        }
      }
    }

    return { text: fullText, citations, classification, taskInfo, searchEntryHtml };
  },

  chat: (d) => req('POST', '/api/chat', d),
  getSpecializations: () => req('GET', '/api/specializations'),

  // Home
  homeSummary:  () => req('GET', '/api/home/summary'),
  userProfile:  () => req('GET', '/api/user/profile'),
  saveOnboarding: (d) => req('POST', '/api/user/onboarding', d),

  // Contexts
  getContexts:    () => req('GET',  '/api/contexts'),
  createContext:  (d) => req('POST', '/api/contexts', d),

  // Knowledge
  getKnowledge:   ()  => req('GET',  '/api/knowledge'),
  addKnowledge:   (d) => req('POST', '/api/knowledge', d),

  // Templates
  getTemplates: () => req('GET', '/api/templates'),

  // Investigations
  getInvestigations:   () => req('GET',  '/api/investigations'),
  createInvestigation: (d) => req('POST', '/api/investigations', d),

  // Search
  search:     (d) => req('POST', '/api/search', d),
  omniSearch: (d) => req('POST', '/api/search/omni', d),

  // Documents
  getDocuments: () => req('GET', '/api/documents'),
  upload: (formData) => {
    const token = getAuthToken();
    return fetch(BASE + '/api/upload', {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },

  // KB & Notes
  getKb:    () => req('GET', '/api/kb'),
  getNotes: () => req('GET', '/api/notes'),
  getSapNews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', '/api/sap/news' + (qs ? '?' + qs : ''));
  },
  classifySapNews: (d) => req('POST', '/api/sap/classify', d),
  retrieveSapNews: (d) => req('POST', '/api/sap/retrieve', d),

  // Connectors
  getConnectors: () => req('GET', '/api/connectors'),

  // Notifications
  getNotifications: () => req('GET', '/api/notifications'),
  readAllNotifications: () => req('POST', '/api/notifications/read-all'),

  // Feedback
  getFeedback:  () => req('GET',  '/api/feedback'),
  addFeedback:  (d) => req('POST', '/api/feedback', d),

  // Shared
  getSharedWithMe: () => req('GET', '/api/shared-with-me'),

  // Actions
  getActions: () => req('GET', '/api/actions'),

  // Observability
  getObservability: () => req('GET', '/api/observability'),

  // Status
  getStatus: () => req('GET', '/api/status'),

  // Save API key
  saveKey: (d) => req('POST', '/api/savekey', d),

  // Process Intelligence
  getProcessIntelligence: () => req('GET', '/api/process-intelligence'),

  // GenAI: Preferences
  getPreferences: () => req('GET', '/api/preferences'),
  updatePreferences: (d) => req('PUT', '/api/preferences', d),

  // GenAI: Bookmarks & Pins
  getBookmarks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', '/api/bookmarks' + (qs ? '?' + qs : ''));
  },
  createBookmark: (d) => req('POST', '/api/bookmarks', d),
  deleteBookmark: (id) => req('DELETE', '/api/bookmarks/' + id),

  // GenAI: Prompt Templates
  getPromptTemplates: () => req('GET', '/api/templates/prompts'),
  createPromptTemplate: (d) => req('POST', '/api/templates/prompts', d),
  deletePromptTemplate: (id) => req('DELETE', '/api/templates/prompts/' + id),

  // GenAI: Summaries & Auto-Title
  summarizeConversation: (id) => req('POST', `/api/conversations/${id}/summarize`),
  getConversationSummary: (id) => req('GET', `/api/conversations/${id}/summary`),

  // GenAI: Smart Follow-Ups
  getFollowUpSuggestions: (d) => req('POST', '/api/chat/follow-ups', d),

  // GenAI: Conversation to Article
  convertConversationToArticle: (id) => req('POST', `/api/conversations/${id}/to-article`),

  // GenAI: Quizzes
  generateQuiz: (d) => req('POST', '/api/quiz/generate', d),
  getQuizzes: () => req('GET', '/api/quiz/list'),
  getQuiz: (id) => req('GET', `/api/quiz/${id}`),
  submitQuizAttempt: (id, d) => req('POST', `/api/quiz/${id}/attempt`, d),
  getQuizStats: () => req('GET', '/api/quiz/stats'),

  // GenAI: Personalized News Digest
  getPersonalNewsDigest: () => req('GET', '/api/sap/digest'),

  // GenAI: AI Analytics
  getAiAnalytics: () => req('GET', '/api/user/ai-analytics'),

  // Nexus Docs (Claude-style persistent documents)
  createNexusDoc: (d) => req('POST', '/api/nexus-docs', d),
  listNexusDocs: () => req('GET', '/api/nexus-docs'),
  getNexusDoc: (id) => req('GET', `/api/nexus-docs/${id}`),
  updateNexusDoc: (id, d) => req('PUT', `/api/nexus-docs/${id}`, d),
  deleteNexusDoc: (id) => req('DELETE', `/api/nexus-docs/${id}`),

  // Prompt Enhancer (Claude-style prompt polish)
  enhancePrompt: (d) => req('POST', '/api/prompt/enhance', d),

  // Voice Multimodal Transcription (Gemini 3.5 Transcribe / Flash)
  transcribeAudio: (d) => req('POST', '/api/voice/transcribe', d),

  // Audio Shift Handover Processor (Voice Memo to SOP)
  processShiftHandover: (d) => req('POST', '/api/voice/shift-handover', d),

  // Voice Speech Synthesis (Text-to-Speech via Gemini 3.8 Flash TTS)
  synthesizeSpeech: (d) => req('POST', '/api/voice/synthesize', d),

  // Semantic Vector Search (Gemini Embedding 2 Cosine Retrieval)
  semanticSearch: (d) => req('POST', '/api/search/semantic', d),

  // Deep Autonomous SAP Investigation & RCA Engine
  deepResearch: (d) => req('POST', '/api/deep-research', d),

  // Visual RF Terminal & Screen Error OCR Analyzer (Gemini 3.5 Flash)
  analyzeScreen: (d) => req('POST', '/api/vision/analyze-screen', d),

  // Python Code Execution Sandbox (Gemini built-in Python sandbox)
  codeExecute: (d) => codeExecute(d),

  // Gemini Context Caching (CachedContent API for AMS Incidents)
  cacheQuery: (d) => req('POST', '/api/cache/query', d),
  cacheStatus: () => req('GET', '/api/cache/status'),
  cacheWarmup: (d) => req('POST', '/api/cache/warmup', d),

  // Feature #21: Autonomous SAP Tool Agent (Function Calling)
  sapAgentInvestigate: (d) => req('POST', '/api/sap/agent-investigate', d),
  sapExecuteAction: (d) => req('POST', '/api/sap/execute-approved-action', d),

  // Feature #25: Visual Warehouse Diagram Generator (Imagen 3 & Gemini SVG)
  generateWarehouseVisual: (d) => req('POST', '/api/vision/generate-layout', d),

  // Nexus Projects, Workspaces & Scoped Search
  getProjects: () => req('GET', '/api/projects'),
  createProject: (data) => req('POST', '/api/projects', data),
  getProject: (id) => req('GET', `/api/projects/${id}`),
  updateProject: (id, data) => req('PATCH', `/api/projects/${id}`, data),
  deleteProject: (id) => req('DELETE', `/api/projects/${id}`),
  getProjectSessions: (id) => req('GET', `/api/projects/${id}/sessions`),
  createProjectSession: (id, data) => req('POST', `/api/projects/${id}/sessions`, data),
  searchProject: (id, query) => req('GET', `/api/projects/${id}/search?q=${encodeURIComponent(query)}`),
  uploadProjectFile: (id, fileData) => req('POST', `/api/projects/${id}/files`, fileData),
  deleteProjectFile: (id, fileId) => req('DELETE', `/api/projects/${id}/files/${fileId}`),
  globalSearch: (query, projectId) => req('GET', `/api/search?q=${encodeURIComponent(query)}${projectId ? `&projectId=${encodeURIComponent(projectId)}` : ''}`),
};

