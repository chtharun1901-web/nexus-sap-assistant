/**
 * ══════════════════════════════════════════════════════════════════════════════
 * NEXUS GROUNDED DOMAIN FALLBACK ENGINE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Provides instant, zero-latency, authoritative Style 4 (Natural Conversational
 * Intelligence) enterprise architectural specifications directly from the local
 * knowledge base when cloud AI models encounter rate limits or timeouts.
 *
 * Style 4 Mandate: Zero arbitrary numbered boilerplate headings. Smooth,
 * engaging, high-density editorial dialogue worthy of a Senior Principal Architect.
 */

const { SAP_DOMAIN_SPECIALIZATIONS } = require('./SapDomainSpecializations.js');

/**
 * Synthesizes an authoritative Style 4 Natural Conversational response
 */
function generateGroundedSapFallback(userPrompt = '', classification = {}, intentAnalysis = {}, uploadedDocs = []) {
  const promptLower = (userPrompt || '').toLowerCase();
  const primaryModule = classification.primaryModule || 'SAP_SD';
  const domainMeta = SAP_DOMAIN_SPECIALIZATIONS[primaryModule] || SAP_DOMAIN_SPECIALIZATIONS['SAP_SD'];

  // Check sub-domain topic matching
  const isAtpTor = promptLower.includes('atp') || 
                   promptLower.includes('availability check') || 
                   promptLower.includes('transfer of requirements') || 
                   promptLower.includes('tor') || 
                   promptLower.includes('checking group') || 
                   promptLower.includes('checking rule') || 
                   (promptLower.includes('01') && promptLower.includes('02') && promptLower.includes('material master'));

  const isPricing = promptLower.includes('pricing') || 
                    promptLower.includes('condition technique') || 
                    promptLower.includes('v/08') || 
                    promptLower.includes('prcd_elements');

  const isO2C = !isAtpTor && !isPricing && (
    promptLower.includes('order-to-cash') || 
    promptLower.includes('o2c') || 
    promptLower.includes('document flow') || 
    promptLower.includes('order to cash')
  );

  // ── 1. Availability Check (ATP) & Transfer of Requirements (TOR) ───────────
  if (isAtpTor) {
    return [
      "**No**, the Availability Check (ATP) is **not** determined solely by the Sales Order Type configuration.",
      "",
      "In SAP Sales and Distribution (SD), ATP check execution and behavior are governed by a **multi-level determination architecture** that evaluates controls at the schedule line, material master, and business transaction levels:",
      "",
      "1. **Schedule Line Category (`VOV6`)**: This is the primary control switch. The flags **Availability Check** (`TVEP-LFPOS`) and **Transfer of Requirements (TOR)** (`TVEP-BDART`) must be active for the determined schedule line category (e.g. `CP` for standard items). If the schedule line category does not have the *Availability Check* flag checked, **no ATP check will occur**, regardless of material master settings.",
      "2. **Material Master (`MARC-MTVFP`)**: The material must be maintained with an **Availability Check Checking Group** (e.g. `01` Daily requirements, `02` Individual requirements) on the *MRP 3* or *Sales: General/Plant* view.",
      "3. **Scope of Check (`OVZ9`)**: The system combines the Material's **Checking Group** (`01`/`02`) with the SD **Checking Rule** (**`A`** for Sales Orders, **`B`** for Deliveries) to evaluate stock elements, inward receipts, and replenishment lead time (RLT).",
      "",
      "> [!IMPORTANT]",
      "> **Transfer of Requirements (TOR) in S/4HANA Modernization**",
      "> In legacy SAP ECC, TOR transferred requirements into dedicated staging tables (**`VBBE`** for individual requirements and **`VBBS`** for daily totals), creating database lock bottlenecks during peak order volumes. In **SAP S/4HANA**, legacy `VBBE` and `VBBS` tables are obsolete; sales requirements are calculated **in real time directly from Schedule Lines (`VBEP`)** during **MRP Live (`MD01N`)** and **advanced ATP (aATP)** without table locking contention.",
      "",
      "#### Checking Group `01` vs `02` Behavioral Comparison",
      "",
      "| Checking Group | Operational Meaning | Processing Behavior | Requirement Generation |",
      "|:---|:---|:---|:---|",
      "| **`01`** | **Daily Requirements** | Accumulates orders on a daily basis. Multiple sales orders on the same calendar day are summed into a single requirement total. | In ECC, wrote a single daily entry in `VBBS`. Ideal for high-volume, standard velocity FMCG items. |",
      "| **`02`** | **Individual Requirements** | Every single sales order line item maintains its own distinct requirement record with order reference. | In ECC, wrote distinct rows in `VBBE`. Allows full lineage traceability back to specific orders (`VBELN`/`POSNR`). |",
      "",
      "#### SPRO Customizing & Configuration Sequence",
      "",
      "* **Define Scope of Check (`OVZ9`)**: `SPRO → Sales and Distribution → Basic Functions → Availability Check → Availability Check with ATP Logic → Carry Out Control For Availability Check`. Key `[Checking Group 01/02] + [Checking Rule A]` establishes whether safety stock, inspection stock, POs, or production orders are counted as confirmed receipts.",
      "* **Activate in Schedule Line Category (`VOV6`)**: `SPRO → Sales and Distribution → Sales → Sales Documents → Schedule Lines → Define Schedule Line Categories`. For category `CP`, verify both *Availability Check* (`TVEP-LFPOS`) and *Requirement* (`TVEP-BDART`) are enabled.",
      "* **Requirement Class & Type Determination (`OVZG` / `OVZH`)**: The strategy group in the material master (or Item Category + MRP Type) derives the Requirement Type, which maps to Requirement Class for demand management parameters.",
      "",
      "#### Practical Triage Runbook",
      "",
      "When a line item fails to confirm stock or behaves unexpectedly:",
      "1. **Audit Live ATP in `CO09`**: Execute transaction `CO09` with Material, Plant, and Checking Rule `A`. Inspect the *Cumulative ATP Quantity* line-by-line to see exactly which receipts or requirements are consuming stock.",
      "2. **Inspect Schedule Line Category in Order (`VA02`/`VA03`)**: Open Item → Schedule Lines tab. Confirm whether category `CP` was derived or if category `CN` (No MRP/No ATP) was assigned via `VOV5` determination rules.",
      "3. **Verify Material Master Settings (`MM02`/`MM03`)**: Ensure field `MARC-MTVFP` is maintained with `01` or `02`. If left blank, the system bypasses ATP checking.",
      "",
      "Would you like to explore how **advanced ATP (aATP)** Backorder Processing (BOP) prioritizes stock allocations, or configure custom inward receipts in transaction `OVZ9`?"
    ].join('\n');
  }

  // ── 2. Order-to-Cash (O2C) Core Lifecycle ──────────────────────────────────
  if (isO2C) {
    return [
      "The **Order-to-Cash (O2C)** process in SAP represents the core enterprise value chain spanning customer inquiry, quotation, legal sales order commitment, available-to-promise (ATP) inventory allocation, outbound delivery processing, picking, packing, Post Goods Issue (PGI Movement Type 601), customer billing, and General Ledger accounts receivable clearing.",
      "",
      "In **SAP S/4HANA**, the O2C architecture incorporates critical modernizations: the mandatory **Business Partner (BP)** master object (`BUT000`), the **Universal Journal (`ACDOCA`)** consolidating FI/CO financial line items, pricing condition migration to **`PRCD_ELEMENTS`**, and direct qRFC/bgRFC asynchronous replication to **SAP EWM** and **SAP Transportation Management (TM)**.",
      "",
      "#### End-to-End Operational Lifecycle",
      "",
      "```",
      "[1. Inquiry: VA11] ──(VTAA)──► [2. Quotation: VA21] ──(VTAA)──► [3. Sales Order: VA01]",
      "                                                                          │",
      "                                                                   • ATP Check (OVZ9)",
      "                                                                   • Pricing (V/08)",
      "                                                                   • Credit Check (FSCM)",
      "                                                                          │",
      "                                                                       (VTLA)",
      "                                                                          ▼",
      "[6. Billing: VF01] ◄──(VTFL)─── [5. PGI: VL02N (601)] ◄─── [4. Outbound Delivery: VL01N]",
      "        │                                • MATDOC / MKPF                  • Shipping Point (OVL2)",
      "        ▼                                • COGS Posting                   • Picking & Packing",
      "[7. FI-AR Clearing: F-28]",
      "```",
      "",
      "1. **Sales Order Entry (`VA01`)**: A legally binding document is created with reference to document type (e.g. `OR`). Automatically triggers 16-step pricing condition evaluation (`V/08`), credit limit verification, and ATP schedule line confirmation.",
      "2. **Outbound Delivery Creation (`VL01N`)**: Generated based on shipping point determination (`OVL2`) and route schedule. Groups order line items ready for shipping from delivering plants.",
      "3. **Warehouse Picking & Packing (`VL02N` / `/SCWM/PRDO`)**: In standard ECC/Lean WM, picking status is confirmed directly in `VL02N`. In Decentralized or Embedded EWM, picking and staging are handled via warehouse orders.",
      "4. **Post Goods Issue (`VL02N` - Movement Type 601)**: The ownership of goods transfers to the customer. Generates a Material Document (inventory credit) and an Accounting Document (COGS debit).",
      "5. **Billing Document (`VF01` / `VF04`)**: Created with reference to the outbound delivery (`VTFL`). Derives revenue G/L accounts via Account Determination (`VKOA`) and outputs the customer invoice.",
      "6. **Payment & Clearing (`F-28` / `FB03`)**: Cash receipt reconciles customer open items in Accounts Receivable.",
      "",
      "#### Core Database Architecture & Field Mapping",
      "",
      "| Table | Description | Key Fields & Primary Links |",
      "|:---|:---|:---|",
      "| **`VBAK`** | Sales Document Header | `VBELN` (Doc #), `AUART` (Type), `VKORG`, `VTWEG`, `SPART`, `NETWR` |",
      "| **`VBAP`** | Sales Document Item | `VBELN`, `POSNR` (Item), `MATNR`, `WERKS` (Plant), `LGORT`, `KWMENG` |",
      "| **`VBEP`** | Schedule Lines | `VBELN`, `POSNR`, `ETENR` (Schedule Line), `EDATU` (Date), `BMENG` (Confirmed) |",
      "| **`LIKP`** | Outbound Delivery Header | `VBELN` (Delivery #), `VSTEL` (Shipping Point), `KUNNR`, `WADAT_IST` (PGI Date) |",
      "| **`LIPS`** | Outbound Delivery Item | `VBELN`, `POSNR`, `VGBEL` (Ref Order #), `VGPOS` (Ref Order Item), `PIKMG` |",
      "| **`VBRK`** | Billing Document Header | `VBELN` (Billing #), `FKART` (Type), `FKDAT` (Date), `KUNRG` (Payer), `NETWR` |",
      "| **`VBRP`** | Billing Document Item | `VBELN`, `POSNR`, `VGBEL` (Ref Delivery #), `VGPOS` (Ref Delivery Item), `NETWR` |",
      "| **`VBFA`** | Sales Document Flow | `VBELV` (Preceding Doc), `POSNV`, `VBELN` (Subsequent Doc), `VBTYP_N` |",
      "| **`ACDOCA`** | Universal Journal (S/4HANA) | `RCLNT`, `RLDNR`, `RBUKRS`, `GJAHR`, `BELNR`, `DOCLN`, `RACCT` (G/L Account) |",
      "",
      "> [!NOTE]",
      "> **Essential SPRO Determination Rules**",
      "> * **Shipping Point Determination (`OVL2`)**: `Shipping Condition (Customer Master) + Loading Group (Material) + Delivering Plant = Shipping Point`",
      "> * **Route Determination (`0VTC` / `0VRF`)**: `Departure Zone + Shipping Condition + Transportation Group + Transportation Zone (Ship-to) = Route`",
      "> * **Revenue Account Determination (`VKOA`)**: `Chart of Accounts + Sales Org + Account Key (ERL/ERS) + Cust. Acct Group + Mat. Acct Group = G/L Account`",
      "> * **Pricing Condition Technique (`V/08`)**: Field Catalog (`KOMK`/`KOMP`) → Condition Table (`V/03`) → Access Sequence (`V/07`) → Condition Type (`V/06`) → Pricing Procedure (`V/08`). S/4HANA writes pricing condition elements directly to table `PRCD_ELEMENTS`.",
      "",
      "#### Cross-Module Synchronizations",
      "",
      "* **SD ↔ EWM**: Outbound deliveries replicate to EWM warehouse requests (`/SCWM/PRDO`). Wave management, picking, and staging confirm back to SD over qRFC.",
      "* **SD ↔ FI/CO**: Billing document creation instantaneously posts debit to Customer Subledger (`BSEG`) and credit to Revenue (`ACDOCA` Account Key `ERL`), alongside real-time CO-PA margin calculation.",
      "* **SD ↔ GTS**: Feeder system plug-ins (`/SAPSLL/*`) perform real-time Sanctioned Party Screening (SPL) and export license determination, placing delivery blocks (`LIKP-LIFSP`) if compliance checks fail.",
      "",
      "Would you like to examine the **Revenue Account Determination (VKOA)** table keys or review **Copy Control (VTLA/VTFL)** data routines?"
    ].join('\n');
  }

  // ── 3. Generic Grounded Fallback for all other modules ─────────────────────
  return [
    `The architectural specification for **${domainMeta.name}** (\`${primaryModule}\`) reflects core enterprise logistics and financial integration principles within modern SAP landscapes:`,
    "",
    "#### Process Scope & Core Governance",
    "",
    `* **Operational Scope**: ${classification.subArea || 'Core Enterprise Execution & Governance'}`,
    `* **Execution Pipeline**: ${(domainMeta.business_processes || [])[0] || 'Standard Integrated Execution Flow'}`,
    `* **Integration Boundary**: ${classification.isCrossModule ? classification.secondaryModules.join(' ↔ ') : 'Module-Specific Core'}`,
    "",
    "#### Signature Transactions & Database Schema",
    "",
    "| Component | Signature Transaction Codes | Core Database Tables / CDS Views |",
    "|:---|:---|:---|",
    `| **${domainMeta.name}** | \`${(domainMeta.common_transactions || []).slice(0, 5).map(t => t.code).join('`, `') || 'SPRO'}\` | \`${(domainMeta.common_tables || []).slice(0, 5).map(t => t.table).join('`, `')}\` |`,
    "",
    "#### Core Process Sequences",
    "",
    ...(domainMeta.business_processes || []).map((bp, idx) => `${idx + 1}. **${bp.split(':')[0]}**: \`${bp.split(':')[1] || bp}\``),
    "",
    "#### Key Database Entities & Customizing",
    "",
    "- **Core Tables**:",
    ...(domainMeta.common_tables || []).slice(0, 6).map(t => `  - **\`${t.table}\`**: ${t.desc}`),
    "- **Primary Transactions**:",
    ...(domainMeta.common_transactions || []).slice(0, 6).map(t => `  - **\`${t.code}\`**: ${t.desc}`),
    "",
    "> [!TIP]",
    "> **Enterprise Integration Guardrail**",
    "> " + (domainMeta.integration_points || [])[0] || "Ensure master data keys and document status flags are synchronized across feeder systems.",
    "",
    "#### Cross-Module Touchpoints",
    "",
    ...(domainMeta.integration_points || []).map(ip => `- **${ip.split(':')[0]}**: ${ip.split(':')[1] || ip}`),
    "",
    "Would you like to drill into the specific SPRO configuration paths, explore table linkages, or trace an end-to-end transaction test?"
  ].join('\n');
}

module.exports = {
  generateGroundedSapFallback
};
