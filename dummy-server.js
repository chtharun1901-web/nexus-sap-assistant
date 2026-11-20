const http = require('http');
const fs = require('fs');
const path = require('path');

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
