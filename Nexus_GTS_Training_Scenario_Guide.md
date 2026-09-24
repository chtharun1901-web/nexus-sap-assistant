# 📖 Nexus 2.0: SAP GTS Compliance Training Scenario Guide
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
3. Only an authorized Compliance Officer—acting within the SAP GTS cockpit (`/SAPSLL/SPL_CHCK` or `/SAPSLL/BL_DOCS`)—can adjudicate the block.

### 1.2 The Three-Tier System Interaction Model

```
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
```

---

## 2. Master Catalog of 15 Learning Scenarios

| Scenario ID | Scenario Name | Process Area | Source List | Difficulty | Expected Decision |
|---|---|---|---|:---:|:---:|
| **SPL-001** | Exact Sanctioned-Party Name Match (UN Consolidated) | `SPL Screening / Legal Control` | `UN_Consolidated` | Beginner | `CONFIRM_BLOCK` |
| **SPL-002** | Exact OFAC SDN Match (Corporate Entity) | `Vendor Screening / Procurement Legal Control` | `OFAC_SDN` | Beginner | `CONFIRM_BLOCK` |
| **SPL-003** | Alias Match with Primary Entity Resolution | `Alias Screening / Entity Resolution` | `OFAC_NonSDN_Aliases` | Intermediate | `CONFIRM_BLOCK` |
| **SPL-004** | Alias with Spelling & Transliteration Variation | `Fuzzy Screening / Transliteration Handling` | `OFAC_NonSDN_Aliases` | Intermediate | `ESCALATE` |
| **SPL-005** | Address Supporting Evidence Resolution | `Address Screening & Multi-Signal Adjudication` | `OFAC_NonSDN_Addresses` | Advanced | `CONFIRM_BLOCK` |
| **SPL-006** | False Positive Due to Distinct Identifiers | `False-Positive Resolution / Audit Justification` | `OFAC_SDN` | Beginner | `RELEASE` |
| **SPL-007** | No Match (Clean Fictional Partner) | `Automated Clearance / Clean Transaction Flow` | `ALL_ACTIVE_LISTS` | Beginner | `NO_ACTION_REQUIRED` |
| **SPL-008** | Incomplete Master Data (Missing Mandatory Attributes) | `Data Quality / Incomplete Information Management` | `N/A (Data Quality Guard)` | Beginner | `INSUFFICIENT_DATA` |
| **SPL-009** | Multiple Ranked Candidate Review | `Multi-Candidate Adjudication / Hit Ranking` | `UN_Consolidated & OFAC_SDN` | Advanced | `ESCALATE` |
| **SPL-010** | Multi-Source Sanctions Match (UN & OFAC Cross-Listing) | `Cross-Jurisdictional Screening / Multi-Feed Reconciliation` | `UN_Consolidated & OFAC_SDN` | Advanced | `CONFIRM_BLOCK` |
| **SPL-011** | Sales Order Compliance Hold & RFC Propagation | `Sales Order Integration / CIF RFC Sync` | `UN_Consolidated` | Intermediate | `CONFIRM_BLOCK` |
| **SPL-012** | Purchase Order Block (Inbound Supply Chain) | `Procurement Compliance / Inbound Legal Control` | `OFAC_SDN` | Intermediate | `CONFIRM_BLOCK` |
| **SPL-013** | Outbound Delivery Block & EWM Wave Picking Halt | `Outbound Logistics / EWM Wave Management` | `OFAC_NonSDN_Primary` | Advanced | `RELEASE` |
| **SPL-014** | Source Update Delta & Periodic Re-Screening | `Periodic Batch Re-Screening / Delta Ingestion` | `FIU_Recent_Updates` | Advanced | `CONFIRM_BLOCK` |
| **SPL-015** | DGFT SCOMET Separation (Export Control vs Party Sanctions) | `Product Export Control / Dual-Use Licensing` | `Source_Register (DGFT SCOMET List 2025)` | Advanced | `ASSIGN_LICENSE` |

---

## 3. Comprehensive Scenario Modules (Detailed Lab Walkthroughs)

### SPL-001: Exact Sanctioned-Party Name Match (UN Consolidated)

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Beginner**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `UN_Consolidated`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10001` — **GEDO HAMDAN AHMED**
  * **Role**: Customer (Sold-To / Ship-To)
  * **Location**: Industrial Port Area, Wharf 4, Port Sudan, **Sudan**
  * **Tax ID / Commercial Registration**: `SD-TR-904128`
* **Synthetic Document**: `NX-SO-800001` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 1,42,500`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "UN Consolidated Sanctions List",
  "entityId": "SDi.007",
  "dataId": "6909526",
  "primaryName": "GEDO HAMDAN AHMED",
  "unListType": "Sudan",
  "listedDate": "2026-02-24",
  "designation": "Individual",
  "comments": "Gender: Male.",
  "aliases": "QUALITY=Good; ALIAS_NAME=ABU NASHUK",
  "officialUrl": "https://scsanctions.un.org/resources/xml/en/name/consolidated.xml"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **100%**
* **Technical Match Basis**: Exact 100% full-name identity against UN Consolidated Sanctions List

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Confirmed exact identity match against UN Security Council Consolidated List (SDi.007 Sudan Sanctions). Permanent legal block enforced."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK/VBAP.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Sales Order NX-SO-800001 is placed on compliance hold because customer 'GEDO HAMDAN AHMED' has an exact match with UN list entry SDi.007.
2. **Why does GTS perform this check?**  
   Under UN Security Council resolutions (incorporated into national trade laws such as India UAPA Section 51A), supplying goods to designated persons carries strict liability.
3. **Which data is evaluated?**  
   Business partner full name, country code (SD), and address tokens are compared against the UN Consolidated XML database.
4. **What does the officer need to review?**  
   The officer must verify if the customer is indeed the sanctioned individual or a homonym with distinct identity documents.
5. **What decision options are available?**  
   1. Confirmed Match — Block (Permanent rejection), 2. False Positive — Release (Clear hold), 3. Escalate (Send for Director 4-eyes review).
6. **What happens after release?**  
   If released, GTS transmits a qRFC message to S/4HANA clearing VBAK-LIFSK and signals EWM to proceed with warehouse picking.
7. **What happens after block?**  
   If confirmed blocked, GTS instructs S/4HANA to set Rejection Reason '98' and cancels the corresponding outbound delivery request in EWM.
8. **How does S/4HANA react?**  
   S/4HANA sets delivery block 01 on the sales order header, preventing outbound delivery creation (VL01N).
9. **How does EWM react?**  
   EWM blocks warehouse wave picking and prevents task generation until legal clearance is received.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how synchronous SPL screening during sales order creation (/SAPSLL/SPL_CHCK) communicates via RFC destination to update VBAK-LIFSK in real-time."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Assuming an exact name match means the software should automatically cancel the order without human review. Trade law requires human legal review and logged rationale before permanent commercial disruption.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **An exact name match is not automatically a confirmed identity. The compliance officer must compare additional identifiers, review source evidence, and record a reasoned decision.**

---
### SPL-002: Exact OFAC SDN Match (Corporate Entity)

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Beginner**
* **SAP GTS Transaction Code**: `/SAPSLL/BL_DOCS`
* **Governing Sanctions Authority**: `OFAC_SDN`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-VEND-20001` — **AEROCARIBBEAN AIRLINES**
  * **Role**: Vendor (Inbound Supplier)
  * **Location**: Terminal A, Jose Marti International, Havana, **Cuba**
  * **Tax ID / Commercial Registration**: `CU-CORP-0036`
* **Synthetic Document**: `NX-PO-450001` (Standard Purchase Order (NB))
  * **Material / Line Item**: `NX-MAT-100002` — *Turbine Blade Castings & Maintenance Spares*
  * **Transactional Value**: `EUR 88,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Specially Designated Nationals (SDN) List",
  "entityId": "SDN-36",
  "dataId": "36",
  "primaryName": "AEROCARIBBEAN AIRLINES",
  "program": "CUBA",
  "officialUrl": "https://sanctionslist.ofac.treas.gov/Home/SdnList"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **100%**
* **Technical Match Basis**: Exact 100% full-name identity against OFAC SDN List (Program: CUBA)

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Confirmed direct entity match with OFAC SDN list (Ent Num 36, Program CUBA). Inbound procurement purchase order blocked under primary sanctions compliance."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Purchase Order NX-PO-450001 is locked because vendor 'AEROCARIBBEAN AIRLINES' matches an active entity on the OFAC SDN List.
2. **Why does GTS perform this check?**  
   OFAC regulations prohibit entities subject to US jurisdiction from engaging in commercial contracts or financial transfers with designated Cuban entities.
3. **Which data is evaluated?**  
   Vendor name, country of incorporation (CU), and address details.
4. **What does the officer need to review?**  
   Verify if the procurement is permitted under any general license or if immediate hard block must be ratified.
5. **What decision options are available?**  
   1. Confirmed Match — Block, 2. Escalate for Legal Counsel Review, 3. False Positive — Release (rare for exact corporate matches).
6. **What happens after release?**  
   Allows S/4HANA to post goods receipt in MIGO.
7. **What happens after block?**  
   Locks PO line items with deletion/compliance hold flag.
8. **How does S/4HANA react?**  
   Sets procurement block in EKKO header, disabling goods receipt and automated payment runs (F110).
9. **How does EWM react?**  
   Blocks creation of Inbound Delivery Notification (IDN) and Inbound Delivery (ID) in EWM.
10. **What should an SAP consultant explain in an interview?**  
   > *"Highlight that GTS covers both Inbound (Procurement/Vendor) and Outbound (Sales/Customer) supply chains."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Failing to realize that procurement transactions (Purchase Orders) are subject to SPL screening just as rigorously as export sales orders.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Corporate sanctions screening must verify corporate registration and primary operating jurisdiction against OFAC program parameters.**

---
### SPL-003: Alias Match with Primary Entity Resolution

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Intermediate**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `OFAC_NonSDN_Aliases`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10002` — **ABU TAIR, Mohammed Mahmud**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Beit Hanina Commercial Center, Jerusalem, **Israel / Palestinian Territories**
  * **Tax ID / Commercial Registration**: `IL-VAT-964012`
* **Synthetic Document**: `NX-SO-800002` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 46,200`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Non-SDN List",
  "entityId": "NSDN-9640",
  "dataId": "9640",
  "primaryName": "ABU TEIR, Mohammed",
  "matchedAlias": "ABU TAIR, Mohammed Mahmud",
  "aliasType": "aka",
  "program": "NS-PLC",
  "remarks": "DOB 1951; POB Umm Tuba.",
  "officialUrl": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **98%**
* **Technical Match Basis**: Exact match against official alias: "ABU TAIR, Mohammed Mahmud" (resolves to primary entity: ABU TEIR, Mohammed)

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Confirmed alias match against official OFAC Non-SDN record (Ent Num 9640, primary entity ABU TEIR, Mohammed). Primary program NS-PLC enforced."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Customer entered as 'ABU TAIR, Mohammed Mahmud' matches an official AKA alias linked to primary entity 'ABU TEIR, Mohammed' (Ent Num 9640).
2. **Why does GTS perform this check?**  
   Sanctioned individuals frequently operate under alternative transliterations or pseudonyms to bypass automated filters.
3. **Which data is evaluated?**  
   Alias text string against OFAC Non-SDN Aliases table, linked to Primary Entity table via Ent Num 9640.
4. **What does the officer need to review?**  
   Verify primary entity restrictions, DOB (1951), and POB (Umm Tuba) against customer master data.
5. **What decision options are available?**  
   1. Confirmed Block, 2. Escalate for enhanced due diligence, 3. False Positive (if customer DOB/national ID differs).
6. **What happens after release?**  
   Permits document execution if identity is conclusively disproved.
7. **What happens after block?**  
   Enforces legal hold and logs alias-to-primary mapping in audit trail.
8. **How does S/4HANA react?**  
   Applies delivery block 01 on sales order NX-SO-800002.
9. **How does EWM react?**  
   Prevents warehouse wave assignment in EWM.
10. **What should an SAP consultant explain in an interview?**  
   > *"Emphasize that GTS maintains separate database tables for Primary Names (/SAPSLL/TSPL) and Aliases (/SAPSLL/TSPLAL)."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Viewing the matched alias in isolation without navigating to the primary entity record to inspect the comprehensive sanctions program and DOB remarks.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **An alias match requires reviewing the primary record's official scope before taking final action.**

---
### SPL-004: Alias with Spelling & Transliteration Variation

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Intermediate**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `OFAC_NonSDN_Aliases`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10003` — **Mohammad Mahmoud Abou Tayr**
  * **Role**: Customer (Sold-To Party)
  * **Location**: East Jerusalem Business District, Jerusalem, **Israel / Palestinian Territories**
  * **Tax ID / Commercial Registration**: `IL-VAT-964013`
* **Synthetic Document**: `NX-SO-800003` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 30,800`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Non-SDN List",
  "entityId": "NSDN-9640",
  "dataId": "9640",
  "primaryName": "ABU TEIR, Mohammed",
  "matchedAlias": "ABOU TAYR, Mohammad Mahmoud",
  "aliasType": "aka",
  "program": "NS-PLC",
  "remarks": "DOB 1951; POB Umm Tuba.",
  "officialUrl": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **92%**
* **Technical Match Basis**: High-confidence fuzzy alias match against official alias: "ABOU TAYR, Mohammad Mahmoud" (Alt Num: 9153)

#### Officer Adjudication Protocol
* **Required Officer Action**: `ESCALATE`
* **Required Reason Code**: `RC04`
* **Mandatory Officer Comment**:  
  > *"Fuzzy transliteration variation matches official alias Alt Num 9153. Escalated to Senior Compliance Director for secondary document verification."*

#### Downstream System Impact
* **SAP GTS Final Status**: `UNDER_REVIEW`
* **SAP S/4HANA (Feeder ERP)**: `COMPLIANCE REVIEW IN PROGRESS: Feeder system delivery block remains active pending four-eyes approval.`
* **SAP EWM (Warehouse Execution)**: `ON HOLD: Warehouse execution suspended pending compliance review completion.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Customer name 'Mohammad Mahmoud Abou Tayr' has inverted word order and no comma compared to 'ABOU TAYR, Mohammad Mahmoud'. GTS matcher identifies 92% similarity.
2. **Why does GTS perform this check?**  
   Names originating from non-Latin alphabets often have multiple valid English transliterations.
3. **Which data is evaluated?**  
   Token overlap, Levenshtein distance, and phonetic search index.
4. **What does the officer need to review?**  
   Determine whether the phonetic variation represents the same person.
5. **What decision options are available?**  
   1. Escalate for 4-eyes review (Recommended), 2. Confirm Block, 3. Release if identity documents prove otherwise.
6. **What happens after release?**  
   Clears delivery block if senior officer approves.
7. **What happens after block?**  
   Permanently halts order processing.
8. **How does S/4HANA react?**  
   Maintains delivery block 01 in S/4HANA.
9. **How does EWM react?**  
   Warehouse order remains in status 'Waiting for Legal Clearance'.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how GTS SPRO defines 'Search Procedure for SPL Screening' with configurable fuzzy thresholds."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Discarding a potential hit simply because punctuation (commas) or name token order (Given Name vs Surname) differs from the master record.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Transliteration differences in Arabic, Cyrillic, or Asian names are common in international trade. Officers must not dismiss matches based solely on punctuation or word order.**

---
### SPL-005: Address Supporting Evidence Resolution

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `OFAC_NonSDN_Addresses`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10004` — **Jamileh Abdullah Al-Shanti**
  * **Role**: Customer (Ship-To Party)
  * **Location**: Main Street, Jabalia District, Gaza, **Palestinian Territories**
  * **Tax ID / Commercial Registration**: `PS-TAX-964101`
* **Synthetic Document**: `NX-SO-800004` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 56,400`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Non-SDN List",
  "entityId": "NSDN-9641",
  "dataId": "9641",
  "primaryName": "AL-SHANTI, Jamileh Abdullah",
  "program": "NS-PLC",
  "remarks": "DOB 1955; POB Jabalia Camp.",
  "matchedAddressNum": "12128",
  "addressDetails": "Gaza, Palestinian",
  "officialUrl": "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **96%**
* **Technical Match Basis**: High-confidence composite match: Name identity + corroborating geographic location (Gaza / Palestinian Territories, Address Num: 12128)

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Composite match verified: Name matches Ent Num 9641 and address matches Address Num 12128 (Gaza / Palestinian Territories). POB remarks (Jabalia Camp) corroborated."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Customer name matches Ent Num 9641 and delivery address matches Address Num 12128 ('Gaza', 'Palestinian').
2. **Why does GTS perform this check?**  
   Sanctions lists include known physical locations to help officers verify common names.
3. **Which data is evaluated?**  
   Customer name, city ('Gaza'), country ('PS'), and POB remarks ('Jabalia Camp').
4. **What does the officer need to review?**  
   Compare the synthetic delivery address with the official listed address records in /SAPSLL/TSPLAD.
5. **What decision options are available?**  
   1. Confirmed Match — Block (Address corroborates identity), 2. False Positive (if address is completely unrelated).
6. **What happens after release?**  
   Would clear hold if address contradicted the listing.
7. **What happens after block?**  
   Applies hard block in S/4HANA.
8. **How does S/4HANA react?**  
   Maintains delivery block in S/4HANA.
9. **How does EWM react?**  
   Warehouse execution remains stopped.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how GTS supports address screening through the /SAPSLL/TSPLAD database table."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Relying on name matching alone or assuming address data alone proves identity. Address serves as corroborating evidence in composite scoring.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Address data alone does not create a sanctions block, but matching city/country data strongly corroborates a potential name match.**

---
### SPL-006: False Positive Due to Distinct Identifiers

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Beginner**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `OFAC_SDN`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10005` — **BANCO NACIONAL DE CREDITO SA**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Paseo de la Castellana 88, Madrid, **Spain**
  * **Tax ID / Commercial Registration**: `ES-A28001928`
* **Synthetic Document**: `NX-SO-800005` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `EUR 15,400`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Specially Designated Nationals (SDN) List",
  "entityId": "SDN-306",
  "dataId": "306",
  "primaryName": "BANCO NACIONAL DE CUBA",
  "program": "CUBA",
  "remarks": "a.k.a. 'BNC'.",
  "officialUrl": "https://sanctionslist.ofac.treas.gov/Home/SdnList"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **82%**
* **Technical Match Basis**: Partial fuzzy name similarity (82%) with Cuban state entity 'BANCO NACIONAL DE CUBA' (Ent Num: 306)

#### Officer Adjudication Protocol
* **Required Officer Action**: `RELEASE`
* **Required Reason Code**: `RC01`
* **Mandatory Officer Comment**:  
  > *"False positive identity disproved. Customer is a regulated Spanish commercial financial institution in Madrid (Tax ID: ES-A28001928), completely distinct from the Cuban government bank (Ent Num 306)."*

#### Downstream System Impact
* **SAP GTS Final Status**: `RELEASED`
* **SAP S/4HANA (Feeder ERP)**: `CLEARED: Delivery Block 01 removed in VBAK/VBEP. Feeder status synced via RFC.`
* **SAP EWM (Warehouse Execution)**: `RELEASED: Warehouse Outbound Delivery created. Picking waves activated in EWM.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Order NX-SO-800005 is held due to 82% token similarity between 'BANCO NACIONAL DE CREDITO SA' and 'BANCO NACIONAL DE CUBA'.
2. **Why does GTS perform this check?**  
   Automated screening casts a wide net based on search index thresholds to avoid false negatives.
3. **Which data is evaluated?**  
   Name tokens, jurisdiction (Spain vs Cuba), tax identification, and corporate ownership.
4. **What does the officer need to review?**  
   Verify customer credentials and prove independence from the sanctioned Cuban state entity.
5. **What decision options are available?**  
   1. False Positive — Release (Recommended), 2. Escalate if cross-border ownership is unclear.
6. **What happens after release?**  
   GTS immediately dispatches an RFC queue to S/4HANA clearing delivery block '01', allowing warehouse wave creation in EWM.
7. **What happens after block?**  
   Would erroneously halt legitimate EU commercial operations.
8. **How does S/4HANA react?**  
   Removes delivery block 01 in VBAK.
9. **How does EWM react?**  
   Unlocks warehouse delivery request and allows picking wave generation.
10. **What should an SAP consultant explain in an interview?**  
   > *"Highlight the use of /SAPSLL/CHG_LOG to audit every release decision."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Releasing a hit without recording evidence and justification in the audit trail, which exposes the company to regulatory fines during trade compliance audits.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Documenting why an entity is NOT a match is just as critical as documenting why an entity IS a match. Auditors review release rationale during trade inspections.**

---
### SPL-007: No Match (Clean Fictional Partner)

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Beginner**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `ALL_ACTIVE_LISTS`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10006` — **NEXUS TRAINING PARTNER 999**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Plot 42, Electronic City Phase 1, Bengaluru, **India**
  * **Tax ID / Commercial Registration**: `29AABCN9999Z1Z5`
* **Synthetic Document**: `NX-SO-800006` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 72,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
*No matching record on official sanctions lists. Verified clean or incomplete input.*

#### Screening Engine Dynamics
* **Initial Screening Result**: `Screened — no potential match`
* **Simulated Match Score**: **0%**
* **Technical Match Basis**: No matching entities or aliases detected across active sanctions databases

#### Officer Adjudication Protocol
* **Required Officer Action**: `NO_ACTION_REQUIRED`
* **Required Reason Code**: `N/A`
* **Mandatory Officer Comment**:  
  > *"Automated screening successful: 0 hits returned. Document cleared for immediate fulfillment."*

#### Downstream System Impact
* **SAP GTS Final Status**: `RELEASED`
* **SAP S/4HANA (Feeder ERP)**: `CLEARED: Feeder system document unblocked. No compliance hold applied.`
* **SAP EWM (Warehouse Execution)**: `ELIGIBLE_FOR_EXECUTION: Outbound delivery ready for immediate wave picking.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Order NX-SO-800006 is evaluated against 22,639 sanctions records. Zero potential matches are found.
2. **Why does GTS perform this check?**  
   Every transactional document must be logged with a positive verification record for regulatory auditability.
3. **Which data is evaluated?**  
   Partner name and address against UN and OFAC master tables.
4. **What does the officer need to review?**  
   No officer review needed; status is automated clean pass.
5. **What decision options are available?**  
   System handles automatically.
6. **What happens after release?**  
   Outbound delivery is generated automatically in S/4HANA.
7. **What happens after block?**  
   N/A.
8. **How does S/4HANA react?**  
   Sales order is saved with LIFSK = '' (Blank / Unblocked).
9. **How does EWM react?**  
   Warehouse tasks are immediately eligible for wave release.
10. **What should an SAP consultant explain in an interview?**  
   > *"Discuss synchronous CIF RFC execution time (typically < 300ms) for clean sales orders."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Assuming all transactions require human officer review. GTS is designed to automate 95%+ of clean transactions straight-through.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Straight-through processing (STP) is the primary ROI driver of SAP GTS. The screening index and exclusion words ensure clean orders flow instantly.**

---
### SPL-008: Incomplete Master Data (Missing Mandatory Attributes)

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Beginner**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `N/A (Data Quality Guard)`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10007` — **GLOBAL TRADE LOGISTICS CO**
  * **Role**: Customer (Incomplete Record)
  * **Location**: N/A, N/A, **Unspecified**
  * **Tax ID / Commercial Registration**: `Missing / Incomplete`
* **Synthetic Document**: `NX-SO-800007` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 35,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
*No matching record on official sanctions lists. Verified clean or incomplete input.*

#### Screening Engine Dynamics
* **Initial Screening Result**: `Insufficient data — request information`
* **Simulated Match Score**: **0%**
* **Technical Match Basis**: Payload missing mandatory screening parameters (Country, Street, Tax Registration)

#### Officer Adjudication Protocol
* **Required Officer Action**: `INSUFFICIENT_DATA`
* **Required Reason Code**: `RC05`
* **Mandatory Officer Comment**:  
  > *"Screening cannot be certified complete due to missing country and address data. Document remains on technical hold pending master data enrichment in S/4HANA."*

#### Downstream System Impact
* **SAP GTS Final Status**: `UNDER_REVIEW`
* **SAP S/4HANA (Feeder ERP)**: `DATA INCOMPLETE HOLD: Feeder sales order blocked pending master data maintenance in BP transaction.`
* **SAP EWM (Warehouse Execution)**: `ON HOLD: Warehouse execution suspended pending compliance review completion.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Order NX-SO-800007 contains a partner without country or address data.
2. **Why does GTS perform this check?**  
   Trade laws require screening against country-specific sanctions lists; screening without country is incomplete.
3. **Which data is evaluated?**  
   Validation of mandatory fields: Name, Country, Address.
4. **What does the officer need to review?**  
   Instruct the commercial sales operations team to update master data in S/4HANA BP.
5. **What decision options are available?**  
   1. Request Information / Maintain Incomplete Hold, 2. Do not release.
6. **What happens after release?**  
   Releasing without address violates standard compliance operating procedures.
7. **What happens after block?**  
   Order remains on hold until enriched.
8. **How does S/4HANA react?**  
   Feeder document remains in delivery block.
9. **How does EWM react?**  
   Warehouse execution remains blocked.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how GTS error logs in SLG1 flag incomplete business partner replication."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Releasing a document with missing data under the assumption that 'no hits were found'. Screening with missing data provides zero legal protection.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **A screening engine is only as good as the input data. Missing country codes prevent jurisdiction-based sanctions filtering.**

---
### SPL-009: Multiple Ranked Candidate Review

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `UN_Consolidated & OFAC_SDN`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10008` — **AHMED MOHAMMED TRADING**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Al-Rigga Road, Deira, Dubai, **United Arab Emirates**
  * **Tax ID / Commercial Registration**: `AE-TRN-1002948`
* **Synthetic Document**: `NX-SO-800008` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 1,12,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "candidateCount": 4,
  "sampleCandidate": {
    "entityId": "QDi.019",
    "name": "ABDULLAH AHMED ABDULLAH",
    "sourceList": "UN Consolidated Sanctions List"
  }
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **84%**
* **Technical Match Basis**: Multiple candidate matches returned for common tokens 'AHMED' and 'MOHAMMED' across UN and OFAC databases

#### Officer Adjudication Protocol
* **Required Officer Action**: `ESCALATE`
* **Required Reason Code**: `RC04`
* **Mandatory Officer Comment**:  
  > *"Multiple candidate hits identified across UN and OFAC lists. Escalated for candidate-by-candidate entity disambiguation."*

#### Downstream System Impact
* **SAP GTS Final Status**: `UNDER_REVIEW`
* **SAP S/4HANA (Feeder ERP)**: `COMPLIANCE REVIEW IN PROGRESS: Feeder system delivery block remains active pending four-eyes approval.`
* **SAP EWM (Warehouse Execution)**: `ON HOLD: Warehouse execution suspended pending compliance review completion.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Screening produces 4 distinct candidate matches due to common name tokens.
2. **Why does GTS perform this check?**  
   Prevents false negatives by surfacing all candidates above the configured percentage threshold.
3. **Which data is evaluated?**  
   Token similarity ranking across multiple entities.
4. **What does the officer need to review?**  
   Examine each candidate's full profile to rule them in or out.
5. **What decision options are available?**  
   1. Escalate (Recommended for disambiguation), 2. Confirm block if one candidate is proven, 3. Release if all candidates are disproved.
6. **What happens after release?**  
   Only permissible if all returned candidates are proven non-identical.
7. **What happens after block?**  
   Applies if any one candidate is verified as the customer.
8. **How does S/4HANA react?**  
   Maintains delivery hold in S/4HANA.
9. **How does EWM react?**  
   Warehouse execution paused.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how GTS displays the comparison hit list with individual match percentage bars."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Reviewing only the top ranked result and ignoring other candidates that might represent the actual sanctioned entity.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **High token frequency names require strict disambiguation using secondary identifiers such as passport numbers or national tax IDs.**

---
### SPL-010: Multi-Source Sanctions Match (UN & OFAC Cross-Listing)

#### Overview & Categorization
* **Category**: Sanctioned Party List Screening
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `UN_Consolidated & OFAC_SDN`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10009` — **ABU SAYYAF GROUP**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Jolo Island Commercial Complex, Jolo, Sulu, **Philippines**
  * **Tax ID / Commercial Registration**: `PH-SEC-468800`
* **Synthetic Document**: `NX-SO-800009` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 3,85,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "unRecord": {
    "entityId": "QDe.001",
    "dataId": "113445",
    "name": "ABU SAYYAF GROUP",
    "listType": "Al-Qaida",
    "listedDate": "2001-10-06",
    "aliases": "QUALITY=a.k.a.; ALIAS_NAME=Al Harakat Al Islamiyya"
  },
  "ofacRecord": {
    "entityId": "SDN-4688",
    "name": "ABU SAYYAF GROUP",
    "program": "FTO] [SDGT"
  },
  "officialUrl": "https://scsanctions.un.org & https://sanctionslist.ofac.treas.gov"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **100%**
* **Technical Match Basis**: Simultaneous 100% exact match across UN Consolidated (QDe.001) and OFAC SDN List (Ent Num: 4688, [FTO] [SDGT])

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"CRITICAL COMPLIANCE BLOCK: Cross-jurisdictional match confirmed across UN Security Council (QDe.001) and US OFAC (Ent Num 4688 FTO/SDGT). Permanent hard block enforced."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Customer 'ABU SAYYAF GROUP' is detected simultaneously on both the UN Consolidated List (QDe.001) and the OFAC SDN List (4688).
2. **Why does GTS perform this check?**  
   Global enterprises must comply with both local jurisdiction laws and US extraterritorial sanctions.
3. **Which data is evaluated?**  
   Name match against UN XML and OFAC CSV feeds.
4. **What does the officer need to review?**  
   Confirm identity and trigger mandatory enterprise legal escalations.
5. **What decision options are available?**  
   1. Confirmed Hard Block (Immediate), 2. Under no circumstances may this be released.
6. **What happens after release?**  
   Release is strictly prohibited under international sanctions treaties.
7. **What happens after block?**  
   Permanently cancels the order in S/4HANA and files internal suspicious activity reports.
8. **How does S/4HANA react?**  
   Sets rejection code 98 in VBAK and locks the business partner globally in BP transaction.
9. **How does EWM react?**  
   All logistics activity halted.
10. **What should an SAP consultant explain in an interview?**  
   > *"Discuss how multiple Legal Regulations (LEGLG) in GTS can be configured concurrently."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Closing an investigation after satisfying one national list while failing to address obligations under other applicable international frameworks.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Cross-listed entities represent maximum compliance risk. Rejection Reason 98 must be immediately written to the feeder system.**

---
### SPL-011: Sales Order Compliance Hold & RFC Propagation

#### Overview & Categorization
* **Category**: Document Compliance / Feeder Integration
* **Difficulty Level**: **Intermediate**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `UN_Consolidated`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10001` — **GEDO HAMDAN AHMED**
  * **Role**: Customer (Sold-To Party)
  * **Location**: Industrial Port Area, Wharf 4, Port Sudan, **Sudan**
  * **Tax ID / Commercial Registration**: `SD-TR-904128`
* **Synthetic Document**: `NX-SO-800001` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 1,42,500`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "UN Consolidated Sanctions List",
  "entityId": "SDi.007",
  "primaryName": "GEDO HAMDAN AHMED",
  "unListType": "Sudan"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **100%**
* **Technical Match Basis**: Exact match against UN Consolidated list entry SDi.007

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Sales order blocked by SPL screening. Feeder system delivery block confirmed via /SAPSLL/BL_DOCS."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Sales Order NX-SO-800001 is placed in blocked documents worklist (/SAPSLL/BL_DOCS).
2. **Why does GTS perform this check?**  
   Ensures no sales order can generate an outbound delivery while subject to a compliance query.
3. **Which data is evaluated?**  
   All document partner roles replicated from S/4HANA table VBPA.
4. **What does the officer need to review?**  
   Adjudicate the document block in /SAPSLL/BL_DOCS.
5. **What decision options are available?**  
   1. Confirm Block, 2. Release Document, 3. Escalate.
6. **What happens after release?**  
   Clears VBAK-LIFSK via qRFC.
7. **What happens after block?**  
   Writes rejection reason 98 to VBAK-ABGRU.
8. **How does S/4HANA react?**  
   Maintains delivery block 01.
9. **How does EWM react?**  
   Warehouse delivery creation blocked.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain the role of CIF user exits in S/4HANA (e.g. SLL_PI_S4HANA_CIF)."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Confusing Business Partner screening (/SAPSLL/SPL_CHCK) with Document screening (/SAPSLL/BL_DOCS). Document screening evaluates the whole transaction including ship-to, carrier, and bill-to parties.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Document screening evaluates all partner functions on the order (Sold-to, Ship-to, Forwarder, Bill-to). A block on any partner blocks the whole document.**

---
### SPL-012: Purchase Order Block (Inbound Supply Chain)

#### Overview & Categorization
* **Category**: Document Compliance / Feeder Integration
* **Difficulty Level**: **Intermediate**
* **SAP GTS Transaction Code**: `/SAPSLL/BL_DOCS`
* **Governing Sanctions Authority**: `OFAC_SDN`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-VEND-20001` — **AEROCARIBBEAN AIRLINES**
  * **Role**: Vendor (Inbound Supplier)
  * **Location**: Terminal A, Jose Marti International, Havana, **Cuba**
  * **Tax ID / Commercial Registration**: `CU-CORP-0036`
* **Synthetic Document**: `NX-PO-450001` (Standard Purchase Order (NB))
  * **Material / Line Item**: `NX-MAT-100002` — *Turbine Blade Castings & Maintenance Spares*
  * **Transactional Value**: `EUR 88,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Specially Designated Nationals (SDN) List",
  "entityId": "SDN-36",
  "primaryName": "AEROCARIBBEAN AIRLINES",
  "program": "CUBA"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **100%**
* **Technical Match Basis**: Exact match against OFAC SDN List (Ent Num: 36)

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Purchase order blocked due to vendor sanctions listing. Procurement block ratified under OFAC sanctions compliance."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Purchase Order NX-PO-450001 is placed on inbound compliance hold.
2. **Why does GTS perform this check?**  
   Regulatory prohibition against remitting funds or receiving property from designated entities.
3. **Which data is evaluated?**  
   Vendor details, supplying plant, country of origin.
4. **What does the officer need to review?**  
   Investigate whether the vendor is an authorized supplier or subject to strict sanctions.
5. **What decision options are available?**  
   1. Confirm Block, 2. Escalate, 3. False Positive.
6. **What happens after release?**  
   Allows MIGO goods receipt.
7. **What happens after block?**  
   Sets deletion flag on PO line items in S/4HANA.
8. **How does S/4HANA react?**  
   Sets block indicator on EKKO header.
9. **How does EWM react?**  
   Inbound delivery processing disabled in EWM.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain how GTS supports both MM (Purchasing) and SD (Sales) integration."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Focusing solely on export compliance and neglecting inbound trade compliance. Purchasing from sanctioned suppliers violates OFAC and global regulations.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Inbound supply chain screening is critical for preventing indirect financing of prohibited regimes.**

---
### SPL-013: Outbound Delivery Block & EWM Wave Picking Halt

#### Overview & Categorization
* **Category**: Warehouse Logistics / EWM Integration
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `OFAC_NonSDN_Primary`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10004` — **Jamileh Abdullah Al-Shanti**
  * **Role**: Customer (Ship-To Party)
  * **Location**: Main Street, Jabalia District, Gaza, **Palestinian Territories**
  * **Tax ID / Commercial Registration**: `PS-TAX-964101`
* **Synthetic Document**: `NX-DEL-900001` (Outbound Delivery (LF))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 56,400`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "OFAC Non-SDN List",
  "entityId": "NSDN-9641",
  "primaryName": "AL-SHANTI, Jamileh Abdullah",
  "program": "NS-PLC"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **96%**
* **Technical Match Basis**: High-confidence composite match against OFAC Non-SDN record NSDN-9641

#### Officer Adjudication Protocol
* **Required Officer Action**: `RELEASE`
* **Required Reason Code**: `RC01`
* **Mandatory Officer Comment**:  
  > *"Verified during pre-shipment audit: End-user customer is a registered municipal infrastructure department with distinct registration documents. False positive cleared for delivery."*

#### Downstream System Impact
* **SAP GTS Final Status**: `RELEASED`
* **SAP S/4HANA (Feeder ERP)**: `CLEARED: Delivery Block 01 removed in VBAK/VBEP. Feeder status synced via RFC.`
* **SAP EWM (Warehouse Execution)**: `RELEASED: Warehouse Outbound Delivery created. Picking waves activated in EWM.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Outbound Delivery NX-DEL-900001 is replicated to EWM with status 'Blocked by GTS'. Warehouse picking waves are halted.
2. **Why does GTS perform this check?**  
   Pre-shipment verification prevents goods from physically leaving the warehouse dock.
3. **Which data is evaluated?**  
   Delivery document header, ship-to party, and logistics forwarder.
4. **What does the officer need to review?**  
   Adjudicate the delivery before physical loading begins.
5. **What decision options are available?**  
   1. Release (Unlocks picking), 2. Confirm Block (Cancels delivery).
6. **What happens after release?**  
   EWM generates picking warehouse tasks and assigns items to the next picking wave.
7. **What happens after block?**  
   EWM cancels the warehouse delivery order and returns stock to bin storage.
8. **How does S/4HANA react?**  
   Clears delivery block flag in LIKP.
9. **How does EWM react?**  
   Unlocks warehouse delivery order for picking wave execution.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain status profile 'DCO' in SAP EWM and how it ties to GTS /SAPSLL/BL_DOCS."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Believing that EWM can begin physical warehouse picking while an outbound delivery has an active GTS compliance block.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **EWM integration is fail-safe. If GTS is unavailable or documents are blocked, EWM automatically withholds physical warehouse inventory movement.**

---
### SPL-014: Source Update Delta & Periodic Re-Screening

#### Overview & Categorization
* **Category**: Sanctions Master Data / Source Updates
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/SPL_CHCK`
* **Governing Sanctions Authority**: `FIU_Recent_Updates`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10010` — **KHALAF ENTERPRISES**
  * **Role**: Customer (Existing Master Partner)
  * **Location**: Damascus Highway Sector 4, Damascus, **Syria**
  * **Tax ID / Commercial Registration**: `SY-REG-202503`
* **Synthetic Document**: `NX-SO-800010` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100001` — *High-Pressure Hydraulic Servo Valves*
  * **Transactional Value**: `USD 75,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceList": "FIU-India Sanctions Updates / UNSC Delta Feed",
  "noticeDate": "2025-03-12",
  "action": "Amended 12 entries",
  "sanctionsCommittee": "ISIL (Da’esh) and Al-Qaida",
  "officialUrl": "https://fiuindia.gov.in/pdfs/downloads/Update12032025.pdf"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Potential match — manual review required`
* **Simulated Match Score**: **88%**
* **Technical Match Basis**: Delta re-screening triggered by FIU Notice Date 2025-03-12 (Amended 12 entries). Existing clean partner matched amended entry.

#### Officer Adjudication Protocol
* **Required Officer Action**: `CONFIRM_BLOCK`
* **Required Reason Code**: `RC02`
* **Mandatory Officer Comment**:  
  > *"Re-screening triggered by FIU/UNSC master data update. Confirmed match against newly amended sanctions list."*

#### Downstream System Impact
* **SAP GTS Final Status**: `CONFIRMED_BLOCK`
* **SAP S/4HANA (Feeder ERP)**: `PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.`
* **SAP EWM (Warehouse Execution)**: `CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   FIU-India / UNSC update introduces amended sanctions entries. Background job /SAPSLL/SPL_RESCR re-screens master partners and flags customer 'KHALAF ENTERPRISES'.
2. **Why does GTS perform this check?**  
   Sanctions designations apply immediately upon governmental publication; companies must re-screen active master data.
3. **Which data is evaluated?**  
   Delta differences between previous and updated XML master versions.
4. **What does the officer need to review?**  
   Review partners newly blocked by the periodic re-screening batch run.
5. **What decision options are available?**  
   1. Confirm Block, 2. Release if distinct, 3. Escalate.
6. **What happens after release?**  
   Restores partner to approved status.
7. **What happens after block?**  
   Blocks all open sales orders for this partner across S/4HANA.
8. **How does S/4HANA react?**  
   Retroactively places delivery blocks on all open sales orders.
9. **How does EWM react?**  
   Stops pending warehouse picking for open deliveries.
10. **What should an SAP consultant explain in an interview?**  
   > *"Discuss transaction /SAPSLL/SPL_RESCR and how SM37 background jobs are scheduled."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Assuming that once a business partner is approved, it remains approved forever. Sanctions lists change daily, requiring automated re-screening.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Batch re-screening in background job mode is essential for regulatory compliance. It ensures newly designated parties are caught even if no new sales order was created today.**

---
### SPL-015: DGFT SCOMET Separation (Export Control vs Party Sanctions)

#### Overview & Categorization
* **Category**: Export Control / Product Classification
* **Difficulty Level**: **Advanced**
* **SAP GTS Transaction Code**: `/SAPSLL/LIC_MGMT`
* **Governing Sanctions Authority**: `Source_Register (DGFT SCOMET List 2025)`
* **Evidence Baseline**: `Verified against uploaded source snapshot`

#### Synthetic Business Entities (Training Sandbox)
* **Synthetic Business Partner**: `NX-CUST-10006` — **NEXUS TRAINING PARTNER 999**
  * **Role**: Customer (Clean Japanese Importer)
  * **Location**: Chiyoda-ku, Marunouchi 1-1, Tokyo, **Japan**
  * **Tax ID / Commercial Registration**: `JP-CORP-999001`
* **Synthetic Document**: `NX-SO-800011` (Standard Sales Order (TA))
  * **Material / Line Item**: `NX-MAT-100003` — *Dual-Use Carbon Fiber Prepreg Composite (SCOMET 8A102)*
  * **Transactional Value**: `USD 2,45,000`
  * **Replication Origin**: Feeder System `S4H_100`

#### Real Sanctions Source Evidence
```json
{
  "sourceId": "IN-02",
  "authority": "India / DGFT, Ministry of Commerce and Industry",
  "listFeed": "SCOMET List 2025 (Appendix 3, Schedule 2, ITC (HS))",
  "useInGts": "Product / technology export-control screening; not a denied-party list",
  "statusCaveat": "Include as a separate product-control module; do not combine with party sanctions screening.",
  "officialUrl": "https://content.dgft.gov.in/Website/dgftprod/82cccea3-646e-435c-876f-88476c4ed5ca/Updated%20SCOMET%20List%202025%20%28as%20on%2023.09.2025%29.docx.pdf"
}
```

#### Screening Engine Dynamics
* **Initial Screening Result**: `Screened — no potential match (Party Clean / License Required)`
* **Simulated Match Score**: **0%**
* **Technical Match Basis**: SPL Party Screening: Clean pass (0 hits). Product Export Control: Flagged under DGFT SCOMET 2025 (Category 8A102) requiring government export license.

#### Officer Adjudication Protocol
* **Required Officer Action**: `ASSIGN_LICENSE`
* **Required Reason Code**: `LIC_SCOMET_01`
* **Mandatory Officer Comment**:  
  > *"Party screening clean. Product classification verified against DGFT SCOMET List 2025 Category 8A102. Assigned Directorate General of Foreign Trade dual-use export license authorization."*

#### Downstream System Impact
* **SAP GTS Final Status**: `RELEASED`
* **SAP S/4HANA (Feeder ERP)**: `CLEARED: Feeder system document unblocked. No compliance hold applied.`
* **SAP EWM (Warehouse Execution)**: `ELIGIBLE_FOR_EXECUTION: Outbound delivery ready for immediate wave picking.`

#### 💡 The 10-Point Learning Explanation Panel
1. **What is happening?**  
   Customer 'NEXUS TRAINING PARTNER 999' is completely clean on sanctions lists. However, document NX-SO-800011 is held under Export Control because material NX-MAT-100003 is classified under DGFT SCOMET Category 8A102.
2. **Why does GTS perform this check?**  
   DGFT regulations mandate government export authorizations for dual-use strategic goods to prevent illicit technology proliferation.
3. **Which data is evaluated?**  
   Material Master Export Control Classification (ECCN/SCOMET) and Destination Country (JP).
4. **What does the officer need to review?**  
   Assign an active DGFT export license in /SAPSLL/LIC_MGMT.
5. **What decision options are available?**  
   1. Assign Valid SCOMET Export License, 2. Block if no valid government license exists.
6. **What happens after release?**  
   Decrements license quota value and clears sales order hold in S/4HANA.
7. **What happens after block?**  
   Prevents shipment until government license is granted.
8. **How does S/4HANA react?**  
   Clears legal control block once valid license is assigned.
9. **How does EWM react?**  
   Releases warehouse delivery for packaging.
10. **What should an SAP consultant explain in an interview?**  
   > *"Explain the architectural difference between SPL (/SAPSLL/SPL_CHCK) and Legal Control (/SAPSLL/LIC_MGMT)."*

#### Common Mistakes to Avoid
> [!WARNING] Common Traps:  
> **Searching DGFT SCOMET lists in SPL screening engines. SCOMET is a dual-use technical goods classification, not a denied persons list.**

#### SAP Consultant Masterclass Note
> [!TIP] Consultant Insight:  
> **Never combine SCOMET product control data with sanctioned party screening. SCOMET determines whether an export license is legally mandated based on item capability and destination country.**

---

## 4. SAP GTS SPRO Configuration Reference Matrix

To configure these behaviors in an enterprise SAP GTS landscape, consultants navigate the Implementation Guide (IMG):

| IMG Path / Node | Technical Transaction / Table | Configuration Purpose |
|---|---|---|
| **Define Legal Regulations for SPL** | `/SAPSLL/TLEGLG` | Activates national and multilateral frameworks (e.g. UN_SEC, US_OFAC, EU_CFSP). |
| **Define Search Procedure for SPL** | `/SAPSLL/TSPLSP` | Configures fuzzy algorithms, Comparison Index, Levenshtein tolerance, and token weighting. |
| **Define Exclusion Words** | `/SAPSLL/TSPLEX` | Eliminates generic corporate suffixes (Ltd, Inc, GmbH, SA, Corp) to prevent false hits. |
| **Define Delimiter Characters** | `/SAPSLL/TSPLDL` | Specifies punctuation characters (hyphens, commas, periods) to strip during tokenization. |
| **Define Reason Codes for Partner Clearance** | `/SAPSLL/TRC` | Standardizes audit codes (`RC01` False Positive, `RC02` Confirmed Block, etc.). |
| **Configure Feeder System Plug-In Control** | `/SAPSLL/PLUGIN_S4H` | Dictates whether sales order blocks write `01` to `VBAK-LIFSK` synchronously or via batch. |
| **Define Document Types for Compliance** | `/SAPSLL/TDOC` | Maps SD Sales Orders (`TA`), Inbound POs (`NB`), and Deliveries (`LF`) to GTS customs document types. |

---

## 5. Summary & Learning Best Practices

1. **Never Bypass Mandatory Rationale**: In trade compliance, an unreasoned release is legally equivalent to willful negligence.
2. **Understand Dual-Control**: High-risk entities require 4-eyes approval before commercial releases can be executed.
3. **Respect Product Control Separation**: SCOMET and export control licensing must never be confused with denied-party screening.
