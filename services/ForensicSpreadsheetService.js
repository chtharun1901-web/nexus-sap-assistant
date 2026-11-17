/**
 * Forensic Spreadsheet Service
 * 
 * Performs 100% full row-level forensic aggregation across multi-sheet workbooks:
 * - Computes exact row volumes by plant/sheet, closed vs open tickets
 * - Isolates personal contributions (candidate name vs team members)
 * - Computes user errors vs system errors ratios
 * - Clusters recurring symptoms with root causes and live floor fixes
 * - Detects data anomalies (e.g. clock time vs duration, open tickets, backend PGIs)
 */

const fs = require('fs');
const path = require('path');

let XLSX = null;
try {
  XLSX = require('../client/node_modules/xlsx');
} catch (_) {
  try {
    XLSX = require('xlsx');
  } catch (__) {}
}

function profileWorkbook(workbook, fileName = 'Spreadsheet.xlsx', candidateName = 'Tarun') {
  if (!XLSX || !workbook) return null;

  let totalRowsGlobal = 0;
  const sheetsMarkdown = [];

  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!jsonRows || jsonRows.length === 0) return;

    const headers = (jsonRows[0] || []).map(h => (h != null ? String(h).trim() : ''));
    const rows = jsonRows.slice(1).filter(r => r && r.some(c => c != null && String(c).trim() !== ''));
    totalRowsGlobal += rows.length;

    // Detect semantic column indexes
    const findCol = (regex) => headers.findIndex(h => regex.test(h));
    const idIdx = findCol(/\b(?:issue|ticket|incident|sr\.?\s*no\.?)\b/i);
    const dateIdx = findCol(/\b(?:date|issuedate|created|logged)\b/i);
    const repIdx = findCol(/\b(?:reported\s*by|raised\s*by|requester|operator|user)\b/i);
    const descIdx = findCol(/\b(?:issue(?:\s*desc|\s*details)?|description|summary|problem|symptom|error)\b/i);
    const dlvIdx = findCol(/\b(?:delivery|obd|outbound)\b/i);
    const prodIdx = findCol(/\b(?:product|material|sku)\b/i);
    const batchIdx = findCol(/\b(?:batch|charge)\b/i);
    const asgIdx = findCol(/\b(?:ams\s*member|assignee|assigned\s*to|owner|consultant|engineer|solved\s*by)\b/i);
    const causeIdx = findCol(/\b(?:root\s*cause|cause|reason|why)\b/i);
    const resIdx = findCol(/\b(?:resolution|solution|action\s*taken|fix|workaround)\b/i);
    const typeIdx = findCol(/\b(?:issue\s*type|type|category|classification)\b/i);
    const statusIdx = findCol(/\b(?:status|state)\b/i);
    const resTimeIdx = findCol(/\b(?:resolution\s*time|turnaround|tat|duration)\b/i);

    // Aggregations across 100% of rows in the sheet
    const statusCounts = {};
    const assigneeCounts = {};
    const assigneeMonths = {};
    const reporterCounts = {};
    let userIssueCount = 0;
    let systemIssueCount = 0;
    let otherTypeCount = 0;

    // Key Operational Clusters
    const clusters = {
      pgiQueue: { name: 'PGI done but not in MB51 / Queue stuck in SMQ2', count: 0, causes: {}, fixes: {} },
      huSort: { name: 'HU partially sorted / Cannot load (GI-pack door link missing)', count: 0, userTickets: 0, causes: {}, fixes: {} },
      pickingPending: { name: 'Picking pending / Task not created (B2/F2 stock or aged batch)', count: 0, causes: {}, fixes: {} },
      wildcardMaster: { name: 'Storage type search wildcard / Missing master data (PACI/SRCI/MTOM/packspec)', count: 0, causes: {}, fixes: {} },
      openTaskDrop: { name: 'Open task on HU / Do drop / No warehouse order found', count: 0, causes: {}, fixes: {} },
      waveNoTask: { name: 'Wave created but no tasks (Wave unreleased)', count: 0, causes: {}, fixes: {} },
      damagedItem: { name: 'Damaged item / Mattress (Cancel pick for product & batch)', count: 0, causes: {}, fixes: {} },
      wrongBin: { name: 'Wrong bin putaway (ADPROD bin transfer)', count: 0, causes: {}, fixes: {} },
      waveNotCreated: { name: 'Wave not created / Delivery queue error (S/4 sync)', count: 0, causes: {}, fixes: {} }
    };

    let clockTimeValues = 0;
    let checkedTimeVals = 0;
    let backendWorkaroundCount = 0;
    const openRows = [];

    rows.forEach((r, rowIdx) => {
      // Status
      let st = (r[statusIdx] != null ? String(r[statusIdx]).trim() : '');
      const stLower = st.toLowerCase();
      if (stLower === 'closed' || stLower === 'clsoed') st = 'Closed';
      else if (stLower === 'open') st = 'Open';
      else if (!st) st = 'Unspecified';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
      if (st === 'Open') openRows.push(rowIdx + 1);

      // Assignee
      const asgRaw = (r[asgIdx] != null ? String(r[asgIdx]).trim() : '') || 'Unassigned';
      assigneeCounts[asgRaw] = (assigneeCounts[asgRaw] || 0) + 1;

      // Month breakdown
      const dVal = r[dateIdx];
      let monthStr = '';
      if (typeof dVal === 'number' && dVal > 40000) {
        const dt = new Date(Math.round((dVal - 25569) * 86400 * 1000));
        monthStr = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      } else if (typeof dVal === 'string' && dVal.length >= 7) {
        monthStr = dVal.slice(0, 7);
      }
      if (monthStr) {
        if (!assigneeMonths[asgRaw]) assigneeMonths[asgRaw] = {};
        assigneeMonths[asgRaw][monthStr] = (assigneeMonths[asgRaw][monthStr] || 0) + 1;
      }

      // Reporter
      const rep = (r[repIdx] != null ? String(r[repIdx]).trim() : '') || 'Unknown';
      reporterCounts[rep] = (reporterCounts[rep] || 0) + 1;

      // Classification
      const typ = (r[typeIdx] != null ? String(r[typeIdx]).toLowerCase().trim() : '');
      if (typ.includes('user')) userIssueCount++;
      else if (typ.includes('system') || typ.includes('queue') || typ.includes('rfc')) systemIssueCount++;
      else if (typ) otherTypeCount++;

      // Issue text & clusters
      const issueText = ((r[0] != null ? String(r[0]) : '') + ' ' + (r[descIdx] != null ? String(r[descIdx]) : '')).toLowerCase();
      const causeText = (r[causeIdx] != null ? String(r[causeIdx]) : '').trim();
      const resText = (r[resIdx] != null ? String(r[resIdx]) : '').trim();
      const combo = (issueText + ' ' + causeText + ' ' + resText).toLowerCase();

      const recordCluster = (key) => {
        clusters[key].count++;
        if (asgRaw.toLowerCase().includes('tarun') || (candidateName && asgRaw.toLowerCase().includes(candidateName.toLowerCase()))) {
          if (clusters[key].userTickets !== undefined) clusters[key].userTickets++;
        }
        if (causeText && causeText.length > 5) {
          const shortCause = causeText.replace(/\r?\n/g, ' ').slice(0, 70);
          clusters[key].causes[shortCause] = (clusters[key].causes[shortCause] || 0) + 1;
        }
        if (resText && resText.length > 5) {
          const shortFix = resText.replace(/\r?\n/g, ' ').slice(0, 70);
          clusters[key].fixes[shortFix] = (clusters[key].fixes[shortFix] || 0) + 1;
        }
      };

      if (combo.includes('pgi') || combo.includes('mb51') || combo.includes('processing error')) recordCluster('pgiQueue');
      if (combo.includes('partial') || combo.includes('gi-pack') || (combo.includes('hu') && combo.includes('sort'))) recordCluster('huSort');
      if (combo.includes('b2') || combo.includes('task not create') || combo.includes('picking pending')) recordCluster('pickingPending');
      if (combo.includes('wildcard') || combo.includes('storage type search') || combo.includes('paci') || combo.includes('pack spec')) recordCluster('wildcardMaster');
      if (combo.includes('do drop') || combo.includes('open task') || combo.includes('no warehouse order')) recordCluster('openTaskDrop');
      if (combo.includes('wave') && (combo.includes('no task') || combo.includes('not release') || combo.includes('release wave'))) recordCluster('waveNoTask');
      if (combo.includes('damage')) recordCluster('damagedItem');
      if (combo.includes('wrong bin') || combo.includes('adprod')) recordCluster('wrongBin');
      if (combo.includes('wave not created') || (combo.includes('not distribute') && combo.includes('delivery'))) recordCluster('waveNotCreated');

      // Check resolution time format
      const rt = r[resTimeIdx];
      if (rt != null && String(rt).trim() !== '') {
        checkedTimeVals++;
        const srt = String(rt).trim();
        if (/^\d{1,2}[:;]\d{2}/.test(srt) || (typeof rt === 'number' && rt < 1 && rt > 0)) {
          clockTimeValues++;
        }
      }

      if (combo.includes('backend') || combo.includes('manual update')) {
        backendWorkaroundCount++;
      }
    });

    const isClockTime = checkedTimeVals > 0 && (clockTimeValues / checkedTimeVals) > 0.35;

    // Build Sheet Markdown
    let md = `### Sheet: "${sheetName}" (${rows.length} rows, ${headers.length} columns)\n\n`;

    // 1. Executive Statistical Digest
    md += `#### 📊 Forensic Statistical Summary (${sheetName})\n`;
    md += `- **Total Tickets Analyzed:** ${rows.length} rows across 100% of sheet\n`;
    md += `- **Status Distribution:** ${Object.entries(statusCounts).map(([st, cnt]) => `**${st}:** ${cnt}`).join(', ')}\n`;
    if (userIssueCount > 0 || systemIssueCount > 0) {
      const classifiedTotal = userIssueCount + systemIssueCount + otherTypeCount;
      const userPct = ((userIssueCount / classifiedTotal) * 100).toFixed(1);
      const sysPct = ((systemIssueCount / classifiedTotal) * 100).toFixed(1);
      md += `- **Issue Classification:** **${userIssueCount} User Issues (${userPct}%)** vs **${systemIssueCount} System/Interface Issues (${sysPct}%)**\n`;
    }

    // 2. Assignee Ownership Breakdown
    const sortedAssignees = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);
    md += `\n#### 👥 Assignee Ownership & Personal Contribution (${sheetName})\n`;
    md += `| Assignee / AMS Member | Ticket Count | % of Sheet | Monthly Activity Breakdown |\n`;
    md += `| --- | --- | --- | --- |\n`;
    sortedAssignees.slice(0, 12).forEach(([asg, cnt]) => {
      const pct = ((cnt / rows.length) * 100).toFixed(1);
      const months = assigneeMonths[asg] ? Object.entries(assigneeMonths[asg]).map(([m, c]) => `${m}: ${c}`).join(', ') : 'N/A';
      const isUser = asg.toLowerCase().includes('tarun') || (candidateName && asg.toLowerCase().includes(candidateName.toLowerCase()));
      md += `| ${isUser ? `⭐ **${asg} (Candidate)**` : `**${asg}**`} | **${cnt}** | ${pct}% | ${months} |\n`;
    });

    // 3. Key Floor Reporters & Shift Supervisors
    const sortedReporters = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    md += `\n#### 🏭 Top Warehouse Floor Reporters / Supervisors (${sheetName})\n`;
    md += `- ${sortedReporters.map(([rep, cnt]) => `**${rep}:** ${cnt} tickets`).join(' | ')}\n`;

    // 4. Recurring Operational Clusters Matrix
    md += `\n#### ⚡ Top Recurring Operational Clusters (${sheetName})\n`;
    md += `| Issue Cluster | Occurrences | Typical Root Cause Identified | Live Floor Workaround / Fix |\n`;
    md += `| --- | --- | --- | --- |\n`;
    Object.entries(clusters).forEach(([k, c]) => {
      if (c.count > 0) {
        const topCause = Object.entries(c.causes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'System status / queue lock';
        const topFix = Object.entries(c.fixes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Corrective posting / queue reactivation';
        const userNote = c.userTickets ? ` (${c.userTickets} personal)` : '';
        md += `| **${c.name}** | **${c.count}**${userNote} | ${topCause.replace(/\|/g, '\\|')} | ${topFix.replace(/\|/g, '\\|')} |\n`;
      }
    });

    // 5. Data Profiling & Cautions
    md += `\n#### ⚠️ Data Quality & Forensic Audit Notes (${sheetName})\n`;
    if (isClockTime) {
      md += `- ⏱️ **Timestamp Format Warning:** 'Resolution time' contains clock timestamps or fractional day timestamps, NOT elapsed SLA duration. Do NOT quote as turnaround SLA without explicit confirmation.\n`;
    }
    if (openRows.length > 0) {
      md += `- 📌 **Open / Pending Tickets:** ${openRows.length} tickets remain open/unresolved in this sheet (e.g. rows ${openRows.slice(0, 5).join(', ')}).\n`;
    }
    if (backendWorkaroundCount > 0) {
      md += `- 🔧 **Backend Workarounds:** ${backendWorkaroundCount} ticket(s) noted emergency backend or manual interventions (e.g. backend PGI). Must be explained as exceptional emergency one-offs.\n`;
    }

    // 6. High-Density Verbatim Row Table (Up to 450 priority rows per sheet)
    md += `\n#### 📋 High-Density Record Sample (${sheetName})\n`;
    if (headers.length > 0) {
      md += `| Row | ${headers.map(h => String(h ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
      md += `| --- | ${headers.map(() => '---').join(' | ')} |\n`;

      const priorityRows = [];
      const standardRows = [];
      rows.forEach((row, idx) => {
        const rowStr = JSON.stringify(row).toLowerCase();
        const isOpen = (row[statusIdx] || '').toString().toLowerCase().includes('open');
        const isCandidate = rowStr.includes('tarun') || (candidateName && rowStr.includes(candidateName.toLowerCase()));
        if (isOpen || isCandidate) {
          priorityRows.push({ row, idx: idx + 1 });
        } else {
          standardRows.push({ row, idx: idx + 1 });
        }
      });

      const selectedRows = [...priorityRows, ...standardRows].slice(0, 450);
      selectedRows.forEach(({ row, idx }) => {
        md += `| #${idx} | ${headers.map((_, colI) => String(row[colI] ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 80)).join(' | ')} |\n`;
      });
      if (rows.length > 450) {
        md += `\n*(Displaying 450 priority records of ${rows.length} total rows. Forensic statistics above computed across 100% of rows.)*\n`;
      }
    }

    sheetsMarkdown.push(md);
  });

  const globalHeader = `# 📊 WORKBOOK FORENSIC AUDIT & OPERATIONAL REASONING PACK\n**File:** "${fileName}" | **Sheets Analyzed:** ${workbook.SheetNames.length} | **Total Records Audited:** ${totalRowsGlobal} across 100% of rows\n\n---\n\n`;

  return {
    totalRows: totalRowsGlobal,
    sheetCount: workbook.SheetNames.length,
    content: globalHeader + sheetsMarkdown.join('\n\n---\n\n')
  };
}

function enrichUploadedDocs(effectiveUploadedDocs, currentUserName = 'Tarun') {
  if (!XLSX || !effectiveUploadedDocs || effectiveUploadedDocs.length === 0) {
    return effectiveUploadedDocs;
  }

  const downloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\DELL', 'Downloads');

  effectiveUploadedDocs.forEach((doc) => {
    if (!doc) return;
    const isSpreadsheet = doc.type === 'excel' || /\.(xlsx|xls|csv)$/i.test(doc.filename || '');
    if (isSpreadsheet && (!doc.content || !doc.content.includes('Forensic Statistical Summary'))) {
      const candidateFilenames = [
        doc.filename,
        'Chezzion Wakefit AMS Issue Tracker (1).xlsx',
        'Chezzion Wakefit AMS Issue Tracker.xlsx'
      ].filter(Boolean);

      for (const fn of candidateFilenames) {
        const filePath = path.join(downloadsDir, fn);
        if (fs.existsSync(filePath)) {
          try {
            const wb = XLSX.readFile(filePath);
            const digest = profileWorkbook(wb, doc.filename || fn, currentUserName);
            if (digest && digest.content) {
              doc.content = digest.content;
              doc.totalRows = digest.totalRows;
              doc.sheetCount = digest.sheetCount;
              break;
            }
          } catch (err) {
            console.warn(`[ForensicSpreadsheetService] Failed to parse ${filePath}:`, err.message);
          }
        }
      }
    }
  });

  return effectiveUploadedDocs;
}

module.exports = {
  profileWorkbook,
  enrichUploadedDocs
};
