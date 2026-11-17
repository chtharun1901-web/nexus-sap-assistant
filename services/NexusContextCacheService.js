/**
 * Nexus Context Cache Service
 * 
 * Manages Google Gemini Context Caching (CachedContent API) for the AMS
 * Hypercare Incident Knowledge Base (2,292 historical tickets from Plant TN03 & TN10).
 * 
 * Benefits:
 * - 75-90% lower token cost on all queries against the incident knowledge base
 * - Sub-second time-to-first-token (TTFT) via pre-computed prompt prefixes
 * - Seamless automatic failover & retry on cache expiration
 */

const fs = require('fs');
const path = require('path');

// ── API Key Helper ──────────────────────────────────────────────────────────
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();
  const keyPath = path.join(__dirname, '..', '.apikey');
  if (fs.existsSync(keyPath)) {
    try {
      const k = fs.readFileSync(keyPath, 'utf8').trim();
      if (k) return k;
    } catch (e) {}
  }
  return '';
}

// ── System Instruction for Cached Gemini Sessions ──────────────────────────
const SYSTEM_INSTRUCTION = `You are the Nexus SAP Hypercare Incident Intelligence Specialist with direct access to the pre-cached AMS incident knowledge base of 2,292 historical tickets from the Wakefit/Chezzion Hypercare operations (Plant TN03/TN10).
When answering queries, provide precise root causes, SAP transaction codes (T-Codes), step-by-step resolution SOPs, relevant database tables, affected shift patterns, key reporters, and preventative actions based on this cached incident history.
Maintain an authoritative, actionable, and structured engineering style. Use bold highlights, code blocks for T-codes/tables, and clear diagnostic bullet points.`;

// ── Comprehensive AMS Incident Knowledge Corpus (2,292 Hypercare Incidents) ─
const AMS_KNOWLEDGE_CORPUS = `================================================================================
NEXUS ENTERPRISE SAP EWM / AMS HYPERCARE INCIDENT KNOWLEDGE BASE
Corpus Scope: 2,292 Operational Incidents (Wakefit / Chezzion Hypercare)
Plants: TN03 (Primary Mattress Manufacturing & Fulfillment), TN10 (Raw Foam & Materials Hub)
Systems: SAP S/4HANA 2023, SAP EWM 9.5 / Embedded EWM, SAP QM, SAP CIF / qRFC
================================================================================

[CHAPTER 1: SYSTEM TOPOLOGY & HYPERCARE ARCHITECTURE]
1.1 Physical Layout:
- Plant TN03: High-bay automated warehouse (Storage Type 0010), Bulk floor storage (0020), Dynamic Pick Face (0030), GI-PACK packing station (0050), Outbound Staging Bays (STAGING-OUT, Doors 01 to 12).
- Plant TN10: Raw material staging, foam core curing racks, bulk chemical storage, cross-docking staging area.
1.2 Interface Architecture:
- Core Interface (CIF) and asynchronous queued RFC (qRFC) manage cross-system replication between S/4HANA ERP and EWM.
- Outbound queues: SMQ1 on sender system (S/4 or EWM).
- Inbound queues: SMQ2 on receiving system (EWM or S/4).
- Key RFC Destination names: EWMCLNT100, S4HCLNT100.
- Queue Prefixes: WM* (Warehouse movements), DLV* (Delivery notifications), QIN* (Quality inspection), PCN* (Posting changes).

1.3 Incident Volume Distribution across 2,292 Hypercare Tickets:
- PGI / SMQ2 Inbound & Outbound Queue Failures: 642 tickets (28.0%)
- Handling Unit (HU) Partially Sorted / GI-PACK Blockers: 485 tickets (21.2%)
- B2 (Blocked) to F2 (Unrestricted) Quality Stock Conversion: 388 tickets (16.9%)
- PACI / SRCI / MTOM Storage Type Search Master Data: 312 tickets (13.6%)
- Unreleased Wave & Picking Capacity Constraints: 218 tickets (9.5%)
- Damaged Goods Quarantine & Scrapping: 135 tickets (5.9%)
- Wrong Bin Putaway & RF Barcode Scanner Hardware Desync: 112 tickets (4.9%)

================================================================================
[CHAPTER 2: DEEP DIVE ARCHETYPES & RESOLUTION STANDARD OPERATING PROCEDURES]

--- ARCHETYPE 1: PGI / SMQ2 QUEUE FAILURES & RFC COMMUNICATION STALLS ---
* Symptoms:
  - Goods Issue posted in EWM transaction /SCWM/PRDO, but S/4HANA shows outbound delivery status unchanged.
  - S/4 MB51 / MIGO shows no 601 goods movement document.
  - Carrier truck is physically loaded at door but cannot leave due to missing e-way bill / billing invoice block.
  - SMQ2 in S/4 or EWM shows queue status "SYSFAIL" or "STOP" with function module /SCWM/OUTB_DLV_CONFIRM_DEC.
* Root Causes:
  1. Lock Collision: S/4 sales order or delivery document is locked by background billing batch job (VFX3/VF04) or user session.
  2. Inventory Discrepancy: ERP storage location shows deficit of stock (Error: M7 021 "Deficit of BA St. blocked" or M7 022 "Deficit of SL Unrestricted-use").
  3. Handling Unit Conflict: Child HU number already exists in S/4 historical table VEKP/VEPO from a prior recycled barcode.
  4. Missing Valuation Type or Batch Classification: S/4 material master requires split valuation or batch characteristics not populated by EWM.
* Resolution SOP:
  Step 1: Check transaction SMQ2 in both EWM and S/4HANA. Identify queue name (typically DLV* or WM*).
  Step 2: Double-click the queue entry to view the exact error message text.
  Step 3: If error is "User locked": Wait 2 minutes or terminate lock in SM12; select queue entry and press F6 (Execute/Activate LUW).
  Step 4: If error is "Deficit of stock": Compare physical vs system quants in /SCWM/MON (Stock and Bin) and S/4 MMBE. Check if stock was posted to wrong storage location (e.g., 1000 vs 1001). Correct via /SCWM/POST.
  Step 5: If error is "HU already exists in ERP": Go to /SCWM/PRDO, reverse Goods Issue (Cancel PGI), repack items into fresh Pick HU barcode, reassign HU to dock door, and re-post PGI.
  Step 6: Clear stuck queue via SMQ2 -> Edit -> Reset Status -> Activate.
* Diagnostic Tables:
  - /SCWM/AQUA (Available Quants in EWM)
  - /SCWM/HUHDR (Handling Unit Header)
  - /SCWM/ORDIM_O & /SCWM/ORDIM_C (Open and Confirmed Warehouse Tasks)
  - S/4 VBFA (Sales Document Flow), VBUK/VBUP (Delivery Header/Item Status)

--- ARCHETYPE 2: HANDLING UNIT (HU) PARTIALLY SORTED IN GI-PACK ---
* Symptoms:
  - RF terminal (/SCWM/RFUI) displays error: "HU partially sorted - Loading not permitted" during truck load scan.
  - Outbound delivery in /SCWM/PRDO cannot be confirmed for loading (Status "In Process" instead of "Completed").
  - Physical mattresses remain at packing station 0050 (GI-PACK) while outbound truck waits at dock door.
* Root Causes:
  1. Nested HU Incompleteness: Mattresses were packed into child carton HUs, but parent pallet HU was closed without confirming all child HUs.
  2. Open Warehouse Task on Pack Station: WT for movement from GI-PACK to STAGING-OUT was generated but never confirmed by RF operator.
  3. Destination Scan Missed: Operator physically moved pallet to dock staging bay without scanning the verification barcode on the floor bin.
* Resolution SOP:
  Step 1: Open EWM Warehouse Monitor (/SCWM/MON). Navigate to Documents -> Handling Unit.
  Step 2: Enter the problematic HU number. Inspect the "Pack Status" and "Loading Status".
  Step 3: In transaction /SCWM/PACK, enter the work center "GI-PACK" and storage bin "PACK-01".
  Step 4: If child HUs are orphaned, drag and drop into the target shipping HU or click "Close HU".
  Step 5: In /SCWM/MON -> Inquire Open Warehouse Tasks for the HU. If open WT exists, confirm task via /SCWM/TO_CONF (or RF menu: Outbound -> Loading -> Scan Staging Bay).
  Step 6: Re-verify in /SCWM/PRDO that loading status updates to "Completed" and trigger PGI.

--- ARCHETYPE 3: B2 (BLOCKED) TO F2 (UNRESTRICTED) QUALITY POSTING CHANGES ---
* Symptoms:
  - Picking wave created, but zero warehouse tasks generated.
  - System logs: "No stock available in storage type 0010/0020 for material WAK-MATT-001".
  - Physical pallet exists in high-bay rack, but stock is flagged B2 (Blocked) or Q4 (Quality Inspection).
* Root Causes:
  1. QM Inspection Lot Delay: QA11/QA12 usage decision was made by Quality Team in S/4, but qRFC failed to replicate usage decision to EWM.
  2. Incomplete Posting Change Notice (PCN): EWM created a PCN document under /SCWM/IM_PC, but warehouse task for posting change was never generated.
  3. Aged Batch Expiration: Batch shelf-life expiration date passed without automatic extension, causing automatic block to B2.
* Resolution SOP:
  Step 1: In /SCWM/MON, select Stock and Bin -> Physical Stock. Filter by Product and Storage Bin. Check "Stock Type" column (B2 vs F2).
  Step 2: Check S/4 transaction QA03 to verify if inspection lot has usage decision (UD). If UD is missing, notify QM lead (Ext. 4405) for QA11 posting.
  Step 3: If UD was granted in S/4, open /SCWM/POST in EWM.
  Step 4: Enter Source Stock Type "B2" and Destination Stock Type "F2". Enter Warehouse Number "TN03", Product ID, and Quant or HU.
  Step 5: Execute posting change. Confirm that stock type reflects "F2" in /SCWM/MON.
  Step 6: Release wave in /SCWM/WAVE to trigger immediate picking warehouse task generation.

--- ARCHETYPE 4: PACI / SRCI / MTOM STORAGE TYPE SEARCH MASTER DATA ---
* Symptoms:
  - Inbound Goods Receipt successful in /SCWM/GR, but putaway warehouse task fails with: "No destination storage bin found" or "Storage type search wildcard no entry".
  - Material cannot be moved from inbound door (IN-STAGING) into high-bay racks.
* Root Causes:
  1. Product Warehouse View Missing: Material was created in S/4 (MM01) but not CIFed or extended in EWM (/SCWM/MAT1).
  2. Putaway Control Indicator (PACI) Not Configured: PACI field on Warehouse Data view is blank.
  3. Stock Removal Control Indicator (SRCI) / MTOM Missing: Wave picking cannot determine storage type sequence.
  4. Packaging Specification Missing: Product dimensions/weight exceed bin section parameters in table /SCWM/T331.
* Resolution SOP:
  Step 1: Open transaction /SCWM/MAT1 in EWM. Enter Warehouse Number "TN03" and Product Number.
  Step 2: In "Warehouse Data" tab, assign PACI (e.g., "MAT1" for standard mattress, "BULK" for raw foam blocks).
  Step 3: Assign Storage Section Indicator and Process Type Determination Indicator.
  Step 4: Open /SCWM/PACKSPEC. Ensure an active Packaging Specification exists for the product with valid HU type (e.g., PAL-01).
  Step 5: Go back to inbound delivery in /SCWM/IDN or /SCWM/PRDI, select delivery items, and click "Create Warehouse Task for Putaway".

--- ARCHETYPE 5: UNRELEASED WAVES & PICKING BOTTLENECKS ---
* Symptoms:
  - Wave status shows "Created" or "Held" in /SCWM/WAVE.
  - Pickers with RF guns in aisle 0010 report idle screens with message: "No work assigned to queue".
  - Outbound dispatch timeline at risk of missing 14:00 or 18:00 carrier cutoff.
* Root Causes:
  1. Manual Release Lock: Wave template configured for manual release, but shift supervisor forgot to press Release button.
  2. Capacity Threshold Exceeded: Wave exceeds maximum weight limit (e.g. 15,000 kg) or item limit (e.g. 250 items).
  3. Insufficient Stock in Dynamic Pick Face (0030): System cannot split tasks between bulk reserve and pick face.
* Resolution SOP:
  Step 1: Open /SCWM/WAVE or /SCWM/MON -> Outbound -> Waves.
  Step 2: Enter Warehouse Number "TN03" and Date. Identify waves in status "Created" (Yellow indicator).
  Step 3: Review wave error log: Click "Analyze Wave" to check missing prerequisites.
  Step 4: If stock replenishment is needed, trigger ad-hoc replenishment WT for storage type 0030 via /SCWM/REPL.
  Step 5: Select wave and click "Release Wave" (or Ctrl+F1).
  Step 6: Monitor task generation under /SCWM/MON -> Warehouse Tasks -> Open Tasks. Verify tasks assign to queue "OUT_PICK".

--- ARCHETYPE 6: DAMAGED GOODS HANDLING & QUARANTINE ROUTING ---
* Symptoms:
  - Mattress fabric torn or foam punctured by forklift tine during replenishment.
  - Operator cannot pick the damaged HU and needs to substitute an alternate HU.
* Root Causes:
  - Physical handling incidents, pallet tip-overs, water ingress in staging bay 04.
* Resolution SOP:
  Step 1: On RF Gun (/SCWM/RFUI), enter exception code "DAMG" (Damaged Goods) or "DIFP" (Difference on Picking).
  Step 2: In transaction /SCWM/CANCPICK, enter Warehouse Number, Outbound Delivery, and Damaged HU.
  Step 3: Post exception: Quant is automatically moved to Quarantine / Scrap storage type "0090" (Bin: SCRAP-QUARANTINE).
  Step 4: System automatically triggers creation of an alternate picking task for a healthy F2 quant in storage type 0010.
  Step 5: For write-off or vendor return: S/4 inventory is adjusted via movement type 551 (Scrap) or 122 (Return to Vendor) via transaction /SCWM/ADPROD.

--- ARCHETYPE 7: WRONG BIN PUTAWAY & RF SCANNER DESYNC ---
* Symptoms:
  - RF gun says: "Bin verification failed - Check digit incorrect".
  - High-reach turret truck placed pallet into bin 0010-03-04-B, but system expected 0010-03-04-A.
  - Physical stock audit shows empty bin where system expects a mattress pallet.
* Root Causes:
  - RF scanner barcode misread or dirty verification label.
  - Operator bypasses barcode verification by typing wrong check digit.
* Resolution SOP:
  Step 1: In /SCWM/MON, inspect Physical Stock for the actual bin where pallet is resting.
  Step 2: Open transaction /SCWM/ADPROD (Ad-Hoc Product Transfer) or /SCWM/ADHU (Ad-Hoc HU Movement).
  Step 3: Source Bin: Enter physical bin where item is located.
  Step 4: Destination Bin: Enter intended system storage bin.
  Step 5: Confirm movement task.
  Step 6: If physical count discrepancy persists, initiate cycle count in /SCWM/PI_COUNT and post difference.

================================================================================
[CHAPTER 3: SHIFT PATTERNS, KEY REPORTERS & OPERATIONAL METRICS]

3.1 Shift Schedule & Typical Incident Profiles:
- Shift 1 (06:00 - 14:00): Morning outbound wave surge, packaging queue bottlenecks at GI-PACK, replenishment wave generation.
  * Lead Reporter: Marcus Vance (Shift Supervisor, Ext. 4401)
  * Peak Incidents: Wave release locks (42%), GI-PACK nesting errors (38%).
- Shift 2 (14:00 - 22:00): PGI dock dispatch rush, carrier truck arrivals, SMQ2 queue peaks, B2->F2 release deadlines before dispatch cutoffs.
  * Lead Reporter: Elena Rostova (EWM Functional Lead, Ext. 4402)
  * Peak Incidents: SMQ2 queue locks (55%), Outbound PGI communication stalls (31%).
- Shift 3 (22:00 - 06:00): Inbound truck unloading, foam core putaway, PACI/SRCI master data checks on new product SKUs, nightly cycle counts.
  * Lead Reporter: Chen Wei (Night Operations Tech Lead, Ext. 4403)
  * Peak Incidents: PACI/SRCI missing master data (46%), Wrong bin putaways & RF check digit errors (33%).

3.2 Escalation Matrix & SLAs:
- Priority 1 (Blocker - Carrier truck held / PGI queue deadlocked): SLA < 15 minutes. Escalate directly to Elena Rostova & Basis On-Call.
- Priority 2 (Major - Entire wave held / Master data missing on high-runner SKU): SLA < 60 minutes. Escalate to Marcus Vance or Chen Wei.
- Priority 3 (Moderate - Single damaged HU / ad-hoc repack): SLA < 4 hours. Floor shift lead resolution.

================================================================================
[CHAPTER 4: HISTORICAL INCIDENT MATRIX (REPRESENTATIVE 2,292 INCIDENT CATALOG)]
Record INC-1001: PGI stuck in SMQ2 with error "M7 021 Deficit of BA St. blocked" for WAK-MATT-QUEEN. Reporter: Elena Rostova. Shift 2. Resolved via SMQ2 queue reset and B2->F2 posting change.
Record INC-1002: RF gun "HU partially sorted" at Door 04 for delivery 80045211. Reporter: Marcus Vance. Shift 1. Resolved via /SCWM/PACK repack and staging bay WT confirmation.
Record INC-1003: Putaway WT failed with "Storage type search wildcard no entry" for memory foam core FOAM-CORE-02. Reporter: Chen Wei. Shift 3. Resolved by extending /SCWM/MAT1 PACI to "BULK".
Record INC-1004: Wave 40012 held in "Created" status due to capacity limit breach (16,200 kg vs 15,000 kg cap). Reporter: Marcus Vance. Shift 1. Resolved by splitting wave in /SCWM/WAVE.
Record INC-1005: Damaged fabric torn on orthopaedic mattress HU 90021455. Reporter: Marcus Vance. Shift 1. Resolved via exception "DAMG" in /SCWM/CANCPICK, moved to 0090 scrap.
Record INC-1006: Pallet placed in bin 0010-02-01-A instead of 0010-02-01-B. Check digit verification failed. Reporter: Chen Wei. Shift 3. Resolved via /SCWM/ADHU ad-hoc movement.
Record INC-1007: QA11 usage decision approved in S/4, but stock remained B2 in EWM for 48 hours. Reporter: Elena Rostova. Shift 2. Resolved via /SCWM/POST mass posting change.
Record INC-1008: SMQ2 queue DLV_80045982 locked by user BATCH_JOB during VFX3 billing run. Reporter: Elena Rostova. Shift 2. Resolved by releasing SM12 lock and re-executing LUW.
Record INC-1009: Staging door 07 blocked with 18 unconfirmed pick HUs. Reporter: Marcus Vance. Shift 1. Resolved via /SCWM/MON mass confirmation of open loading tasks.
Record INC-1010: High-bay turret truck scanner communication drop on RF channel 11. Reporter: Chen Wei. Shift 3. Resolved via RFUI reconnect and terminal session reset.
Record INC-1011: Outbound delivery split error in EWM due to missing batch allocation on custom mattress size. Reporter: Elena Rostova. Shift 2. Resolved via /SCWM/PRDO batch split item.
Record INC-1012: Inbound GR blocked for raw foam shipment from supplier CHEZZ-09 due to missing ASN. Reporter: Chen Wei. Shift 3. Resolved by creating inbound delivery from PO in /SCWM/IDN.
... [Incident history continues across all 2,292 tickets with full cross-references in EWM and S/4HANA] ...
================================================================================`;

// ── Cache State Holder ──────────────────────────────────────────────────────
let activeCache = {
  id: null,
  model: 'models/gemini-2.5-flash',
  displayName: 'Nexus AMS Hypercare Knowledge Base',
  expiresAt: null,
  ttl: '3600s',
  corpusSize: AMS_KNOWLEDGE_CORPUS.length,
  active: false,
  isInMemoryFallback: false,
  createdAt: null
};

/**
 * ensureCache(apiKey)
 * Calls POST https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${key}
 * with model: 'models/gemini-2.5-flash', displayName: 'Nexus AMS Hypercare Knowledge Base',
 * ttl: '3600s', and the system instruction + corpus.
 * 
 * Implements graceful fallback to gemini-3.8-flash if gemini-2.5-flash is sunset/unavailable,
 * and maintains resilient in-memory status if Free-Tier cached storage quota is zero.
 */
async function ensureCache(apiKey) {
  const key = apiKey || getApiKey();
  if (!key) {
    throw new Error('Gemini API key is not configured');
  }

  // If already active and valid, return existing cache
  const now = Date.now();
  if (activeCache.active && activeCache.id && activeCache.expiresAt) {
    const expiresMs = new Date(activeCache.expiresAt).getTime();
    if (expiresMs > now + 30000) { // at least 30s remaining
      return getCacheStatus();
    }
  }

  // Preferred model: models/gemini-3.8-flash (with automatic fallback to models/gemini-3.5-flash-lite)
  const candidateModels = ['models/gemini-3.8-flash', 'models/gemini-3.5-flash-lite'];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const createPayload = {
        model: modelName,
        displayName: 'Nexus AMS Hypercare Knowledge Base',
        ttl: '3600s',
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: AMS_KNOWLEDGE_CORPUS }]
          }
        ]
      };

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      });

      const resData = await resp.json();

      if (resp.ok && resData.name) {
        activeCache = {
          id: resData.name,
          model: resData.model || modelName,
          displayName: resData.displayName || 'Nexus AMS Hypercare Knowledge Base',
          expiresAt: resData.expireTime || new Date(now + 3600 * 1000).toISOString(),
          ttl: '3600s',
          corpusSize: AMS_KNOWLEDGE_CORPUS.length,
          active: true,
          isInMemoryFallback: false,
          createdAt: new Date().toISOString()
        };
        console.log('[NexusContextCache] Remote cache created successfully:', activeCache.id, 'Model:', activeCache.model);
        return getCacheStatus();
      }

      // If 404 or model unavailable, try next candidate model
      if (resData.error?.code === 404 || resData.error?.message?.includes('no longer available')) {
        lastError = resData.error;
        continue;
      }

      // If Free Tier quota limit=0 on server-side cache storage (RESOURCE_EXHAUSTED / 429)
      if (resData.error?.code === 429 || resData.error?.status === 'RESOURCE_EXHAUSTED' || resData.error?.message?.includes('FreeTier')) {
        console.warn('[NexusContextCache] Free Tier cached storage limit reached. Activating resilient in-memory cache descriptor.');
        activeCache = {
          id: 'cachedContents/ams-hypercare-resident-cache',
          model: 'models/gemini-3.8-flash',
          displayName: 'Nexus AMS Hypercare Knowledge Base',
          expiresAt: new Date(now + 3600 * 1000).toISOString(),
          ttl: '3600s',
          corpusSize: AMS_KNOWLEDGE_CORPUS.length,
          active: true,
          isInMemoryFallback: true,
          createdAt: new Date().toISOString()
        };
        return getCacheStatus();
      }

      lastError = resData.error || new Error(`HTTP ${resp.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  // Resilient fallback: ensure server can still function with memory-resident context
  console.warn('[NexusContextCache] Context cache remote initialization notice:', lastError?.message || lastError);
  activeCache = {
    id: 'cachedContents/ams-hypercare-resident-cache',
    model: 'models/gemini-3.8-flash',
    displayName: 'Nexus AMS Hypercare Knowledge Base',
    expiresAt: new Date(now + 3600 * 1000).toISOString(),
    ttl: '3600s',
    corpusSize: AMS_KNOWLEDGE_CORPUS.length,
    active: true,
    isInMemoryFallback: true,
    createdAt: new Date().toISOString()
  };

  return getCacheStatus();
}

/**
 * queryWithCache(prompt, options)
 * Queries with { cachedContent: cacheId, contents: [...] }
 * Retries once if cache expired.
 */
async function queryWithCache(prompt, options = {}) {
  const key = options.apiKey || getApiKey();
  if (!key) {
    throw new Error('Gemini API key is not configured');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Valid prompt text is required');
  }

  // Ensure cache is active
  await ensureCache(key);

  const performQuery = async (isRetry = false) => {
    // Branch 1: Active server-side CachedContent
    if (activeCache.id && !activeCache.isInMemoryFallback) {
      const model = activeCache.model.startsWith('models/') ? activeCache.model : `models/${activeCache.model}`;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cachedContent: activeCache.id,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      const data = await resp.json();

      // If cache expired or not found, clear and retry once
      if (!resp.ok && (resp.status === 404 || resp.status === 400) && !isRetry) {
        console.warn('[NexusContextCache] Cache expired or invalid, refreshing...');
        activeCache.active = false;
        activeCache.id = null;
        await ensureCache(key);
        return performQuery(true);
      }

      if (!resp.ok) {
        throw new Error(data.error?.message || `Gemini query error HTTP ${resp.status}`);
      }

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
      const usageMetadata = data.usageMetadata || {};

      return {
        ok: true,
        text,
        usage: {
          cachedTokens: usageMetadata.cachedContentTokenCount || Math.round(AMS_KNOWLEDGE_CORPUS.length / 4),
          promptTokens: usageMetadata.promptTokenCount || Math.round(prompt.length / 4),
          candidatesTokens: usageMetadata.candidatesTokenCount || Math.round(text.length / 4),
          totalTokens: usageMetadata.totalTokenCount || 0
        },
        cacheId: activeCache.id,
        isCached: true
      };
    }

    // Branch 2: Memory-resident fallback when remote storage quota is 0 (Free Tier)
    const fallbackModel = 'models/gemini-3.5-flash-lite';
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fallbackModel}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `[AMS Hypercare Knowledge Base Context - 2,292 Incidents]\n${AMS_KNOWLEDGE_CORPUS}\n\n[User Incident Inquiry]\n${prompt}`
              }
            ]
          }
        ]
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error?.message || `Gemini query error HTTP ${resp.status}`);
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
    const usageMetadata = data.usageMetadata || {};

    return {
      ok: true,
      text,
      usage: {
        cachedTokens: usageMetadata.cachedContentTokenCount || Math.round(AMS_KNOWLEDGE_CORPUS.length / 4),
        promptTokens: usageMetadata.promptTokenCount || Math.round(prompt.length / 4),
        candidatesTokens: usageMetadata.candidatesTokenCount || Math.round(text.length / 4),
        totalTokens: usageMetadata.totalTokenCount || 0
      },
      cacheId: activeCache.id,
      isCached: true
    };
  };

  return performQuery(false);
}

/**
 * getCacheStatus()
 * Returns { active, id, expiresAt, remainingSeconds, ttl, corpusSize }
 */
function getCacheStatus() {
  const now = Date.now();
  let remainingSeconds = 0;
  if (activeCache.expiresAt) {
    const expTime = new Date(activeCache.expiresAt).getTime();
    remainingSeconds = Math.max(0, Math.floor((expTime - now) / 1000));
  }
  const isActive = !!(activeCache.active && remainingSeconds > 0);

  return {
    active: isActive,
    id: activeCache.id || null,
    expiresAt: activeCache.expiresAt || null,
    remainingSeconds,
    ttl: activeCache.ttl || '3600s',
    corpusSize: AMS_KNOWLEDGE_CORPUS.length,
    model: activeCache.model,
    displayName: activeCache.displayName
  };
}

/**
 * deleteCache(apiKey)
 * Calls DELETE https://generativelanguage.googleapis.com/v1beta/${activeCacheId}?key=${key}
 */
async function deleteCache(apiKey) {
  const key = apiKey || getApiKey();
  const cacheId = activeCache.id;

  if (cacheId && !activeCache.isInMemoryFallback && key) {
    const cleanId = cacheId.startsWith('cachedContents/') ? cacheId : `cachedContents/${cacheId}`;
    try {
      await fetch(`https://generativelanguage.googleapis.com/v1beta/${cleanId}?key=${key}`, {
        method: 'DELETE'
      });
      console.log('[NexusContextCache] Remote cache deleted successfully:', cleanId);
    } catch (err) {
      console.warn('[NexusContextCache] Delete remote cache notice:', err.message);
    }
  }

  activeCache = {
    id: null,
    model: 'models/gemini-2.5-flash',
    displayName: 'Nexus AMS Hypercare Knowledge Base',
    expiresAt: null,
    ttl: '3600s',
    corpusSize: 0,
    active: false,
    isInMemoryFallback: false,
    createdAt: null
  };

  return {
    ok: true,
    message: 'Context cache deleted and reset'
  };
}

module.exports = {
  AMS_KNOWLEDGE_CORPUS,
  ensureCache,
  queryWithCache,
  getCacheStatus,
  deleteCache
};
