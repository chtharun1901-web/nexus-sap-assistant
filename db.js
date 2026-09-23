const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'nexus.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    password_salt TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email',
    provider_subject TEXT,
    role TEXT DEFAULT 'SAP Operations Lead',
    workspace_id TEXT DEFAULT 'ws-enterprise-default',
    created_at TEXT NOT NULL,
    last_login_at TEXT,
    last_active_at TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    selected_role TEXT,
    active_sap_context_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    request_id TEXT,
    model TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sap_contexts (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    product TEXT NOT NULL,
    deployment TEXT,
    client TEXT,
    plant TEXT,
    warehouse TEXT,
    psa TEXT,
    staging_method TEXT,
    integration_technology TEXT,
    environment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    product TEXT,
    release TEXT,
    is_restricted INTEGER DEFAULT 0,
    storage_reference TEXT,
    upload_timestamp TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    citation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'In Progress',
    severity TEXT DEFAULT 'Medium',
    business_impact TEXT,
    affected_process TEXT,
    environment TEXT,
    landscape_name TEXT,
    symptoms TEXT,
    hypotheses_json TEXT,
    checklist_json TEXT,
    tcodes_json TEXT,
    evidence_json TEXT,
    owner_name TEXT,
    comments_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS action_drafts (
    id TEXT PRIMARY KEY,
    investigation_id TEXT,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    status TEXT DEFAULT 'Review',
    target_environment TEXT NOT NULL,
    steps_json TEXT,
    rollback_plan TEXT,
    approver TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    action_draft_id TEXT NOT NULL,
    requested_by_user_id TEXT NOT NULL,
    approver_user_id TEXT,
    status TEXT DEFAULT 'pending',
    decision TEXT,
    decided_at TEXT,
    audit_reference TEXT,
    FOREIGN KEY(action_draft_id) REFERENCES action_drafts(id) ON DELETE CASCADE,
    FOREIGN KEY(requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT,
    workspace_id TEXT,
    request_id TEXT,
    conversation_id TEXT,
    action_type TEXT,
    model TEXT,
    user_prompt TEXT,
    sources_searched_count INTEGER DEFAULT 0,
    sources_retrieved_count INTEGER DEFAULT 0,
    sources_retrieved_json TEXT,
    citation_ids_json TEXT,
    source_tier TEXT,
    blocked_events_json TEXT,
    latency_ms INTEGER DEFAULT 0,
    status INTEGER DEFAULT 200,
    error_message TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_items (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    citation_id TEXT,
    tags_json TEXT,
    sap_product TEXT,
    sap_release TEXT,
    sap_architecture TEXT,
    provenance_type TEXT DEFAULT 'official',
    source_conversation_id TEXT,
    source_message_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_resource_type TEXT,
    related_resource_id TEXT,
    read_status INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shared_resources (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    shared_with_user_id TEXT NOT NULL,
    permission TEXT DEFAULT 'viewer',
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    conversation_id TEXT,
    message_id TEXT,
    request_id TEXT,
    rating TEXT NOT NULL,
    feedback_category TEXT,
    comments TEXT,
    model TEXT,
    source_state TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ── Schema Column Migrations ───────────────────────────────────────────────
function addColumnIfMissing(table, col, colDef) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${colDef};`);
  } catch (e) {
    // Column already exists or table locked
  }
}

addColumnIfMissing('users', 'onboarding_completed', 'INTEGER DEFAULT 0');
addColumnIfMissing('users', 'primary_goals_json', 'TEXT');
addColumnIfMissing('users', 'sap_areas_json', 'TEXT');
addColumnIfMissing('users', 'favorite_context_id', 'TEXT');

addColumnIfMissing('sap_contexts', 'ewm_pp_version', 'TEXT');
addColumnIfMissing('sap_contexts', 'release_level', 'TEXT');
addColumnIfMissing('sap_contexts', 'architecture', 'TEXT');
addColumnIfMissing('sap_contexts', 'is_favorite', 'INTEGER DEFAULT 0');
addColumnIfMissing('sap_contexts', 'is_archived', 'INTEGER DEFAULT 0');
addColumnIfMissing('sap_contexts', 'notes', 'TEXT');
addColumnIfMissing('sap_contexts', 'source_of_context', "TEXT DEFAULT 'user_provided'");
addColumnIfMissing('sap_contexts', 'support_package_level', 'TEXT');
addColumnIfMissing('sap_contexts', 'last_verified_at', 'TEXT');

// ── Security Helpers ────────────────────────────────────────────────────────

function hashPassword(password, salt = null) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

// ── User Management ─────────────────────────────────────────────────────────

function createUser({ email, password, displayName, role, avatarUrl, authProvider = 'email', providerSubject = null, workspaceId = 'ws-enterprise-default' }) {
  const existing = getUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const id = generateId('usr');
  const now = new Date().toISOString();
  let passwordHash = null;
  let passwordSalt = null;

  if (password) {
    const hp = hashPassword(password);
    passwordHash = hp.hash;
    passwordSalt = hp.salt;
  }

  const stmt = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, password_salt, display_name, avatar_url,
      auth_provider, provider_subject, role, workspace_id, created_at,
      last_login_at, last_active_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  stmt.run(
    id, email.toLowerCase().trim(), passwordHash, passwordSalt,
    displayName || email.split('@')[0], avatarUrl || null,
    authProvider, providerSubject, role || 'SAP Operations Lead',
    workspaceId, now, now, now
  );

  // Seed default enterprise SAP Contexts and Initial Investigation for this user
  seedUserDefaults(id, workspaceId, displayName || email.split('@')[0]);

  return getUserById(id);
}

function seedDemoAccounts() {
  try {
    if (!getUserByEmail('architect@nexus.sap')) {
      createUser({
        email: 'architect@nexus.sap',
        password: 'Password123!',
        displayName: 'Raghav Sharma',
        role: 'SAP Operations Lead'
      });
    }
    if (!getUserByEmail('consultant@nexus.sap')) {
      createUser({
        email: 'consultant@nexus.sap',
        password: 'Password123!',
        displayName: 'Priya Patel',
        role: 'SAP PP Consultant'
      });
    }
  } catch (e) {
    // Ignore if already seeded
  }
}

// Ensure demo accounts are seeded
seedDemoAccounts();

function getUserByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const row = stmt.get(email.toLowerCase().trim());
  return row || null;
}

function getUserById(id) {
  if (!id) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  // Exclude password hashes from general return
  const { password_hash, password_salt, ...safeUser } = row;
  safeUser.name = safeUser.display_name;
  safeUser.displayName = safeUser.display_name;
  safeUser.workspaceId = safeUser.workspace_id;
  safeUser.avatarUrl = safeUser.avatar_url;
  return safeUser;
}

function updateUserProfile(id, { displayName, role, avatarUrl }) {
  const stmt = db.prepare(`
    UPDATE users SET display_name = COALESCE(?, display_name),
                     role = COALESCE(?, role),
                     avatar_url = COALESCE(?, avatar_url),
                     last_active_at = ?
    WHERE id = ?
  `);
  stmt.run(displayName || null, role || null, avatarUrl || null, new Date().toISOString(), id);
  return getUserById(id);
}

function changeUserPassword(id, oldPassword, newPassword) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id);
  if (!user || !user.password_hash || !user.password_salt) {
    throw new Error('Invalid account for password change');
  }
  if (!verifyPassword(oldPassword, user.password_hash, user.password_salt)) {
    throw new Error('Current password is incorrect');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, id);
  return true;
}

function resetUserPasswordByEmail(email, newPassword) {
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error('No registered account found with this email');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, user.id);
  return getUserById(user.id);
}

// ── Session Management ──────────────────────────────────────────────────────

function createSession(userId, rememberMe = true) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const sessionId = generateId('sess');
  const now = new Date();
  const maxDays = rememberMe ? 14 : 1;
  const expiresAt = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000).toISOString();

  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const stmt = db.prepare(`
    INSERT INTO sessions (id, token_hash, user_id, workspace_id, expires_at, created_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(sessionId, tokenHash, userId, user.workspace_id, expiresAt, now.toISOString(), now.toISOString());

  // Update user last login
  db.prepare('UPDATE users SET last_login_at = ?, last_active_at = ? WHERE id = ?').run(now.toISOString(), now.toISOString(), userId);

  return { token: rawToken, sessionId, expiresAt, user };
}

function getSessionByToken(rawToken) {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const stmt = db.prepare(`
    SELECT s.*, u.email, u.display_name, u.avatar_url, u.role, u.status as user_status
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ?
  `);
  const session = stmt.get(tokenHash);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    deleteSession(rawToken);
    return null;
  }

  // Touch last_active
  const now = new Date().toISOString();
  db.prepare('UPDATE sessions SET last_active_at = ? WHERE id = ?').run(now, session.id);
  db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(now, session.user_id);

  return {
    sessionId: session.id,
    userId: session.user_id,
    workspaceId: session.workspace_id,
    expiresAt: session.expires_at,
    user: {
      id: session.user_id,
      email: session.email,
      displayName: session.display_name,
      avatarUrl: session.avatar_url,
      role: session.role,
      workspaceId: session.workspace_id,
      status: session.user_status
    }
  };
}

function deleteSession(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

function deleteAllUserSessions(userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

// ── Conversation & Message Persistence ──────────────────────────────────────

function createConversation(userId, { id: customId, title, selectedRole, activeSapContextId, workspaceId }) {
  const user = getUserById(userId);
  const id = customId || generateId('conv');
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM conversations WHERE id = ? AND owner_user_id = ?').get(id, userId);
  if (existing) {
    return getConversation(userId, id);
  }

  const stmt = db.prepare(`
    INSERT INTO conversations (id, owner_user_id, workspace_id, title, selected_role, active_sap_context_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, userId, workspaceId || user?.workspace_id || 'ws-enterprise-default',
    title || 'New SAP Investigation',
    selectedRole || 'SAP Operations Lead',
    activeSapContextId || 'ctx-prd-pp',
    now, now
  );

  return getConversation(userId, id);
}

function getConversation(userId, conversationId) {
  const stmt = db.prepare(`
    SELECT * FROM conversations WHERE id = ? AND owner_user_id = ?
  `);
  const conv = stmt.get(conversationId, userId);
  if (!conv) return null;

  // Fetch messages
  const msgStmt = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? AND owner_user_id = ? ORDER BY created_at ASC
  `);
  const messages = msgStmt.all(conversationId, userId);

  return {
    ...conv,
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      requestId: m.request_id,
      model: m.model,
      metadata: m.metadata_json ? JSON.parse(m.metadata_json) : {},
      createdAt: m.created_at
    }))
  };
}

function listUserConversations(userId, workspaceId = null) {
  const stmt = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
           (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
    FROM conversations c
    WHERE c.owner_user_id = ? AND c.archived_at IS NULL
    ORDER BY c.updated_at DESC
  `);
  return stmt.all(userId);
}

function updateConversation(userId, conversationId, { title, activeSapContextId, selectedRole, archived }) {
  const existing = db.prepare('SELECT * FROM conversations WHERE id = ? AND owner_user_id = ?').get(conversationId, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const archivedAt = archived ? now : (archived === false ? null : existing.archived_at);

  db.prepare(`
    UPDATE conversations SET
      title = COALESCE(?, title),
      active_sap_context_id = COALESCE(?, active_sap_context_id),
      selected_role = COALESCE(?, selected_role),
      archived_at = ?,
      updated_at = ?
    WHERE id = ? AND owner_user_id = ?
  `).run(title || null, activeSapContextId || null, selectedRole || null, archivedAt, now, conversationId, userId);

  return getConversation(userId, conversationId);
}

function deleteConversation(userId, conversationId) {
  const stmt = db.prepare('DELETE FROM conversations WHERE id = ? AND owner_user_id = ?');
  const result = stmt.run(conversationId, userId);
  return result.changes > 0;
}

function appendMessage(userId, conversationId, { role, content, metadata, requestId, model }) {
  // Verify ownership
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND owner_user_id = ?').get(conversationId, userId);
  if (!conv) throw new Error('Conversation not found or unauthorized');

  const id = generateId('msg');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, owner_user_id, role, content, metadata_json, request_id, model, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, conversationId, userId, role, content,
    metadata ? JSON.stringify(metadata) : null,
    requestId || null, model || 'gemini-3.5-flash-lite', now
  );

  // Auto-update conversation title if it's the first user message and has default title
  if (role === 'user' && (conv.title === 'New SAP Investigation' || conv.title.startsWith('New '))) {
    const newTitle = content.slice(0, 48).trim() + (content.length > 48 ? '...' : '');
    db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(newTitle, now, conversationId);
  } else {
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);
  }

  return { id, conversationId, role, content, requestId, model, metadata: metadata || {}, createdAt: now };
}

// ── Documents Management (Tier 2 User-Scoped) ───────────────────────────────

function chunkDocumentSections(docId, userId, filename, version, text) {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = { title: 'General Overview', content: '' };
  let sectionIndex = 1;

  for (const line of lines) {
    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection.content.trim()) {
        sections.push({
          id: generateId('sec'),
          documentId: docId,
          ownerUserId: userId,
          citationId: `DOC-${docId}-SEC-${sectionIndex++}`,
          title: currentSection.title,
          content: currentSection.content.trim()
        });
      }
      currentSection = { title: line.replace(/^#+\s*/, '').trim(), content: '' };
    } else {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection.content.trim()) {
    sections.push({
      id: generateId('sec'),
      documentId: docId,
      ownerUserId: userId,
      citationId: `DOC-${docId}-SEC-${sectionIndex++}`,
      title: currentSection.title,
      content: currentSection.content.trim()
    });
  }

  return sections;
}

function insertUserDocument(userId, { filename, version, content, product, release, isRestricted = 0, workspaceId }) {
  const user = getUserById(userId);
  const docId = generateId('doc');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO documents (id, owner_user_id, workspace_id, filename, version, product, release, is_restricted, storage_reference, upload_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    docId, userId, workspaceId || user.workspace_id,
    filename, version || '1.0',
    product || 'Enterprise SAP Implementation',
    release || 'Customer Landscape Specific',
    isRestricted ? 1 : 0, `db://${docId}`, now
  );

  const sections = chunkDocumentSections(docId, userId, filename, version || '1.0', content);
  const secStmt = db.prepare(`
    INSERT INTO document_sections (id, document_id, owner_user_id, citation_id, title, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const sec of sections) {
    secStmt.run(sec.id, docId, userId, sec.citationId, sec.title, sec.content);
  }

  return {
    id: docId,
    filename,
    version: version || '1.0',
    sectionCount: sections.length,
    uploadTimestamp: now
  };
}

function listUserDocuments(userId) {
  const stmt = db.prepare(`
    SELECT d.*, COUNT(s.id) as section_count
    FROM documents d
    LEFT JOIN document_sections s ON d.id = s.document_id
    WHERE d.owner_user_id = ? AND d.deleted_at IS NULL
    GROUP BY d.id
    ORDER BY d.upload_timestamp DESC
  `);
  return stmt.all(userId);
}

function getUserDocumentById(userId, docId) {
  const stmt = db.prepare(`
    SELECT * FROM documents WHERE id = ? AND owner_user_id = ? AND deleted_at IS NULL
  `);
  const doc = stmt.get(docId, userId);
  if (!doc) return null;

  const secStmt = db.prepare(`
    SELECT * FROM document_sections WHERE document_id = ? AND owner_user_id = ?
  `);
  const sections = secStmt.all(docId, userId);

  return { ...doc, sections };
}

function deleteUserDocument(userId, docId) {
  const stmt = db.prepare('UPDATE documents SET deleted_at = ? WHERE id = ? AND owner_user_id = ?');
  const result = stmt.run(new Date().toISOString(), docId, userId);
  return result.changes > 0;
}

function searchUserDocuments(userId, queryText, permissionLevel = 'standard') {
  if (!queryText) return [];
  const queryLower = queryText.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(w => w.length > 3);

  const stmt = db.prepare(`
    SELECT s.citation_id, s.title as section_title, s.content, d.id as doc_id, d.filename, d.release, d.product, d.is_restricted, d.upload_timestamp
    FROM document_sections s
    JOIN documents d ON s.document_id = d.id
    WHERE s.owner_user_id = ? AND d.deleted_at IS NULL
  `);
  const allSections = stmt.all(userId);
  const matched = [];

  for (const sec of allSections) {
    const secLower = (sec.section_title + ' ' + sec.content).toLowerCase();
    let hits = 0;
    for (const token of queryTokens) {
      if (secLower.includes(token)) hits++;
    }

    if (hits >= 1 || queryLower.includes(sec.filename.toLowerCase())) {
      const isRestrictedDoc = sec.is_restricted === 1 || sec.filename.toLowerCase().includes('confidential') || sec.filename.toLowerCase().includes('security');
      const isAuthorized = !(permissionLevel === 'restricted' && isRestrictedDoc);

      matched.push({
        citationId: sec.citation_id,
        id: `${sec.doc_id}:${sec.citation_id}`,
        title: `User Document: ${sec.filename} (${sec.section_title})`,
        tier: 'Tier 2 — User-Provided Enterprise Source',
        product: sec.product || 'Enterprise Implementation Document',
        release: sec.release || 'User-Specified Release Context',
        url: `document://${sec.doc_id}#${encodeURIComponent(sec.section_title)}`,
        status: 'Verified user-provided document',
        excerpt: isAuthorized ? (sec.content.slice(0, 300) + (sec.content.length > 300 ? '...' : '')) : '[REDACTED: User role lacks authorization to inspect this document]',
        authorized: isAuthorized,
        readStatus: true,
        timestamp: sec.upload_timestamp
      });
    }
  }

  return matched;
}

// ── SAP Contexts Management ─────────────────────────────────────────────────

function listUserContexts(userId) {
  const stmt = db.prepare('SELECT * FROM sap_contexts WHERE owner_user_id = ? ORDER BY created_at ASC');
  return stmt.all(userId);
}

function createUserContext(userId, ctxData) {
  const user = getUserById(userId);
  const id = ctxData.id || generateId('ctx');
  const now = new Date().toISOString();

  const isFav = ctxData.is_favorite || ctxData.isFavorite ? 1 : 0;
  const releaseLvl = ctxData.releaseLevel || ctxData.release_level || ctxData.release || 'S/4HANA 2023';
  const arch = ctxData.architecture || ctxData.deployment || 'Embedded EWM';

  const stmt = db.prepare(`
    INSERT INTO sap_contexts (
      id, owner_user_id, workspace_id, name, product, deployment, client, plant, warehouse, psa,
      staging_method, integration_technology, environment, ewm_pp_version, release_level, architecture,
      is_favorite, is_archived, notes, source_of_context, support_package_level, last_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, userId, user ? user.workspace_id : 'ws-enterprise-default',
    ctxData.name, ctxData.product || 'SAP S/4HANA', arch,
    ctxData.client || '100', ctxData.plant || '1010', ctxData.warehouse || ctxData.warehouseNumber || 'W01',
    ctxData.psa || 'PSA-01', ctxData.stagingMethod || 'PMR',
    ctxData.integrationTechnology || 'Direct S/4 Service + bgRFC',
    ctxData.environment || 'Production', releaseLvl, releaseLvl, arch,
    isFav, ctxData.notes || '', ctxData.sourceOfContext || 'user_configured',
    ctxData.supportPackageLevel || 'FPS02', now, now, now
  );

  if (isFav === 1 && user) {
    db.prepare('UPDATE users SET favorite_context_id = ? WHERE id = ?').run(id, userId);
  }

  return db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(id, userId);
}

// ── Investigations Management ───────────────────────────────────────────────

function listUserInvestigations(userId) {
  const stmt = db.prepare('SELECT * FROM investigations WHERE owner_user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    status: r.status,
    severity: r.severity,
    businessImpact: r.business_impact,
    affectedProcess: r.affected_process,
    environment: r.environment,
    landscapeName: r.landscape_name,
    symptoms: r.symptoms,
    hypotheses: r.hypotheses_json ? JSON.parse(r.hypotheses_json) : [],
    checklist: r.checklist_json ? JSON.parse(r.checklist_json) : [],
    tcodes: r.tcodes_json ? JSON.parse(r.tcodes_json) : [],
    evidence: r.evidence_json ? JSON.parse(r.evidence_json) : [],
    owner: r.owner_name,
    comments: r.comments_json ? JSON.parse(r.comments_json) : [],
    createdAt: r.created_at
  }));
}

function getUserInvestigation(userId, invId) {
  const stmt = db.prepare('SELECT * FROM investigations WHERE id = ? AND owner_user_id = ?');
  const r = stmt.get(invId, userId);
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    severity: r.severity,
    businessImpact: r.business_impact,
    affectedProcess: r.affected_process,
    environment: r.environment,
    landscapeName: r.landscape_name,
    symptoms: r.symptoms,
    hypotheses: r.hypotheses_json ? JSON.parse(r.hypotheses_json) : [],
    checklist: r.checklist_json ? JSON.parse(r.checklist_json) : [],
    tcodes: r.tcodes_json ? JSON.parse(r.tcodes_json) : [],
    evidence: r.evidence_json ? JSON.parse(r.evidence_json) : [],
    owner: r.owner_name,
    comments: r.comments_json ? JSON.parse(r.comments_json) : [],
    createdAt: r.created_at
  };
}

function createUserInvestigation(userId, inv) {
  const user = getUserById(userId);
  const id = inv.id || 'NX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO investigations (
      id, owner_user_id, workspace_id, title, status, severity, business_impact,
      affected_process, environment, landscape_name, symptoms, hypotheses_json,
      checklist_json, tcodes_json, evidence_json, owner_name, comments_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, userId, user.workspace_id,
    inv.title, inv.status || 'In Progress', inv.severity || 'Medium',
    inv.businessImpact || '', inv.affectedProcess || 'SAP Integration & Staging',
    inv.environment || 'ctx-prd-pp', inv.landscapeName || 'S/4HANA 2023 · Embedded EWM',
    inv.symptoms || '', JSON.stringify(inv.hypotheses || []),
    JSON.stringify(inv.checklist || []), JSON.stringify(inv.tcodes || ['SMQ2']),
    JSON.stringify(inv.evidence || ['SAP-1']), inv.owner || user.displayName,
    JSON.stringify(inv.comments || []), now, now
  );

  return getUserInvestigation(userId, id);
}

function addInvestigationComment(userId, invId, comment) {
  const inv = getUserInvestigation(userId, invId);
  if (!inv) return null;
  const comments = inv.comments || [];
  comments.push({ ...comment, timestamp: new Date().toISOString() });

  db.prepare('UPDATE investigations SET comments_json = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?')
    .run(JSON.stringify(comments), new Date().toISOString(), invId, userId);

  return comments;
}

// ── Action Cards & Approvals Management ─────────────────────────────────────

function listUserActions(userId) {
  const stmt = db.prepare('SELECT * FROM action_drafts WHERE owner_user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId);
  return rows.map(r => ({
    id: r.id,
    investigationId: r.investigation_id,
    name: r.name,
    purpose: r.purpose,
    riskLevel: r.risk_level,
    status: r.status,
    targetEnvironment: r.target_environment,
    steps: r.steps_json ? JSON.parse(r.steps_json) : [],
    rollbackPlan: r.rollback_plan,
    approver: r.approver,
    approvedAt: r.approved_at
  }));
}

function approveAction(userId, actionId) {
  const stmt = db.prepare('SELECT * FROM action_drafts WHERE id = ? AND owner_user_id = ?');
  const action = stmt.get(actionId, userId);
  if (!action) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE action_drafts SET
      status = 'Approved (Connector Execution Blocked - Live Connector Unavailable)',
      approver = 'Operations Lead (Audited)',
      approved_at = ?,
      updated_at = ?
    WHERE id = ? AND owner_user_id = ?
  `).run(now, now, actionId, userId);

  return db.prepare('SELECT * FROM action_drafts WHERE id = ? AND owner_user_id = ?').get(actionId, userId);
}

// ── Audit Logs ──────────────────────────────────────────────────────────────

function recordAuditLog({ userId, workspaceId, requestId, conversationId, actionType, model, userPrompt, sourcesSearchedCount, sourcesRetrievedCount, sourcesRetrieved, citationIds, sourceTier, blockedEvents, latencyMs, status, errorMessage }) {
  const id = generateId('aud');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, owner_user_id, workspace_id, request_id, conversation_id, action_type,
      model, user_prompt, sources_searched_count, sources_retrieved_count,
      sources_retrieved_json, citation_ids_json, source_tier, blocked_events_json,
      latency_ms, status, error_message, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, userId || null, workspaceId || null, requestId || null, conversationId || null,
    actionType || 'CHAT_INFERENCE', model || 'gemini-3.5-flash-lite',
    userPrompt ? userPrompt.slice(0, 300) : null,
    sourcesSearchedCount || 0, sourcesRetrievedCount || 0,
    sourcesRetrieved ? JSON.stringify(sourcesRetrieved) : null,
    citationIds ? JSON.stringify(citationIds) : null,
    sourceTier || 'Tier 3 General Model Knowledge',
    blockedEvents ? JSON.stringify(blockedEvents) : null,
    latencyMs || 0, status || 200, errorMessage || null, now
  );
}

function listUserAuditLogs(userId, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM audit_logs WHERE owner_user_id = ? ORDER BY timestamp DESC LIMIT ?
  `);
  const rows = stmt.all(userId, limit);
  return rows.map(r => ({
    id: r.id,
    requestId: r.request_id,
    conversationId: r.conversation_id,
    actionType: r.action_type,
    model: r.model,
    userPrompt: r.user_prompt,
    sourcesSearchedCount: r.sources_searched_count,
    sourcesRetrievedCount: r.sources_retrieved_count,
    sourcesRetrieved: r.sources_retrieved_json ? JSON.parse(r.sources_retrieved_json) : [],
    citationIds: r.citation_ids_json ? JSON.parse(r.citation_ids_json) : [],
    sourceTier: r.source_tier,
    blockedEvents: r.blocked_events_json ? JSON.parse(r.blocked_events_json) : [],
    latencyMs: r.latency_ms,
    status: r.status,
    errorMessage: r.error_message,
    timestamp: r.timestamp
  }));
}

// ── Default Seed Helper ─────────────────────────────────────────────────────

function seedUserDefaults(userId, workspaceId, userName) {
  const now = new Date().toISOString();

  // 1. Seed standard SAP Contexts for user
  const defaultContexts = [
    {
      id: 'ctx-dev-emb',
      name: 'Development S/4HANA Embedded EWM',
      product: 'SAP S/4HANA 2023 FPS02',
      deployment: 'Embedded EWM',
      client: '100',
      plant: '1010',
      warehouse: 'W01',
      psa: 'PSA-01',
      stagingMethod: 'PMR (Production Material Request)',
      integrationTechnology: 'Direct S/4 Service + bgRFC',
      environment: 'Development'
    },
    {
      id: 'ctx-qa-dec',
      name: 'Quality Decentralized EWM',
      product: 'SAP S/4HANA 2022',
      deployment: 'Decentralized EWM on S/4HANA',
      client: '200',
      plant: '2010',
      warehouse: 'W02',
      psa: 'PSA-02',
      stagingMethod: 'PMR via qRFC',
      integrationTechnology: 'Classic qRFC (SMQ1/SMQ2)',
      environment: 'Quality Assurance'
    },
    {
      id: 'ctx-prd-pp',
      name: 'Production PP-EWM Manufacturing',
      product: 'SAP S/4HANA 2023 FPS01',
      deployment: 'Embedded EWM',
      client: '500',
      plant: '1000',
      warehouse: 'P01',
      psa: 'PSA-PROD',
      stagingMethod: 'PMR (Pick Parts & Release Order Parts)',
      integrationTechnology: 'Modern bgRFC (SBGRFCMON)',
      environment: 'Production'
    }
  ];

  const ctxStmt = db.prepare(`
    INSERT OR IGNORE INTO sap_contexts (id, owner_user_id, workspace_id, name, product, deployment, client, plant, warehouse, psa, staging_method, integration_technology, environment, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of defaultContexts) {
    ctxStmt.run(c.id, userId, workspaceId, c.name, c.product, c.deployment, c.client, c.plant, c.warehouse, c.psa, c.stagingMethod, c.integrationTechnology, c.environment, now, now);
  }

  // 2. Seed Default Investigation
  const defaultInv = {
    id: 'NX-2025-0847',
    title: 'SMQ2 Queue Backlog in EWM Production Landscape',
    status: 'In Progress',
    severity: 'Critical',
    businessImpact: 'High — 4,218 stuck qRFC entries under WM_STG_*. Production staging delayed.',
    affectedProcess: 'PP-EWM Staging (Advanced Production Integration)',
    environment: 'ctx-prd-pp',
    landscapeName: 'S/4HANA 2023 FPS01 · Embedded EWM (Client 500)',
    symptoms: 'Inbound qRFC queues in transaction SMQ2 entered backlog state with status SYSFAIL and function module /SCWM/INB_DELIVERY_CONFIRM.',
    hypotheses: [
      { id: 'hyp-1', statement: 'RFC destination group thread saturation during peak shifts', confidence: 'High', status: 'Verified' },
      { id: 'hyp-2', statement: 'Missing PSA Control cycle in /SCWM/PSA_CC for Component C-102', confidence: 'Medium', status: 'Pending Verification' },
      { id: 'hyp-3', statement: 'Lock collision during simultaneous ERP Goods Issue posting', confidence: 'Low', status: 'Open' }
    ],
    checklist: [
      { step: 'Inspect Queue Error Detail in SMQ2', done: true },
      { step: 'Cross-Reference ABAP Short Dumps in ST22', done: true },
      { step: 'Verify PSA assignment in Work Center CR02', done: false },
      { step: 'Execute Monitored Queue Re-Activation via SMQR', done: false }
    ],
    tcodes: ['SMQ2', 'SMQR', 'ST22', '/SCWM/MON', 'CR02'],
    evidence: ['SAP-1', 'SAP-2', 'SAP-NOTE-2871625', 'SOP-1'],
    owner: userName,
    comments: [
      { author: 'Lead Basis Admin', text: 'Confirmed 4,218 queues stuck. Enforcing read-only diagnostic mode.', timestamp: now },
      { author: 'EWM Consultant', text: 'Checked ST22 dumps, identifying lock collision. DO NOT delete queues.', timestamp: now }
    ]
  };

  db.prepare(`
    INSERT OR IGNORE INTO investigations (
      id, owner_user_id, workspace_id, title, status, severity, business_impact,
      affected_process, environment, landscape_name, symptoms, hypotheses_json,
      checklist_json, tcodes_json, evidence_json, owner_name, comments_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    defaultInv.id, userId, workspaceId, defaultInv.title, defaultInv.status,
    defaultInv.severity, defaultInv.businessImpact, defaultInv.affectedProcess,
    defaultInv.environment, defaultInv.landscapeName, defaultInv.symptoms,
    JSON.stringify(defaultInv.hypotheses), JSON.stringify(defaultInv.checklist),
    JSON.stringify(defaultInv.tcodes), JSON.stringify(defaultInv.evidence),
    defaultInv.owner, JSON.stringify(defaultInv.comments), now, now
  );

  // 3. Seed Default Action Cards
  const defaultActions = [
    {
      id: 'act-draft-001',
      investigationId: 'NX-2025-0847',
      name: 'Execute Read-Only PMR Diagnostic Run',
      purpose: 'Inspect /SCWM/MON and /SCWM/PSA_CC without making transactional updates',
      riskLevel: 'Read-only / Safe',
      status: 'Review',
      targetEnvironment: 'Production (Client 500)',
      steps: [
        'Execute /SCWM/MON -> Inbound Documents -> PMR',
        'Display control cycle /SCWM/PSA_CC for Material C-102'
      ],
      rollbackPlan: 'No state modified (read-only query)',
      approver: null
    },
    {
      id: 'act-draft-002',
      investigationId: 'NX-2025-0847',
      name: 'Delete Stuck Production Queue in SMQ2',
      purpose: 'Remove blocked RFC LUW queue entry',
      riskLevel: 'Production-impacting / Destructive',
      status: 'Approval required',
      targetEnvironment: 'Production (Client 500)',
      steps: ['Select queue in SMQ2 and execute Delete'],
      rollbackPlan: 'Queue entry cannot be recovered after deletion',
      approver: 'Pending Operations Lead Sign-off'
    }
  ];

  const actStmt = db.prepare(`
    INSERT OR IGNORE INTO action_drafts (id, investigation_id, owner_user_id, workspace_id, name, purpose, risk_level, status, target_environment, steps_json, rollback_plan, approver, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of defaultActions) {
    actStmt.run(a.id, a.investigationId, userId, workspaceId, a.name, a.purpose, a.riskLevel, a.status, a.targetEnvironment, JSON.stringify(a.steps), a.rollbackPlan, a.approver, now, now);
  }

  // 4. Seed Welcome Notification
  createNotification(userId, {
    type: 'info',
    title: 'Welcome to Nexus Enterprise Copilot',
    message: 'Your isolated multi-user workspace is active in read-only diagnostic mode.',
    relatedResourceType: 'workspace',
    relatedResourceId: workspaceId,
    workspaceId
  });
}

// ── Onboarding & Extended Profile ──────────────────────────────────────────

function saveUserOnboarding(userId, { role, sapAreas, primaryGoals, favoriteContextId, contextName, release, architecture, plant, warehouseNumber }) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  const now = new Date().toISOString();

  let favCtxId = favoriteContextId || null;
  if (contextName) {
    const ctx = createUserContext(userId, {
      name: contextName,
      product: 'SAP S/4HANA',
      releaseLevel: release || 'S/4HANA 2023 FPS02',
      architecture: architecture || 'Embedded EWM',
      plant: plant || '1000',
      warehouseNumber: warehouseNumber || 'WH01',
      is_favorite: 1
    });
    favCtxId = ctx.id;
  }

  db.prepare(`
    UPDATE users SET
      role = COALESCE(?, role),
      onboarding_completed = 1,
      sap_areas_json = ?,
      primary_goals_json = ?,
      favorite_context_id = COALESCE(?, favorite_context_id),
      last_active_at = ?
    WHERE id = ?
  `).run(
    role || null,
    JSON.stringify(sapAreas || []),
    JSON.stringify(primaryGoals || []),
    favCtxId,
    now,
    userId
  );

  return getUserProfile(userId);
}

function getUserProfile(userId) {
  const raw = getUserById(userId);
  if (!raw) return null;

  let sapAreas = [];
  let primaryGoals = [];
  try { sapAreas = JSON.parse(raw.sap_areas_json || '[]'); } catch(e) {}
  try { primaryGoals = JSON.parse(raw.primary_goals_json || '[]'); } catch(e) {}

  return {
    ...raw,
    onboardingCompleted: !!raw.onboarding_completed,
    sapAreas,
    primaryGoals,
    favoriteContextId: raw.favorite_context_id || null
  };
}

// ── Enhanced SAP Context Profiles ──────────────────────────────────────────

function updateUserContext(userId, contextId, updates) {
  const existing = db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(contextId, userId);
  if (!existing) return null;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE sap_contexts SET
      name = COALESCE(?, name),
      product = COALESCE(?, product),
      deployment = COALESCE(?, deployment),
      client = COALESCE(?, client),
      plant = COALESCE(?, plant),
      warehouse = COALESCE(?, warehouse),
      psa = COALESCE(?, psa),
      staging_method = COALESCE(?, staging_method),
      integration_technology = COALESCE(?, integration_technology),
      environment = COALESCE(?, environment),
      ewm_pp_version = COALESCE(?, ewm_pp_version),
      release_level = COALESCE(?, release_level),
      architecture = COALESCE(?, architecture),
      notes = COALESCE(?, notes),
      source_of_context = COALESCE(?, source_of_context),
      support_package_level = COALESCE(?, support_package_level),
      updated_at = ?
    WHERE id = ? AND owner_user_id = ?
  `).run(
    updates.name || null,
    updates.product || null,
    updates.deployment || null,
    updates.client || null,
    updates.plant || null,
    updates.warehouse || null,
    updates.psa || null,
    updates.stagingMethod || updates.staging_method || null,
    updates.integrationTechnology || updates.integration_technology || null,
    updates.environment || null,
    updates.ewmPpVersion || updates.ewm_pp_version || null,
    updates.releaseLevel || updates.release_level || null,
    updates.architecture || null,
    updates.notes || null,
    updates.sourceOfContext || updates.source_of_context || null,
    updates.supportPackageLevel || updates.support_package_level || null,
    now,
    contextId,
    userId
  );

  return db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(contextId, userId);
}

function favoriteContext(userId, contextId) {
  const target = db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(contextId, userId);
  if (!target) return null;
  const nextVal = target.is_favorite ? 0 : 1;
  db.prepare('UPDATE sap_contexts SET is_favorite = ? WHERE id = ? AND owner_user_id = ?').run(nextVal, contextId, userId);
  if (nextVal === 1) {
    db.prepare('UPDATE users SET favorite_context_id = ? WHERE id = ?').run(contextId, userId);
  }
  return { ...target, is_favorite: nextVal };
}

function archiveContext(userId, contextId) {
  const target = db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(contextId, userId);
  if (!target) return null;
  const nextVal = target.is_archived ? 0 : 1;
  db.prepare('UPDATE sap_contexts SET is_archived = ? WHERE id = ? AND owner_user_id = ?').run(nextVal, contextId, userId);
  return { ...target, is_archived: nextVal };
}

function duplicateContext(userId, contextId) {
  const target = db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(contextId, userId);
  if (!target) return null;
  const newId = generateId('ctx');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sap_contexts (
      id, owner_user_id, workspace_id, name, product, deployment, client, plant, warehouse, psa,
      staging_method, integration_technology, environment, ewm_pp_version, release_level, architecture,
      is_favorite, is_archived, notes, source_of_context, support_package_level, last_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)
  `).run(
    newId, userId, target.workspace_id, `${target.name} (Copy)`, target.product, target.deployment,
    target.client, target.plant, target.warehouse, target.psa, target.staging_method, target.integration_technology,
    target.environment, target.ewm_pp_version, target.release_level, target.architecture, target.notes,
    target.source_of_context || 'user_provided', target.support_package_level, target.last_verified_at, now, now
  );

  return db.prepare('SELECT * FROM sap_contexts WHERE id = ? AND owner_user_id = ?').get(newId, userId);
}

function deleteUserContext(userId, contextId) {
  const stmt = db.prepare('DELETE FROM sap_contexts WHERE id = ? AND owner_user_id = ?');
  const res = stmt.run(contextId, userId);
  return res.changes > 0;
}

// ── Personal Knowledge Library ─────────────────────────────────────────────

function saveKnowledgeItem(userId, data) {
  const itemType = data.itemType || data.type || 'saved_answer';
  const title = data.title;
  const content = data.content;
  const citationId = data.citationId || data.citation_id || null;
  let tags = data.tags || [];
  if (typeof tags === 'string') {
    tags = tags.split(',').map(s => s.trim()).filter(Boolean);
  }
  const sapProduct = data.sapProduct || data.sap_product || 'SAP S/4HANA';
  const sapRelease = data.sapRelease || data.sap_release || '2023';
  const sapArchitecture = data.sapArchitecture || data.sap_architecture || 'Embedded EWM';
  const provenanceType = data.provenanceType || data.provenance_type || 'official';
  const sourceConversationId = data.sourceConversationId || data.source_conversation_id || null;
  const sourceMessageId = data.sourceMessageId || data.source_message_id || null;
  const workspaceId = data.workspaceId || 'ws-enterprise-default';

  if (!title || !content) throw new Error('Title and content are required');
  const id = generateId('knw');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO saved_items (
      id, owner_user_id, workspace_id, item_type, title, content, citation_id,
      tags_json, sap_product, sap_release, sap_architecture, provenance_type,
      source_conversation_id, source_message_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, workspaceId, itemType, title, content, citationId,
    JSON.stringify(tags || []), sapProduct, sapRelease, sapArchitecture,
    provenanceType, sourceConversationId, sourceMessageId, now, now
  );

  return getKnowledgeItem(userId, id);
}

function listUserKnowledge(userId, filter = {}) {
  let query = 'SELECT * FROM saved_items WHERE owner_user_id = ?';
  const params = [userId];

  if (filter.itemType) {
    query += ' AND item_type = ?';
    params.push(filter.itemType);
  }
  if (filter.sapProduct) {
    query += ' AND sap_product LIKE ?';
    params.push(`%${filter.sapProduct}%`);
  }
  if (filter.provenanceType) {
    query += ' AND provenance_type = ?';
    params.push(filter.provenanceType);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);

  return rows.map(r => {
    let tags = [];
    try { tags = JSON.parse(r.tags_json || '[]'); } catch(e) {}
    return { ...r, tags };
  });
}

function getKnowledgeItem(userId, itemId) {
  const row = db.prepare('SELECT * FROM saved_items WHERE id = ? AND owner_user_id = ?').get(itemId, userId);
  if (!row) return null;
  let tags = [];
  try { tags = JSON.parse(row.tags_json || '[]'); } catch(e) {}
  return { ...row, tags };
}

function updateKnowledgeItem(userId, itemId, updates) {
  const existing = getKnowledgeItem(userId, itemId);
  if (!existing) return null;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE saved_items SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      tags_json = COALESCE(?, tags_json),
      sap_product = COALESCE(?, sap_product),
      sap_release = COALESCE(?, sap_release),
      updated_at = ?
    WHERE id = ? AND owner_user_id = ?
  `).run(
    updates.title || null,
    updates.content || null,
    updates.tags ? JSON.stringify(updates.tags) : null,
    updates.sapProduct || null,
    updates.sapRelease || null,
    now,
    itemId,
    userId
  );

  return getKnowledgeItem(userId, itemId);
}

function deleteKnowledgeItem(userId, itemId) {
  const res = db.prepare('DELETE FROM saved_items WHERE id = ? AND owner_user_id = ?').run(itemId, userId);
  return res.changes > 0;
}

// ── Investigation Templates Registry ───────────────────────────────────────

const INVESTIGATION_TEMPLATES = [
  {
    id: 'tmpl-smq2-sysfail',
    title: 'Stuck SMQ2 qRFC Inbound Queue (SYSFAIL) in S/4HANA EWM',
    objective: 'Safely diagnose and resolve SYSFAIL errors on inbound staging queues without destructive queue purges.',
    category: 'Basis',
    defaultSeverity: 'Critical',
    sapProduct: 'SAP S/4HANA & EWM',
    requiredContext: 'Queue Name (e.g. WM_STG_*), Client, Target Landscape, Error Trace',
    checklist: [
      'Inspect exact short dump error in transaction SMQ2',
      'Cross-reference MESSAGE_TYPE_X in ST22 at timestamp of queue stop',
      'Verify SMQR scheduler queue prefix registration and max runtime parameters',
      'Execute monitored activation in non-peak window'
    ],
    tcodes: ['SMQ2', 'SMQR', 'ST22', 'SM59', 'RZ12'],
    suggestedQuestions: [
      'What causes SYSFAIL status on WM_STG queues during parallel staging?',
      'How to configure SMQR and RZ12 parallel destination groups safely?'
    ],
    safetyWarning: 'CRITICAL GUARDRAIL: Never delete queues directly in SMQ2 production. Deletion causes permanent ERP-EWM document divergence.'
  },
  {
    id: 'tmpl-missing-pmr',
    title: 'Missing Production Material Request (PMR) in S/4HANA EWM',
    objective: 'Investigate missing or un-replicated PMR from SAP PP to Embedded or Decentralized EWM.',
    category: 'PP',
    defaultSeverity: 'High',
    sapProduct: 'SAP S/4HANA & EWM',
    requiredContext: 'Production Order Number, Plant, PSA, EWM Warehouse Number',
    checklist: [
      'Check production order release status in CO03',
      'Verify PSA assignment in Control Cycle (LPK3 / /SCWM/PSA_CC)',
      'Inspect inbound queue in /SCWM/MON -> Tools -> Message Queue',
      'Check qRFC monitor (SMQ2) for blocked /SCWM/ queue entries'
    ],
    tcodes: ['CO03', '/SCWM/PMR', 'SMQ2', '/SCWM/MON', 'SLG1'],
    suggestedQuestions: [
      'Why is the PMR not visible in /SCWM/PMR after releasing the order in PP?',
      'How to re-trigger PMR distribution without cancelling the order in PP?'
    ],
    safetyWarning: 'Do NOT delete SMQ2 queues directly in production. Use /SCWM/MON retry routines.'
  },
  {
    id: 'tmpl-bgrfc-migration',
    title: 'bgRFC vs qRFC Integration Architecture & Destination Diagnostics',
    objective: 'Verify supervisor destination and background RFC registration in S/4HANA Embedded topologies.',
    category: 'Basis',
    defaultSeverity: 'Medium',
    sapProduct: 'SAP NetWeaver & S/4HANA ABAP Platform',
    requiredContext: 'Destination Name, Supervisor Destination BGRFC_SUPERVISOR, Inbound Destination',
    checklist: [
      'Execute transaction SBGRFPCUST to confirm supervisor destination configuration',
      'Validate inbound destination EWM_BGRFC_IN lock duration and scheduler limits',
      'Monitor active bgRFC units via transaction SBGRFCMON',
      'Verify authorization objects S_RFC and S_BGRFC'
    ],
    tcodes: ['SBGRFPCUST', 'SBGRFCMON', 'SM59', 'SU01', 'SMQ2'],
    suggestedQuestions: [
      'What is the difference between classic qRFC (SMQ2) and bgRFC in S/4HANA Embedded EWM?',
      'How to diagnose stalled bgRFC units in transaction SBGRFCMON?'
    ],
    safetyWarning: 'Avoid mixing qRFC queue purge routines with modern bgRFC units in embedded topologies.'
  },
  {
    id: 'tmpl-psa-control-cycle',
    title: 'Production Supply Area (PSA) Control Cycle & Derivation Mismatch',
    objective: 'Diagnose component staging derivation failures between Work Centers and EWM PSA bins.',
    category: 'EWM',
    defaultSeverity: 'High',
    sapProduct: 'SAP S/4HANA EWM',
    requiredContext: 'Plant, Work Center (CR02), Production Supply Area, Material Number',
    checklist: [
      'Inspect Work Center supply area assignment in transaction CR02 / CR03',
      'Verify EWM Control Cycle existence in transaction /SCWM/PSA_CC',
      'Confirm staging indicator (Pick Parts vs Release Order Parts vs Crate Parts)',
      'Validate destination staging storage bin mapping in /SCWM/MON'
    ],
    tcodes: ['/SCWM/PSA_CC', 'CR02', 'CR03', 'CS03', '/SCWM/MON'],
    suggestedQuestions: [
      'Why does /SCWM/STAGE fail to derive the target PSA bin for BOM items?',
      'How do control cycle settings differ between classic LPK1 and modern /SCWM/PSA_CC?'
    ],
    safetyWarning: 'Updating control cycles requires coordination with ongoing production orders.'
  },
  {
    id: 'tmpl-staging-delay',
    title: 'Production Staging /SCWM/STAGE Calculation & Stock Deficit Error',
    objective: 'Analyze delays and stock deficits during component staging from warehouse bins to PSA.',
    category: 'EWM',
    defaultSeverity: 'High',
    sapProduct: 'SAP EWM 2023',
    requiredContext: 'Warehouse Number, Source Storage Type, Destination PSA Bin, Material Number',
    checklist: [
      'Inspect Warehouse Task (/SCWM/TO) creation for PMR staging item',
      'Check available stock vs physical stock in source bin (/SCWM/MON)',
      'Verify Stock Removal Rule & Storage Type Search Sequence',
      'Check open Wave or Warehouse Order assignment'
    ],
    tcodes: ['/SCWM/MON', '/SCWM/CANVAS', '/SCWM/STAGE', '/SCWM/TO'],
    suggestedQuestions: [
      'Why did warehouse task creation fail for material stock staging?',
      'How to check if wave template was correctly assigned to the PMR?'
    ],
    safetyWarning: 'Ensure stock counts match before overriding warehouse task determination.'
  },
  {
    id: 'tmpl-master-data-review',
    title: 'SAP PP & Discrete Manufacturing Master Data Audit',
    objective: 'Verify end-to-end master data consistency for discrete production orders.',
    category: 'PP',
    defaultSeverity: 'Medium',
    sapProduct: 'SAP S/4HANA PP',
    requiredContext: 'Plant, Material Number, Production Version, BOM Usage, Routing Group',
    checklist: [
      'Validate Material Master MRP 1-4 views and Work Scheduling view (MM03)',
      'Check BOM status and component validities (CS03)',
      'Verify Work Center formula keys and standard value keys (CR03)',
      'Confirm active Production Version validity dates and locks (C223)'
    ],
    tcodes: ['MM03', 'CS03', 'CR03', 'CA03', 'C223'],
    suggestedQuestions: [
      'Which master data objects are mandatory to release a discrete production order?',
      'How does production version selection differ between ECC 6.0 and S/4HANA?'
    ],
    safetyWarning: 'Read-only diagnostic audit. Changes require formal change management approval.'
  },
  {
    id: 'tmpl-delivery-replication',
    title: 'Inbound / Outbound Delivery Replication Failure (LE-EWM)',
    objective: 'Investigate delivery document flow issues between ERP / LE and EWM.',
    category: 'Integration',
    defaultSeverity: 'High',
    sapProduct: 'SAP S/4HANA & EWM',
    requiredContext: 'Outbound Delivery (VL02N) or Inbound Delivery (VL31N), Warehouse Number',
    checklist: [
      'Check LE delivery distribution status in VL03N',
      'Inspect message log in SMQ2 or qRFC monitor',
      'Check /SCWM/PRDO or /SCWM/PRDI for replication errors',
      'Review SLG1 object /SCWM/DELIVERY'
    ],
    tcodes: ['VL03N', '/SCWM/PRDO', '/SCWM/PRDI', 'SMQ2', 'SLG1'],
    suggestedQuestions: [
      'Why is Outbound Delivery document not replicated to /SCWM/PRDO?',
      'How to re-trigger delivery replication safely?'
    ],
    safetyWarning: 'Do not modify delivery quantities in ERP while warehouse processing has begun in EWM.'
  },
  {
    id: 'tmpl-co02-missing-parts',
    title: 'Production Order Missing Components & Staging Backlog (CO02)',
    objective: 'Diagnose missing part stock shortages halting manufacturing execution.',
    category: 'PP',
    defaultSeverity: 'Critical',
    sapProduct: 'SAP S/4HANA PP & EWM',
    requiredContext: 'Production Order Number, Missing Component List, Storage Location',
    checklist: [
      'Perform missing parts check in transaction CO02 / CO24',
      'Verify reservations and ATP check scope in transaction MD04',
      'Inspect open warehouse tasks in /SCWM/MON for missing components',
      'Check stock availability across alternative storage locations'
    ],
    tcodes: ['CO02', 'CO24', 'MD04', '/SCWM/MON', 'MMBE'],
    suggestedQuestions: [
      'Why is component stock reserved but not staged in the PSA?',
      'How to trigger immediate ad-hoc staging for missing parts?'
    ],
    safetyWarning: 'Never bypass ATP checks without supervisor authorization.'
  },
  {
    id: 'tmpl-sm59-rfc-timeout',
    title: 'RFC Destination Timeout & Gateway Throttling (SM59 / SMGW)',
    objective: 'Triage communication timeouts and CPIC errors across RFC destinations.',
    category: 'Basis',
    defaultSeverity: 'High',
    sapProduct: 'SAP NetWeaver Basis',
    requiredContext: 'RFC Destination Name, Target Host, Gateway Host, Gateway Service',
    checklist: [
      'Perform connection test and authorization test in transaction SM59',
      'Check SAP Gateway monitor in transaction SMGW for logged clients',
      'Review system log in transaction SM21 for CPIC communication errors',
      'Verify target system dialog and background work process availability in SM50 / SM66'
    ],
    tcodes: ['SM59', 'SMGW', 'SM21', 'SM50', 'SM66'],
    suggestedQuestions: [
      'What causes TIME_OUT errors during synchronous RFC execution to EWM?',
      'How to adjust gateway client limits in SMGW to prevent thread starvation?'
    ],
    safetyWarning: 'Do not reset active RFC connections during peak batch processing cycles.'
  },
  {
    id: 'tmpl-hu-putaway-discrepancy',
    title: 'Inbound Handling Unit (HU) Putaway Capacity & Bin Block Discrepancy',
    objective: 'Diagnose putaway warehouse task failures due to bin capacity or lock conflicts.',
    category: 'EWM',
    defaultSeverity: 'Medium',
    sapProduct: 'SAP S/4HANA EWM',
    requiredContext: 'Inbound Delivery Number, HU Number, Target Storage Type, Warehouse Number',
    checklist: [
      'Check Handling Unit details and packaging material in /SCWM/MON',
      'Verify Storage Bin capacity check parameters in /SCWM/BINMAT',
      'Confirm Putaway Storage Type Search Strategy customizing in /SCWM/PRDI',
      'Inspect lock table entries in transaction SM12 for target storage bins'
    ],
    tcodes: ['/SCWM/MON', '/SCWM/PRDI', '/SCWM/TO', '/SCWM/BINMAT', 'SM12'],
    suggestedQuestions: [
      'Why does putaway task creation fail with "Storage bin blocked for putaway" error?',
      'How to verify HU type capacity weights in EWM storage types?'
    ],
    safetyWarning: 'Verify physical warehouse inventory before unlocking bins with system discrepancies.'
  }
];

function listInvestigationTemplates() {
  return INVESTIGATION_TEMPLATES;
}

function getInvestigationTemplate(templateId) {
  return INVESTIGATION_TEMPLATES.find(t => t.id === templateId) || null;
}

function instantiateInvestigationFromTemplate(userId, templateId, overrides = {}) {
  const tmpl = getInvestigationTemplate(templateId);
  if (!tmpl) throw new Error('Template not found');
  const user = getUserById(userId);
  const now = new Date().toISOString();
  const caseId = 'NX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  const titleSuffix = overrides.customTitleSuffix ? ` - ${overrides.customTitleSuffix}` : '';
  const title = overrides.title || `${tmpl.title}${titleSuffix} (${caseId})`;

  const invData = {
    id: caseId,
    owner_user_id: userId,
    workspace_id: user?.workspace_id || 'ws-enterprise-default',
    title: title,
    status: 'In Progress',
    severity: overrides.severity || tmpl.defaultSeverity || 'High',
    business_impact: overrides.businessImpact || `Operational bottleneck in ${tmpl.category}`,
    affected_process: tmpl.category,
    environment: overrides.environment || 'Production (S/4HANA 2023)',
    landscape_name: overrides.landscapeName || 'S/4HANA 2023 Embedded EWM',
    symptoms: overrides.symptoms || `Template instantiated investigation for: ${tmpl.objective}`,
    hypotheses: [
      { text: `Primary root cause verification for ${tmpl.title}`, probability: 'High', status: 'Testing' }
    ],
    checklist: tmpl.checklist.map((item, idx) => ({ id: `chk-${idx+1}`, task: item, done: false })),
    tcodes: tmpl.tcodes.map(tc => ({ code: tc, desc: `Diagnostic execution for ${tc}`, role: 'Diagnostic' })),
    evidence: ['SAP-NOTE-3199999', 'SOP-009'],
    owner_name: user?.displayName || user?.email || 'Operations Lead',
    comments: [
      { author: 'Nexus System', text: `Investigation initialized from template "${tmpl.title}". Safe read-only mode engaged.`, timestamp: now }
    ]
  };

  db.prepare(`
    INSERT INTO investigations (
      id, owner_user_id, workspace_id, title, status, severity, business_impact,
      affected_process, environment, landscape_name, symptoms, hypotheses_json,
      checklist_json, tcodes_json, evidence_json, owner_name, comments_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invData.id, invData.owner_user_id, invData.workspace_id, invData.title, invData.status,
    invData.severity, invData.business_impact, invData.affected_process, invData.environment,
    invData.landscape_name, invData.symptoms, JSON.stringify(invData.hypotheses),
    JSON.stringify(invData.checklist), JSON.stringify(invData.tcodes), JSON.stringify(invData.evidence),
    invData.owner_name, JSON.stringify(invData.comments), now, now
  );

  return getUserInvestigation(userId, caseId);
}

// ── Collaboration & Investigation Sharing (Strictly User-Controlled) ────────

function shareInvestigation(ownerUserId, investigationId, targetEmailOrId, permission = 'viewer') {
  const inv = db.prepare('SELECT * FROM investigations WHERE id = ? AND owner_user_id = ?').get(investigationId, ownerUserId);
  if (!inv) throw new Error('Investigation not found or you are not the owner');

  // Lookup target user
  let targetUser = db.prepare('SELECT * FROM users WHERE email = ? OR id = ?').get(targetEmailOrId.toLowerCase().trim(), targetEmailOrId);
  if (!targetUser) throw new Error('Target collaborator user not found in workspace');
  if (targetUser.id === ownerUserId) throw new Error('Cannot share with yourself');

  const shareId = generateId('shr');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO shared_resources (
      id, resource_type, resource_id, owner_user_id, shared_with_user_id, permission, created_at
    ) VALUES (?, 'investigation', ?, ?, ?, ?, ?)
  `).run(shareId, investigationId, ownerUserId, targetUser.id, permission, now);

  // Issue notification to target collaborator
  createNotification(targetUser.id, {
    type: 'shared_investigation',
    title: 'Investigation Shared With You',
    message: `${inv.owner_name || 'A team member'} shared investigation "${inv.title}" with you (${permission} access).`,
    relatedResourceType: 'investigation',
    relatedResourceId: investigationId,
    workspaceId: inv.workspace_id
  });

  return { ok: true, shareId, investigationId, sharedWith: targetUser.email, permission };
}

function listInvestigationCollaborators(ownerUserId, investigationId) {
  const inv = db.prepare('SELECT * FROM investigations WHERE id = ? AND owner_user_id = ?').get(investigationId, ownerUserId);
  if (!inv) return [];

  const rows = db.prepare(`
    SELECT sr.id as share_id, sr.permission, sr.created_at, u.id as user_id, u.email, u.display_name, u.role
    FROM shared_resources sr
    JOIN users u ON sr.shared_with_user_id = u.id
    WHERE sr.resource_type = 'investigation' AND sr.resource_id = ? AND sr.owner_user_id = ?
  `).all(investigationId, ownerUserId);

  return rows;
}

function removeInvestigationCollaborator(ownerUserId, investigationId, targetUserId) {
  const res = db.prepare(`
    DELETE FROM shared_resources
    WHERE resource_type = 'investigation' AND resource_id = ? AND owner_user_id = ? AND shared_with_user_id = ?
  `).run(investigationId, ownerUserId, targetUserId);
  return res.changes > 0;
}

function listSharedWithMeInvestigations(userId) {
  const rows = db.prepare(`
    SELECT i.*, sr.permission as collaborator_permission, sr.created_at as shared_at, u.display_name as shared_by_name, u.email as shared_by_email
    FROM shared_resources sr
    JOIN investigations i ON sr.resource_id = i.id
    JOIN users u ON sr.owner_user_id = u.id
    WHERE sr.shared_with_user_id = ? AND sr.resource_type = 'investigation'
  `).all(userId);

  return rows.map(r => {
    let hypotheses = [];
    let checklist = [];
    let tcodes = [];
    let evidence = [];
    let comments = [];
    try { hypotheses = JSON.parse(r.hypotheses_json || '[]'); } catch(e) {}
    try { checklist = JSON.parse(r.checklist_json || '[]'); } catch(e) {}
    try { tcodes = JSON.parse(r.tcodes_json || '[]'); } catch(e) {}
    try { evidence = JSON.parse(r.evidence_json || '[]'); } catch(e) {}
    try { comments = JSON.parse(r.comments_json || '[]'); } catch(e) {}
    return { 
      ...r, 
      permission: r.collaborator_permission, 
      shared_role: r.collaborator_permission,
      hypotheses, 
      checklist, 
      tcodes, 
      evidence, 
      comments 
    };
  });
}

// ── Notifications Center ───────────────────────────────────────────────────

function createNotification(userId, { type, title, message, relatedResourceType, relatedResourceId, workspaceId = 'ws-enterprise-default' }) {
  const id = generateId('ntf');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO notifications (
      id, user_id, workspace_id, type, title, message,
      related_resource_type, related_resource_id, read_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, userId, workspaceId, type || 'info', title, message, relatedResourceType || null, relatedResourceId || null, now);
  return { id, userId, type, title, message, readStatus: 0, createdAt: now };
}

function listUserNotifications(userId, unreadOnly = false) {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];
  if (unreadOnly) {
    query += ' AND read_status = 0';
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  return db.prepare(query).all(...params);
}

function markNotificationAsRead(userId, notificationId) {
  const res = db.prepare('UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
  return res.changes > 0;
}

function markAllNotificationsAsRead(userId) {
  const res = db.prepare('UPDATE notifications SET read_status = 1 WHERE user_id = ?').run(userId);
  return res.changes > 0;
}

// ── User Feedback & Correction ─────────────────────────────────────────────

function recordUserFeedback(userId, { conversationId, messageId, requestId, rating, feedbackCategory, comments, model, sourceState }) {
  const id = generateId('fdb');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO user_feedback (
      id, owner_user_id, conversation_id, message_id, request_id,
      rating, feedback_category, comments, model, source_state, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, conversationId || null, messageId || null, requestId || null,
    rating || 'helpful', feedbackCategory || 'general', comments || '',
    model || 'gemini-3.5-flash-lite', sourceState || 'standard', now
  );

  return { id, userId, rating, feedbackCategory, createdAt: now };
}

function listUserFeedback(userId) {
  return db.prepare('SELECT * FROM user_feedback WHERE owner_user_id = ? ORDER BY created_at DESC').all(userId);
}

// ── Enterprise Omni-Search (User-Scoped) ───────────────────────────────────

function omniSearchUser(userId, query, filters = {}) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { total: 0, results: [] };
  const pattern = `%${q}%`;
  const results = [];

  // 1. Conversations
  const convs = db.prepare(`
    SELECT id, title, selected_role, active_sap_context_id, updated_at
    FROM conversations
    WHERE owner_user_id = ? AND (title LIKE ? OR selected_role LIKE ?)
    LIMIT 10
  `).all(userId, pattern, pattern);
  for (const c of convs) {
    results.push({
      id: c.id,
      category: 'Conversation',
      title: c.title,
      excerpt: `Private chat session · Role: ${c.selected_role || 'SAP Consultant'}`,
      updatedAt: c.updated_at,
      provenance: 'User-private session',
      actionUrl: `#conv-${c.id}`
    });
  }

  // 2. Investigations
  const invs = db.prepare(`
    SELECT id, title, status, severity, affected_process, updated_at
    FROM investigations
    WHERE owner_user_id = ? AND (title LIKE ? OR symptoms LIKE ? OR affected_process LIKE ?)
    LIMIT 10
  `).all(userId, pattern, pattern, pattern);
  for (const i of invs) {
    results.push({
      id: i.id,
      category: 'Investigation',
      title: `${i.id}: ${i.title}`,
      excerpt: `Status: ${i.status} · Severity: ${i.severity} · Process: ${i.affected_process}`,
      updatedAt: i.updated_at,
      provenance: 'User-private workspace',
      actionUrl: `#inv-${i.id}`
    });
  }

  // 3. User Uploaded Documents
  const docs = db.prepare(`
    SELECT id, filename, version, product, release, upload_timestamp
    FROM documents
    WHERE owner_user_id = ? AND (filename LIKE ? OR product LIKE ? OR release LIKE ?)
    LIMIT 10
  `).all(userId, pattern, pattern, pattern);
  for (const d of docs) {
    results.push({
      id: d.id,
      category: 'Document',
      title: d.filename,
      excerpt: `Tier 2 Runbook (${d.version}) · Product: ${d.product || 'SAP'} · Release: ${d.release || '2023'}`,
      updatedAt: d.upload_timestamp,
      provenance: 'User-uploaded document',
      actionUrl: `#doc-${d.id}`
    });
  }

  // 4. Saved Knowledge Items
  const knw = db.prepare(`
    SELECT id, title, item_type, provenance_type, citation_id, updated_at
    FROM saved_items
    WHERE owner_user_id = ? AND (title LIKE ? OR content LIKE ?)
    LIMIT 10
  `).all(userId, pattern, pattern);
  for (const k of knw) {
    results.push({
      id: k.id,
      category: 'Knowledge',
      title: k.title,
      excerpt: `Type: ${k.item_type} ${k.citation_id ? `· [${k.citation_id}]` : ''}`,
      updatedAt: k.updated_at,
      provenance: k.provenance_type,
      actionUrl: `#knw-${k.id}`
    });
  }

  // 5. Context Profiles
  const contexts = db.prepare(`
    SELECT id, name, product, environment, architecture, updated_at
    FROM sap_contexts
    WHERE owner_user_id = ? AND (name LIKE ? OR product LIKE ? OR architecture LIKE ?)
    LIMIT 10
  `).all(userId, pattern, pattern, pattern);
  for (const ctx of contexts) {
    results.push({
      id: ctx.id,
      category: 'SAP Context',
      title: ctx.name,
      excerpt: `Landscape: ${ctx.product} · ${ctx.architecture || 'Embedded'} · ${ctx.environment || 'Production'}`,
      updatedAt: ctx.updated_at,
      provenance: 'Personal context profile',
      actionUrl: `#ctx-${ctx.id}`
    });
  }

  // 6. Templates
  const matchedTemplates = INVESTIGATION_TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(q) || 
    t.objective.toLowerCase().includes(q) || 
    t.category.toLowerCase().includes(q) ||
    t.tcodes.some(tc => tc.toLowerCase().includes(q))
  );
  for (const t of matchedTemplates) {
    results.push({
      id: t.id,
      category: 'Template',
      title: t.title,
      excerpt: `${t.category} · ${t.objective}`,
      updatedAt: new Date().toISOString(),
      provenance: 'Built-in template',
      actionUrl: `#tmpl-${t.id}`
    });
  }

  return {
    query,
    total: results.length,
    results,
    conversations: convs,
    investigations: invs,
    documents: docs,
    knowledge: knw,
    contexts,
    templates: matchedTemplates
  };
}

// ── Personalized Home Workspace Summary ────────────────────────────────────

function getUserHomeSummary(userId) {
  const user = getUserProfile(userId);
  if (!user) return null;

  // Recent conversations (limit 5)
  const conversations = listUserConversations(userId).slice(0, 5);

  // Recent investigations (limit 5)
  const investigations = listUserInvestigations(userId).slice(0, 5);

  // Draft action cards (limit 5)
  const drafts = listUserActions(userId).slice(0, 5);

  // Uploaded documents (limit 5)
  const documents = listUserDocuments(userId).slice(0, 5);

  // Saved knowledge items (limit 5)
  const savedKnowledge = listUserKnowledge(userId).slice(0, 5);

  // Contexts
  const contexts = listUserContexts(userId);
  const activeContext = contexts.find(c => c.is_favorite) || contexts[0] || null;

  // Notifications count
  const unreadNotifs = listUserNotifications(userId, true);

  // Personalized recommendations
  const recommendations = [];
  if (investigations.length > 0 && investigations[0].status === 'In Progress') {
    recommendations.push({
      id: 'rec-1',
      title: `Resume investigation ${investigations[0].id}`,
      reason: 'Active investigation with open diagnostic checklist',
      actionType: 'investigation',
      targetId: investigations[0].id
    });
  }
  if (drafts.some(d => d.status === 'Approval required')) {
    recommendations.push({
      id: 'rec-2',
      title: 'Review pending diagnostic approval draft',
      reason: 'High-risk action card requires operations lead review',
      actionType: 'approvals',
      targetId: 'approvals'
    });
  }
  if (conversations.length > 0) {
    recommendations.push({
      id: 'rec-3',
      title: `Continue chat: "${conversations[0].title}"`,
      reason: 'Pick up where you left off in your latest inquiry',
      actionType: 'conversation',
      targetId: conversations[0].id
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-default-1',
      title: 'Start with an Investigation Template',
      reason: 'Explore pre-configured diagnostics for missing PMR, stuck qRFC, and staging delays',
      actionType: 'template',
      targetId: 'tmpl-missing-pmr'
    });
    recommendations.push({
      id: 'rec-default-2',
      title: 'Upload your first SAP SOP / Runbook',
      reason: 'Ground your AI investigations on verified company runbooks',
      actionType: 'upload',
      targetId: 'upload'
    });
  }

  return {
    user,
    activeContext,
    conversations,
    investigations,
    drafts,
    documents,
    savedKnowledge,
    unreadNotificationCount: unreadNotifs.length,
    recommendations
  };
}

module.exports = {
  db,
  hashPassword,
  verifyPassword,
  hashToken,
  generateId,
  // Users & Onboarding
  createUser,
  getUserByEmail,
  getUserById,
  getUserProfile,
  saveUserOnboarding,
  updateUserProfile,
  changeUserPassword,
  resetUserPasswordByEmail,
  // Sessions
  createSession,
  getSessionByToken,
  deleteSession,
  deleteAllUserSessions,
  // Conversations
  createConversation,
  getConversation,
  listUserConversations,
  updateConversation,
  deleteConversation,
  appendMessage,
  // Documents
  insertUserDocument,
  listUserDocuments,
  getUserDocumentById,
  deleteUserDocument,
  searchUserDocuments,
  // SAP Contexts
  listUserContexts,
  createUserContext,
  updateUserContext,
  favoriteContext,
  archiveContext,
  duplicateContext,
  deleteUserContext,
  // Investigations
  listUserInvestigations,
  getUserInvestigation,
  createUserInvestigation,
  addInvestigationComment,
  // Actions
  listUserActions,
  approveAction,
  // Audit Logs
  recordAuditLog,
  listUserAuditLogs,
  // Saved Knowledge Library
  saveKnowledgeItem,
  listUserKnowledge,
  getKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  // Investigation Templates
  INVESTIGATION_TEMPLATES,
  listInvestigationTemplates,
  getInvestigationTemplate,
  instantiateInvestigationFromTemplate,
  // Collaboration
  shareInvestigation,
  listInvestigationCollaborators,
  removeInvestigationCollaborator,
  listSharedWithMeInvestigations,
  // Notifications
  createNotification,
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  // User Feedback
  recordUserFeedback,
  listUserFeedback,
  // Omni Search & Home Summary
  omniSearchUser,
  getUserHomeSummary
};
