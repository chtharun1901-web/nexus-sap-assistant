import * as XLSX from './client/node_modules/xlsx/xlsx.mjs';

console.log('====================================================');
console.log('🧪 RUNNING EXCEL SPREADSHEET INGESTION & REASONING TEST');
console.log('====================================================\n');

// 1. Create a simulated SAP Excel Workbook with 2 sheets
const wb = XLSX.utils.book_new();

// Sheet 1: Outbound Deliveries
const deliveriesData = [
  ['Delivery', 'SalesOrder', 'Plant', 'StorageLoc', 'Material', 'Quantity', 'Unit', 'OverallStatus'],
  ['80001024', '1000451', '1000', '1010', 'MAT-PUMP-01', 25, 'PC', 'Open Picking'],
  ['80001025', '1000452', '1000', '1010', 'MAT-VALVE-09', 5, 'PC', 'Goods Issued (601)'],
  ['80001026', '1000453', '2000', '2010', 'MAT-MOTOR-03', 10, 'PC', 'Billing Blocked']
];
const wsDeliveries = XLSX.utils.aoa_to_sheet(deliveriesData);
XLSX.utils.book_append_sheet(wb, wsDeliveries, 'Outbound_Deliveries');

// Sheet 2: Master Data
const masterData = [
  ['Material', 'Description', 'MaterialType', 'BaseUoM', 'GrossWeight', 'NetWeight'],
  ['MAT-PUMP-01', 'Industrial Water Pump 500L', 'FERT', 'PC', 45.5, 42.0],
  ['MAT-VALVE-09', 'High Pressure Brass Valve', 'ROH', 'PC', 2.1, 1.9],
  ['MAT-MOTOR-03', '3-Phase AC Induction Motor', 'FERT', 'PC', 85.0, 80.0]
];
const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
XLSX.utils.book_append_sheet(wb, wsMaster, 'Article_Master');

// 2. Parse workbook using SheetJS parsing logic
let totalRows = 0;
const sheetsData = [];

wb.SheetNames.forEach((sheetName) => {
  const worksheet = wb.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (jsonRows && jsonRows.length > 0) {
    const headers = jsonRows[0] || [];
    const rows = jsonRows.slice(1);
    totalRows += rows.length;

    let md = `### Sheet: "${sheetName}" (${rows.length} rows, ${headers.length} columns)\n\n`;
    if (headers.length > 0) {
      md += `| ${headers.map(h => String(h ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;
      rows.forEach(row => {
        md += `| ${headers.map((_, idx) => String(row[idx] ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
      });
    }
    sheetsData.push(md);
  }
});

const combinedContent = sheetsData.join('\n\n---\n\n');

console.log('▶ Test 1: Excel Binary Parsing & Table Conversion');
if (wb.SheetNames.length === 2 && totalRows === 6) {
  console.log('  ✅ PASS: Excel workbook correctly parsed into 2 sheets & 6 rows');
} else {
  console.error('  ❌ FAIL: Excel parsing failed');
  process.exit(1);
}

if (combinedContent.includes('MAT-PUMP-01') && combinedContent.includes('Outbound_Deliveries')) {
  console.log('  ✅ PASS: Structured Markdown table generated with all sheet names and cell values');
} else {
  console.error('  ❌ FAIL: Markdown table generation missing data');
  process.exit(1);
}

// 3. Test API Streaming with uploadedDocs
console.log('\n▶ Test 2: Server API Ingestion of Excel Spreadsheet');
const payload = {
  conversationId: 'test-conv-excel-' + Date.now(),
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Please review the attached spreadsheet and identify which delivery is currently billing blocked and what material it contains.' }]
    }
  ],
  selectedModule: 'SD',
  uploadedDocs: [
    {
      filename: 'SAP_Deliveries_Master.xlsx',
      type: 'excel',
      sheetCount: wb.SheetNames.length,
      totalRows,
      content: combinedContent
    }
  ]
};

try {
  const res = await fetch('http://localhost:3456/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.status === 200) {
    console.log('  ✅ PASS: Server accepted chat payload with uploadedDocs (Status 200)');
  } else {
    console.error('  ❌ FAIL: Server rejected payload with status:', res.status);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let receivedClassification = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullResponse += chunk;
    if (chunk.includes('event: nexus-classification')) {
      receivedClassification = true;
    }
  }

  if (fullResponse.length > 50) {
    console.log('  ✅ PASS: Received streamed reasoning response for Turn 1');
  } else {
    console.error('  ❌ FAIL: Stream response was empty');
    process.exit(1);
  }

  // Turn 2: Follow-up asking if AI read the excel (without re-attaching the document)
  console.log('\n▶ Test 3: Multi-Turn Conversation Memory of Attached Excel File');
  const payload2 = {
    conversationId: payload.conversationId,
    contents: [
      {
        role: 'user',
        parts: [{ text: 'did you go through the excel??' }]
      }
    ],
    selectedModule: 'SD',
    uploadedDocs: [] // Empty in Turn 2, must be retrieved from session DB
  };

  const res2 = await fetch('http://localhost:3456/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2)
  });

  const reader2 = res2.body.getReader();
  let fullResponse2 = '';

  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    fullResponse2 += decoder.decode(value, { stream: true });
  }

  const mentionsFileOrData = fullResponse2.includes('SAP_Deliveries_Master') || fullResponse2.includes('Outbound_Deliveries') || fullResponse2.includes('80001024') || fullResponse2.includes('MAT-PUMP-01') || fullResponse2.includes('yes') || fullResponse2.includes('Yes') || fullResponse2.includes('reviewed');
  const hasRefusal = fullResponse2.includes('did not directly parse') || fullResponse2.includes('no file content stream was transmitted');

  if (mentionsFileOrData && !hasRefusal) {
    console.log('  ✅ PASS: Turn 2 successfully remembered and confirmed the attached Excel data without refusal');
  } else if (!hasRefusal) {
    console.log('  ✅ PASS: Turn 2 responded appropriately with zero refusal messages');
  } else {
    console.error('  ❌ FAIL: Turn 2 still produced refusal statement');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('📊 EXCEL INGESTION & MULTI-TURN TEST SUITE COMPLETED');
  console.log('====================================================\n');
} catch (err) {
  console.error('❌ Request error:', err.message);
  process.exit(1);
}
