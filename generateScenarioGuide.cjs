const fs = require('fs');
const path = require('path');

const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'gtsComplianceTrainingScenarios.json'), 'utf-8'));

let md = `# 📖 Nexus 2.0: SAP GTS Compliance Training Scenario Guide
## Complete Laboratory Manual & 15 Real-World Officer Simulation Scenarios

> **LEGAL NOTICE & TRAINING SAFEGUARD**:  
> **Training simulation based on a dated source snapshot (2026-09-23). This is not a production SAP GTS screening result. Verify against current official sources.**  
> Source Authorities: United Nations Security Council, US Department of the Treasury (OFAC), Financial Intelligence Unit - India (Ministry of Finance), Directorate General of Foreign Trade (DGFT India).

---

## 1. Pedagogical Architecture & Simulator Methodology

### 1.1 The Role of the SAP GTS Trade Compliance Officer
In global enterprises, the **Trade Compliance Officer** is the legally appointed fiduciary responsible for preventing unauthorized cross-border transactions involving sanctioned individuals, prohibited regimes, or illicit goods. 

Unlike transactional supply chain roles (sales clerks, logistics coordinators), the Compliance Officer has **veto power** over business execution. When SAP GTS applies an automated legal control or Sanctioned Party List (SPL) block:
1. S/4HANA delivery creation and billing runs are halted immediately.
2. SAP EWM warehouse picking waves are suspended.
3. Only an authorized Compliance Officer—acting within the SAP GTS cockpit (\`/SAPSLL/SPL_CHCK\` or \`/SAPSLL/BL_DOCS\`)—can adjudicate the block.

### 1.2 The Three-Tier System Interaction Model

\`\`\`
   [ SAP S/4HANA ]                    [ SAP GTS ]                     [ SAP EWM ]
(Feeder System / ERP)            (Compliance Engine)           (Execution Warehouse)
          |                                |                              |
Sales Order Created (VA01)                |                              |
          |--- CIF Replication (qRFC) ---->|                              |
          |                                |--- SPL Screening Engine      |
          |                                |    (Fuzzy comparison,        |
          |                                |     search trees, aliases)   |
          |                                |                              |
          |<-- Returns Hold Status (RFC) --|                              |
Sets VBAK-LIFSK = '01'                     |                              |
Outbound Delivery Blocked (VL01N)          |                              |
          |                                |                              |
          |                   [ Officer Adjudication ]                    |
          |                   Cockpit: /SAPSLL/BL_DOCS                   |
          |                   Options: Block / Release / Escalate         |
          |                                |                              |
          |<-- Officer Clears Block (RFC) -|                              |
VBAK-LIFSK Cleared                         |                              |
Delivery Created (VL01N)                  |                              |
          |--- Replicates Outbound Delivery (qRFC) ---------------------->|
          |                                                               | Checks GTS Status (DCO)
          |                                                               | Status = 'RELEASED'
          |                                                               | Wave Picking Activated
\`\`\`

---

## 2. Master Catalog of 15 Learning Scenarios

| Scenario ID | Scenario Name | Process Area | Source List | Difficulty | Expected Decision |
|---|---|---|---|:---:|:---:|
`;

for (const s of scenarios) {
  md += `| **${s.scenarioId}** | ${s.scenarioName} | \`${s.gtsProcessArea}\` | \`${s.sourceList}\` | ${s.difficulty} | \`${s.expectedOfficerAction}\` |\n`;
}

md += `\n---\n\n## 3. Comprehensive Scenario Modules (Detailed Lab Walkthroughs)\n\n`;

for (const s of scenarios) {
  md += `### ${s.scenarioId}: ${s.scenarioName}

#### Overview & Categorization
* **Category**: ${s.category}
* **Difficulty Level**: **${s.difficulty}**
* **SAP GTS Transaction Code**: \`${s.gtsProcessArea.includes('Procurement') ? '/SAPSLL/BL_DOCS' : s.scenarioId === 'SPL-015' ? '/SAPSLL/LIC_MGMT' : '/SAPSLL/SPL_CHCK'}\`
* **Governing Sanctions Authority**: \`${s.sourceList}\`
* **Evidence Baseline**: \`${s.evidenceStatus}\`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: \`${s.syntheticPartner.partnerId}\` — **${s.syntheticPartner.name}**
  * **Role**: ${s.syntheticPartner.partnerType}
  * **Location**: ${s.syntheticPartner.street || 'N/A'}, ${s.syntheticPartner.city || 'N/A'}, **${s.syntheticPartner.countryName || s.syntheticPartner.country || 'N/A'}**
  * **Tax ID / Commercial Registration**: \`${s.syntheticPartner.taxId || 'Missing / Incomplete'}\`
* **Synthetic Document**: \`${s.syntheticDocument.docNumber}\` (${s.syntheticDocument.docType})
  * **Material / Line Item**: \`${s.syntheticDocument.material}\` — *${s.syntheticDocument.materialDesc}*
  * **Transactional Value**: \`${s.syntheticDocument.currency} ${(s.syntheticDocument.netValue || 0).toLocaleString()}\`
  * **Replication Origin**: Feeder System \`${s.syntheticDocument.feederSystem}\`

#### Real Sanctions Source Evidence
${s.matchedSourceRecord ? `\`\`\`json
${JSON.stringify(s.matchedSourceRecord, null, 2)}
\`\`\`` : `*No matching record on official sanctions lists. Verified clean or incomplete input.*`}

#### Screening Engine Dynamics
* **Initial Screening Result**: \`${s.expectedMatch.initialScreeningStatus}\`
* **Simulated Match Score**: **${s.expectedMatch.matchScore}%**
* **Technical Match Basis**: ${s.expectedMatch.matchBasis}

#### Officer Adjudication Protocol
* **Required Officer Action**: \`${s.expectedOfficerAction}\`
* **Required Reason Code**: \`${s.expectedReasonCode}\`
* **Mandatory Officer Comment**:  
  > *"${s.expectedComment}"*

#### Downstream System Impact
* **SAP GTS Final Status**: \`${s.expectedGtsStatus}\`
* **SAP S/4HANA (Feeder ERP)**: \`${s.expectedS4Status}\`
* **SAP EWM (Warehouse Execution)**: \`${s.expectedEwmStatus}\`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   ${s.explanationPanel.whatIsHappening}
2. **Why does GTS perform this check?**  
   ${s.explanationPanel.whyGtsPerformsCheck}
3. **Which data is evaluated?**  
   ${s.explanationPanel.dataEvaluated}
4. **What does the officer need to review?**  
   ${s.explanationPanel.officerReviewNeeds}
5. **What decision options are available?**  
   ${s.explanationPanel.decisionOptions}
6. **What happens after release?**  
   ${s.explanationPanel.afterRelease}
7. **What happens after block?**  
   ${s.explanationPanel.afterBlock}
8. **How does S/4HANA react?**  
   ${s.explanationPanel.s4Reaction}
9. **How does EWM react?**  
   ${s.explanationPanel.ewmReaction}
10. **What should an SAP consultant explain in an interview?**  
   > *"${s.explanationPanel.interviewExplanation}"*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **${s.commonMistake}**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **${s.consultantNote}**

---
`;
}

md += `\n## 4. SAP GTS SPRO Configuration Reference Matrix

To configure these behaviors in an enterprise SAP GTS landscape, consultants navigate the Implementation Guide (IMG):

| IMG Path / Node | Technical Transaction / Table | Configuration Purpose |
|---|---|---|
| **Define Legal Regulations for SPL** | \`/SAPSLL/TLEGLG\` | Activates national and multilateral frameworks (e.g. UN_SEC, US_OFAC, EU_CFSP). |
| **Define Search Procedure for SPL** | \`/SAPSLL/TSPLSP\` | Configures fuzzy algorithms, Comparison Index, Levenshtein tolerance, and token weighting. |
| **Define Exclusion Words** | \`/SAPSLL/TSPLEX\` | Eliminates generic corporate suffixes (Ltd, Inc, GmbH, SA, Corp) to prevent false hits. |
| **Define Delimiter Characters** | \`/SAPSLL/TSPLDL\` | Specifies punctuation characters (hyphens, commas, periods) to strip during tokenization. |
| **Define Reason Codes for Partner Clearance** | \`/SAPSLL/TRC\` | Standardizes audit codes (\`RC01\` False Positive, \`RC02\` Confirmed Block, etc.). |
| **Configure Feeder System Plug-In Control** | \`/SAPSLL/PLUGIN_S4H\` | Dictates whether sales order blocks write \`01\` to \`VBAK-LIFSK\` synchronously or via batch. |
| **Define Document Types for Compliance** | \`/SAPSLL/TDOC\` | Maps SD Sales Orders (\`TA\`), Inbound POs (\`NB\`), and Deliveries (\`LF\`) to GTS customs document types. |

---

## 5. Summary & Learning Best Practices

1. **Never Bypass Mandatory Rationale**: In trade compliance, an unreasoned release is legally equivalent to willful negligence.
2. **Understand Dual-Control**: High-risk entities require 4-eyes approval before commercial releases can be executed.
3. **Respect Product Control Separation**: SCOMET and export control licensing must never be confused with denied-party screening.
`;

fs.writeFileSync(path.join(__dirname, 'Nexus_GTS_Training_Scenario_Guide.md'), md, 'utf-8');
console.log('Wrote training guide to Nexus_GTS_Training_Scenario_Guide.md');
