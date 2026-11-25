const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildDeterministicScenarioModel } = require('./services/WmsScenarioExpander.js');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Mock API endpoints for standalone dummy preview
  if (req.url.startsWith('/api/auth/me')) {
    // If request contains ?guest=1, simulate unauthenticated visitor (Welcome page)
    if (req.url.includes('guest=1')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthenticated preview' }));
      return;
    }
    // Otherwise simulate logged-in user (Workspace page)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      user: {
        id: 'usr-demo-preview',
        display_name: 'Enterprise Architect',
        email: 'architect@nexus-sap.com',
        plan: 'Enterprise Pro'
      }
    }));
    return;
  }

  if (req.url.startsWith('/api/conversations')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, conversations: [] }));
    return;
  }

  if (req.url.startsWith('/api/home/summary')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, summary: { investigationsCount: 14, templatesCount: 8, conversationsCount: 22 } }));
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/wms/expand-scenario')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const model = buildDeterministicScenarioModel(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, model }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Autonomous Testing Swarm Telemetry Endpoints
  if (req.method === 'POST' && req.url.startsWith('/api/testing/telemetry/batch')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const events = data.events || [];
        const timestamp = new Date().toISOString();
        if (!global.inMemoryTelemetryLogs) global.inMemoryTelemetryLogs = [];
        events.forEach(e => {
          global.inMemoryTelemetryLogs.push({
            id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sessionId: data.sessionId || 'session-preview',
            agentId: e.agentId || 'agent-unknown',
            agentName: e.agentName || 'Testing Agent',
            targetElement: e.targetElement || 'Element',
            action: e.action || 'Verification Check',
            status: e.status || 'passed',
            timestamp: e.timestamp || timestamp
          });
        });
        if (global.inMemoryTelemetryLogs.length > 5000) {
          global.inMemoryTelemetryLogs = global.inMemoryTelemetryLogs.slice(-4000);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, insertedCount: events.length, totalRecorded: global.inMemoryTelemetryLogs.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/testing/telemetry/stats')) {
    const logs = global.inMemoryTelemetryLogs || [];
    const agentMap = {};
    logs.forEach(l => {
      agentMap[l.agentName] = (agentMap[l.agentName] || 0) + 1;
    });
    const agentBreakdown = Object.keys(agentMap).map(k => ({ agent_name: k, checks_count: agentMap[k] }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      totalChecks: logs.length,
      agentBreakdown,
      recentLogs: logs.slice(-25).reverse()
    }));
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/testing/telemetry/export')) {
    const logs = global.inMemoryTelemetryLogs || [];
    const header = "id,session_id,agent_id,agent_name,target_element,action,status,timestamp\n";
    const lines = logs.map(r => 
      `"${r.id}","${r.sessionId}","${r.agentId}","${(r.agentName||'').replace(/"/g, '""')}","${(r.targetElement||'').replace(/"/g, '""')}","${(r.action||'').replace(/"/g, '""')}","${r.status}","${r.timestamp}"`
    );
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nexus-testing-telemetry-audit.csv"'
    });
    res.end(header + lines.join("\n"));
    return;
  }

  // Serve static files
  let cleanUrl = req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, cleanUrl);

  // If path is a directory or does not exist, serve index.html (SPA routing fallback)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + err.message);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dummy Server] Running at http://localhost:${PORT}`);
  console.log(`[Dummy Server] Authenticated Workspace: http://localhost:${PORT}/workspace`);
  console.log(`[Dummy Server] Guest Landing Page:    http://localhost:${PORT}/?guest=1`);
});
