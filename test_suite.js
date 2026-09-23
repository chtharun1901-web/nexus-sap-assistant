const http = require('http');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting Full Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${extra}`);
      failed++;
    }
  }

  // ── TEST 1: Server Status ──
  console.log('▶ Test Group 1: Server Endpoints & Key Status');
  try {
    const statusRes = await fetch('http://127.0.0.1:3456/api/status');
    const statusData = await statusRes.json();
    assert('GET /api/status returns HTTP 200', statusRes.status === 200);
    assert('GET /api/status reports hasKey: true', statusData.hasKey === true);
  } catch (err) {
    assert('Server reachable on port 3456', false, err.message);
  }

  // ── TEST 2: Static file serving ──
  console.log('\n▶ Test Group 2: Frontend HTML Loading');
  try {
    const htmlRes = await fetch('http://127.0.0.1:3456/');
    const htmlText = await htmlRes.text();
    assert('GET / returns HTTP 200', htmlRes.status === 200);
    assert('HTML contains root div', htmlText.includes('id="root"'));
    assert('HTML loads React entry script', htmlText.includes('/assets/'));
  } catch (err) {
    assert('HTML static serving', false, err.message);
  }

  // ── TEST 3: Real Chat API with Gemini model ──
  console.log('\n▶ Test Group 3: Real Gemini API Streaming');
  try {
    const testModels = ['gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.6-flash'];
    let streamText = '';
    
    for (const testModel of testModels) {
      const chatPayload = JSON.stringify({
        model: testModel,
        contents: [{ role: 'user', parts: [{ text: 'Respond with: PONG_TEST_OK' }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 20 }
      });

      streamText = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: 3456,
          path: '/api/chat',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(chatPayload) }
        }, res => {
          let data = '';
          res.on('data', chunk => { data += chunk.toString(); });
          res.on('end', () => resolve(data));
        });
        req.on('error', err => reject(err));
        req.write(chatPayload);
        req.end();
      });

      if (streamText.includes('"candidates"')) break;
    }

    assert('POST /api/chat streams SSE response', streamText.includes('data:'));
    assert('Stream contains valid JSON payload with candidates', streamText.includes('"candidates"'));
    console.log(`     Received SSE stream length: ${streamText.length} bytes`);
  } catch (err) {
    assert('Chat streaming', false, err.message);
  }

  // ── TEST 4: Markdown Parser Unit Tests ──
  console.log('\n▶ Test Group 4: Markdown Parser & Edge Cases');
  
  const htmlContent = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
  
  if (scriptMatch) {
    const scriptCode = scriptMatch[1];
    const vm = require('vm');
    const sandbox = {
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      document: {
        getElementById: () => ({ addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], classList: { add: () => {}, remove: () => {}, toggle: () => {} }, style: {} }),
        querySelectorAll: () => [],
        createElement: () => ({ appendChild: () => {}, querySelector: () => null, classList: { add: () => {}, remove: () => {} }, style: {} })
      },
      navigator: { clipboard: { writeText: () => Promise.resolve() } },
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: () => 1,
      fetch: () => Promise.resolve({ json: () => ({}) })
    };

    const context = vm.createContext(sandbox);
    try {
      vm.runInContext(scriptCode, context);
      assert('Frontend JavaScript parses and executes with 0 syntax errors', true);
    } catch (e) {
      assert('Frontend JavaScript syntax check', false, e.message);
    }

    const { parseMd, inlineMd, genFollowUpQuestions } = context;

    if (typeof parseMd === 'function') {
      // Test Table parsing
      const tableInput = `
| Header 1 | Header 2 | Header 3 |
| :--- | :---: | ---: |
| Cell Left | Cell Center | Cell Right |
| **Bold Cell** | \`code_cell\` | Plain Cell |
`;
      const tableHtml = parseMd(tableInput);
      assert('Table parsed into <table>', tableHtml.includes('<table>'));
      assert('Table includes <thead> and <tbody>', tableHtml.includes('<thead>') && tableHtml.includes('<tbody>'));
      assert('Table headers parsed properly', tableHtml.includes('<th>Header 1</th>'));
      assert('Table cell alignment style applied (center)', tableHtml.includes('style="text-align:center"'));
      assert('Table cell alignment style applied (right)', tableHtml.includes('style="text-align:right"'));
      assert('Bold inside table cell rendered', tableHtml.includes('<strong>Bold Cell</strong>'));
      assert('Code inside table cell rendered', tableHtml.includes('<code>code_cell</code>'));

      // Test LaTeX symbols / arrows
      const latexInput = 'Client $\\rightarrow$ Plant $\\rightarrow$ Storage Location and $\\le$ 50 units';
      const latexHtml = parseMd(latexInput);
      assert('LaTeX \\rightarrow converted to →', latexHtml.includes('Client → Plant → Storage Location'));
      assert('LaTeX \\le converted to ≤', latexHtml.includes('≤ 50 units'));

      // Test Code Blocks with syntax
      const codeInput = "```abap\nDATA: lv_matnr TYPE matnr.\n```";
      const codeHtml = parseMd(codeInput);
      assert('Code block parsed into pre/code', codeHtml.includes('<pre><code>DATA: lv_matnr TYPE matnr.</code></pre>'));
      assert('Code block includes language label', codeHtml.includes('<span>abap</span>'));

      // Test Follow-up question generator
      const ewmQuestions = genFollowUpQuestions('Explain SAP PP-EWM staging', 'answer');
      assert('genFollowUpQuestions returns array for PP-EWM query', Array.isArray(ewmQuestions) && ewmQuestions.length >= 3);
      assert('PP-EWM questions are contextual to SAP', ewmQuestions.some(q => q.includes('EWM') || q.includes('PP')));
    }
  }

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
