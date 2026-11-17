import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Extensive Dictionary & Registry of standard SAP Transaction Codes across:
 * - Basis / BC (RFC, Work Processes, Kernel Logs, Diagnostics)
 * - PP (Production Planning, Work Centers, Routing, Confirmations)
 * - EWM (Extended Warehouse Management, Staging, PSA, Warehouse Monitor)
 * - MM (Materials Management, Purchasing, Inventory, MRP)
 * - SD (Sales & Distribution, Deliveries, Billing)
 * - FI/CO (Financial Accounting & Controlling, Ledgers, Cost Centers)
 */
export const SAP_TCODE_REGISTRY = {
  // ─── BASIS / BC ────────────────────────────────────────────────────────────
  SMQ1: {
    code: "SMQ1",
    description: "qRFC Monitor (Outbound Queue) · Triage blocked transactional units",
    module: "Basis/BC",
    auth: ["S_RFC", "S_TABU_DIS"],
    safety: "Read-Only Triage",
    safetyType: "safe",
    category: "RFC Queue & Interface Diagnostics"
  },
  SMQ2: {
    code: "SMQ2",
    description: "qRFC Monitor (Inbound Queue) · Monitor inbound replication LUWs",
    module: "Basis/BC",
    auth: ["S_RFC"],
    safety: "Read-Only Triage",
    safetyType: "safe",
    category: "RFC Queue & Interface Diagnostics"
  },
  SM59: {
    code: "SM59",
    description: "RFC Destinations Display & Maintenance",
    module: "Basis/BC",
    auth: ["S_RFC_ADM"],
    safety: "Caution",
    safetyType: "caution",
    category: "RFC Destination & Gateway Configuration"
  },
  SM21: {
    code: "SM21",
    description: "System Log Analysis · Review kernel and runtime error dumps",
    module: "Basis/BC",
    auth: ["S_TABU_DIS"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Kernel Logs & Runtime Diagnostics"
  },
  SLG1: {
    code: "SLG1",
    description: "Application Log: Display Logs",
    module: "Basis/BC",
    auth: ["S_APPL_LOG"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Application & Interface Subobject Logs"
  },
  RZ12: {
    code: "RZ12",
    description: "RFC Server Group Administration",
    module: "Basis/BC",
    auth: ["S_RZL_ADM"],
    safety: "Caution",
    safetyType: "caution",
    category: "Parallel Processing & Server Group Quotas"
  },
  ST05: {
    code: "ST05",
    description: "Performance Trace & ABAP Runtime Error Analysis · SQL & RFC Trace",
    module: "Basis",
    auth: ["S_DEVELOP", "S_TABU_DIS"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Database & Enqueue Performance Profiling"
  },
  ST22: {
    code: "ST22",
    description: "ABAP Runtime Error Analysis · Dump Monitor",
    module: "Basis",
    auth: ["S_TABU_DIS", "S_DUMP"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Kernel Dump & Exception Diagnostics"
  },
  SE16N: {
    code: "SE16N",
    description: "General Table Display",
    module: "Basis",
    auth: ["S_TABU_DIS", "S_TABU_NAM"],
    safety: "Caution",
    safetyType: "caution",
    category: "Database Dictionary & Table Browser"
  },
  SM37: {
    code: "SM37",
    description: "Overview of Background Jobs · Batch Job Monitor",
    module: "Basis",
    auth: ["S_BTCH_JOB"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Background Job Schedule & Spool Logs"
  },
  SM50: {
    code: "SM50",
    description: "Work Process Overview · Local Instance Diagnostics",
    module: "Basis",
    auth: ["S_ADMI_FCD"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Instance Work Process Monitor"
  },
  SM66: {
    code: "SM66",
    description: "Global Work Process Overview · All Cluster Instances",
    module: "Basis",
    auth: ["S_ADMI_FCD"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Global Work Process Monitor"
  },
  DB02: {
    code: "DB02",
    description: "Database Performance & Space Monitor",
    module: "Basis",
    auth: ["S_DBS_SYS"],
    safety: "Read-Only Diagnostics",
    safetyType: "safe",
    category: "Storage, Tablespaces & Missing Indexes"
  },
  SU01: {
    code: "SU01",
    description: "User Maintenance Cockpit · Roles, Profiles & Locks",
    module: "Basis",
    auth: ["S_USER_GRP"],
    safety: "Caution",
    safetyType: "caution",
    category: "Security & Identity Management"
  },
  PFCG: {
    code: "PFCG",
    description: "Role & Authorization Profile Generator",
    module: "Basis",
    auth: ["S_USER_AGR"],
    safety: "Caution",
    safetyType: "caution",
    category: "Authorization Role Administration"
  },
  SPRO: {
    code: "SPRO",
    description: "SAP Customizing Implementation Guide (IMG)",
    module: "Basis",
    auth: ["S_TABU_DIS"],
    safety: "Caution",
    safetyType: "caution",
    category: "Enterprise System Customizing"
  },

  // ─── PRODUCTION PLANNING (PP) ──────────────────────────────────────────────
  CR01: {
    code: "CR01",
    description: "Create Work Center (PSA Assignment)",
    module: "PP",
    auth: ["C_AFKO_AWK", "C_CRCA_WRK"],
    safety: "Master Data",
    safetyType: "master",
    category: "Work Center & Routing Configuration"
  },
  CR02: {
    code: "CR02",
    description: "Change Work Center (PSA Assignment)",
    module: "PP",
    auth: ["C_AFKO_AWK", "C_CRCA_WRK"],
    safety: "Master Data",
    safetyType: "master",
    category: "Work Center & Routing Configuration"
  },
  CR03: {
    code: "CR03",
    description: "Display Work Center (PSA Assignment)",
    module: "PP",
    auth: ["C_AFKO_AWK", "C_CRCA_WRK"],
    safety: "Read-Only Master Data",
    safetyType: "safe",
    category: "Work Center & Routing Configuration"
  },
  CO01: {
    code: "CO01",
    description: "Create Production Order",
    module: "PP",
    auth: ["C_AFKO_AWA", "C_AFKO_AWK"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Shop Floor Order Management"
  },
  CO02: {
    code: "CO02",
    description: "Change Production Order",
    module: "PP",
    auth: ["C_AFKO_AWA", "C_AFKO_AWK"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Shop Floor Order Management"
  },
  CO03: {
    code: "CO03",
    description: "Display Production Order",
    module: "PP",
    auth: ["C_AFKO_AWA", "C_AFKO_AWK"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Shop Floor Order Management"
  },
  COOIS: {
    code: "COOIS",
    description: "Production Order Information System · Mass Header & Component Monitor",
    module: "PP",
    auth: ["C_AFKO_AWK"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Production Reporting Cockpit"
  },
  CO11N: {
    code: "CO11N",
    description: "Enter Production Order Confirmation (Time Ticket)",
    module: "PP",
    auth: ["C_AFKO_AWK"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Operation & Yield Confirmation"
  },
  CS01: {
    code: "CS01",
    description: "Create Material BOM (Bill of Materials)",
    module: "PP",
    auth: ["C_STUE_BER"],
    safety: "Master Data",
    safetyType: "master",
    category: "Bill of Material Structures"
  },
  CS02: {
    code: "CS02",
    description: "Change Material BOM (Bill of Materials)",
    module: "PP",
    auth: ["C_STUE_BER"],
    safety: "Master Data",
    safetyType: "master",
    category: "Bill of Material Structures"
  },
  CS03: {
    code: "CS03",
    description: "Display Material BOM (Bill of Materials)",
    module: "PP",
    auth: ["C_STUE_BER"],
    safety: "Read-Only Master Data",
    safetyType: "safe",
    category: "Bill of Material Structures"
  },

  // ─── PP / WM & PP / MM COMBINATIONS ────────────────────────────────────────
  LPK1: {
    code: "LPK1",
    description: "Create Control Cycle (Classic ERP WM)",
    module: "PP/WM",
    auth: ["L_LGNUM", "C_PKHD"],
    safety: "Master Data",
    safetyType: "master",
    category: "Production Staging & Kanban Parameters"
  },
  LPK2: {
    code: "LPK2",
    description: "Change Control Cycle (Classic ERP WM)",
    module: "PP/WM",
    auth: ["L_LGNUM", "C_PKHD"],
    safety: "Master Data",
    safetyType: "master",
    category: "Production Staging & Kanban Parameters"
  },
  LPK3: {
    code: "LPK3",
    description: "Display Control Cycle (Classic ERP WM)",
    module: "PP/WM",
    auth: ["L_LGNUM", "C_PKHD"],
    safety: "Read-Only Master Data",
    safetyType: "safe",
    category: "Production Staging & Kanban Parameters"
  },
  MD04: {
    code: "MD04",
    description: "Stock / Requirements List · MRP Cockpit",
    module: "PP/MM",
    auth: ["M_MATE_WRK", "M_MTDI_WWR"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Material Requirements Planning (MRP)"
  },
  MD01N: {
    code: "MD01N",
    description: "MRP Live Cockpit on SAP HANA",
    module: "PP/MM",
    auth: ["M_MTDI_WWR"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "High-Speed MRP Live Execution"
  },

  // ─── EXTENDED WAREHOUSE MANAGEMENT (EWM) ──────────────────────────────────
  "/SCWM/STAGE": {
    code: "/SCWM/STAGE",
    description: "Production Staging Cockpit (EWM)",
    module: "EWM",
    auth: ["/SCWM/SLS", "/SCWM/PRD"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Production Supply & Staging Replenishment"
  },
  "/SCWM/PSA_CC": {
    code: "/SCWM/PSA_CC",
    description: "EWM Control Cycle Maintenance",
    module: "EWM",
    auth: ["/SCWM/PSA", "/SCWM/CC"],
    safety: "Master Data",
    safetyType: "master",
    category: "PSA Staging Cycle & Dynamic Replenishment"
  },
  "/SCWM/PSA_BIN": {
    code: "/SCWM/PSA_BIN",
    description: "Map Production Supply Area (PSA) to Storage Bin",
    module: "EWM",
    auth: ["/SCWM/PSA", "/SCWM/LAGP"],
    safety: "Master Data",
    safetyType: "master",
    category: "PSA Physical Bin Allocation"
  },
  "/SCWM/MON": {
    code: "/SCWM/MON",
    description: "Warehouse Management Monitor",
    module: "EWM",
    auth: ["/SCWM/MON"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Warehouse Activity & Queue Cockpit"
  },
  "/SCWM/PRDO": {
    code: "/SCWM/PRDO",
    description: "Outbound Delivery Order Maintenance Cockpit",
    module: "EWM",
    auth: ["/SCWM/DO"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Outbound Delivery Execution"
  },
  "/SCWM/PRDI": {
    code: "/SCWM/PRDI",
    description: "Inbound Delivery Maintenance Cockpit",
    module: "EWM",
    auth: ["/SCWM/INB"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Inbound Goods Receipt & Putaway"
  },
  "/SCWM/TO_CONF": {
    code: "/SCWM/TO_CONF",
    description: "Confirm Warehouse Task (WT)",
    module: "EWM",
    auth: ["/SCWM/TO"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Warehouse Task Execution & Confirmation"
  },
  "/SCWM/ADHU": {
    code: "/SCWM/ADHU",
    description: "Create & Modify Handling Units (HU)",
    module: "EWM",
    auth: ["/SCWM/HU"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Handling Unit Packaging Management"
  },

  // ─── MATERIALS MANAGEMENT (MM) ─────────────────────────────────────────────
  ME21N: {
    code: "ME21N",
    description: "Purchase Order Cockpit · Create Purchase Order",
    module: "MM",
    auth: ["M_BEST_BSA", "M_BEST_EKG"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Purchasing & Procurement Cockpit"
  },
  ME22N: {
    code: "ME22N",
    description: "Purchase Order Cockpit · Change Purchase Order",
    module: "MM",
    auth: ["M_BEST_BSA", "M_BEST_EKG"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Purchasing & Procurement Cockpit"
  },
  ME23N: {
    code: "ME23N",
    description: "Purchase Order Cockpit · Display Purchase Order",
    module: "MM",
    auth: ["M_BEST_BSA", "M_BEST_EKG"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Purchasing & Procurement Cockpit"
  },
  MIGO: {
    code: "MIGO",
    description: "Goods Movement & Material Document Postings",
    module: "MM",
    auth: ["M_MSEG_BWA", "M_MSEG_WMB"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Inventory Postings & Goods Movement"
  },
  MM01: {
    code: "MM01",
    description: "Create Material Master Record",
    module: "MM",
    auth: ["M_MATE_MAN", "M_MATE_STA"],
    safety: "Master Data",
    safetyType: "master",
    category: "Material Master Data"
  },
  MM02: {
    code: "MM02",
    description: "Change Material Master Record",
    module: "MM",
    auth: ["M_MATE_MAN", "M_MATE_STA"],
    safety: "Master Data",
    safetyType: "master",
    category: "Material Master Data"
  },
  MM03: {
    code: "MM03",
    description: "Display Material Master Record",
    module: "MM",
    auth: ["M_MATE_MAN", "M_MATE_STA"],
    safety: "Read-Only Master Data",
    safetyType: "safe",
    category: "Material Master Data"
  },
  MMBE: {
    code: "MMBE",
    description: "Stock Overview · Multi-Level Plant / Storage Location",
    module: "MM",
    auth: ["M_MATE_WRK"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Stock & Inventory Level Analysis"
  },

  // ─── SALES & DISTRIBUTION (SD) ─────────────────────────────────────────────
  VA01: {
    code: "VA01",
    description: "Sales Order Cockpit · Create Sales Order",
    module: "SD",
    auth: ["V_VBAK_VKO", "V_VBAK_AAT"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Customer Sales Order Processing"
  },
  VA02: {
    code: "VA02",
    description: "Sales Order Cockpit · Change Sales Order",
    module: "SD",
    auth: ["V_VBAK_VKO", "V_VBAK_AAT"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Customer Sales Order Processing"
  },
  VA03: {
    code: "VA03",
    description: "Sales Order Cockpit · Display Sales Order",
    module: "SD",
    auth: ["V_VBAK_VKO", "V_VBAK_AAT"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Customer Sales Order Processing"
  },
  VL01N: {
    code: "VL01N",
    description: "Create Outbound Delivery with Order Reference",
    module: "SD",
    auth: ["V_LIKP_VST"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Shipping & Outbound Logistics"
  },
  VL02N: {
    code: "VL02N",
    description: "Change Outbound Delivery / Post Goods Issue",
    module: "SD",
    auth: ["V_LIKP_VST"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Shipping & Outbound Logistics"
  },
  VL03N: {
    code: "VL03N",
    description: "Display Outbound Delivery",
    module: "SD",
    auth: ["V_LIKP_VST"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Shipping & Outbound Logistics"
  },
  VF01: {
    code: "VF01",
    description: "Create Billing Document (Invoice)",
    module: "SD",
    auth: ["V_VBRK_FKA"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Customer Billing & Revenue"
  },
  VF02: {
    code: "VF02",
    description: "Change Billing Document",
    module: "SD",
    auth: ["V_VBRK_FKA"],
    safety: "Operational Execution",
    safetyType: "exec",
    category: "Customer Billing & Revenue"
  },
  VF03: {
    code: "VF03",
    description: "Display Billing Document",
    module: "SD",
    auth: ["V_VBRK_FKA"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Customer Billing & Revenue"
  },

  // ─── FINANCIAL ACCOUNTING & CONTROLLING (FI/CO) ─────────────────────────────
  FB01: {
    code: "FB01",
    description: "Post Financial Accounting Document",
    module: "FI/CO",
    auth: ["F_BKPF_BUK"],
    safety: "Caution",
    safetyType: "caution",
    category: "General Ledger Journal Postings"
  },
  FB03: {
    code: "FB03",
    description: "Display Financial Accounting Document",
    module: "FI/CO",
    auth: ["F_BKPF_BUK"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "General Ledger Journal Postings"
  },
  FS00: {
    code: "FS00",
    description: "G/L Account Master Record Maintenance (Centrally)",
    module: "FI/CO",
    auth: ["F_SKA1_BUK"],
    safety: "Master Data",
    safetyType: "master",
    category: "General Ledger Master Records"
  },
  KS01: {
    code: "KS01",
    description: "Create Cost Center Master Record",
    module: "FI/CO",
    auth: ["K_CSKS"],
    safety: "Master Data",
    safetyType: "master",
    category: "Cost Center Accounting Master Data"
  },
  KS02: {
    code: "KS02",
    description: "Change Cost Center Master Record",
    module: "FI/CO",
    auth: ["K_CSKS"],
    safety: "Master Data",
    safetyType: "master",
    category: "Cost Center Accounting Master Data"
  },
  KS03: {
    code: "KS03",
    description: "Display Cost Center Master Record",
    module: "FI/CO",
    auth: ["K_CSKS"],
    safety: "Read-Only Master Data",
    safetyType: "safe",
    category: "Cost Center Accounting Master Data"
  },
  FBL1N: {
    code: "FBL1N",
    description: "Vendor Line Item Display (Accounts Payable)",
    module: "FI/CO",
    auth: ["F_BKPF_KOA"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Accounts Payable Reporting"
  },
  FBL3N: {
    code: "FBL3N",
    description: "G/L Account Line Item Display",
    module: "FI/CO",
    auth: ["F_BKPF_KOA"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "General Ledger Reporting"
  },
  FBL5N: {
    code: "FBL5N",
    description: "Customer Line Item Display (Accounts Receivable)",
    module: "FI/CO",
    auth: ["F_BKPF_KOA"],
    safety: "Read-Only Monitoring",
    safetyType: "safe",
    category: "Accounts Receivable Reporting"
  }
};

// Common programming and English tokens that look like alphanumeric words
// but are never SAP transaction codes
const EXCLUDED_WORDS = new Set([
  "THE", "AND", "FOR", "NOT", "TRUE", "FALSE", "NULL", "DATA", "TEST", "INFO",
  "VIEW", "OPEN", "SAVE", "HELP", "FILE", "EDIT", "CODE", "USER", "ROLE", "ITEM",
  "NODE", "TEXT", "PATH", "NAME", "DATE", "TIME", "TYPE", "SIZE", "READ", "POST",
  "SEND", "RECV", "INIT", "LOAD", "SYNC", "WARN", "FAIL", "PASS", "QUIT", "EXIT",
  "NEXT", "PREV", "BACK", "HTML", "JSON", "REST", "HTTP", "HTTPS", "ROOT", "SPAN",
  "PAGE", "LIST", "SHOW", "TASK", "AUTO", "LINE", "STEP", "BASE", "DEST", "AUTH"
]);

/**
 * Normalizes input string into a standard SAP T-Code representation.
 * Handles trailing punctuation, uppercase conversion, and strips SAP GUI session prefixes (/n, /o).
 */
export function normalizeTCode(raw) {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw.trim();

  // Strip wrapping quotes or backticks if present
  clean = clean.replace(/^[`'"]+|[`'"]+$/g, "");

  // Strip trailing punctuation like comma, dot, colon, semicolon
  clean = clean.replace(/[.,:;)]+$/, "");
  clean = clean.replace(/^\(/, "");

  // Handle SAP GUI prefix (/n or /o) but preserve namespaced paths like /SCWM/STAGE
  if (/^\/[no]\/scwm\//i.test(clean)) {
    clean = clean.slice(2);
  } else if (/^\/[no]\//i.test(clean)) {
    clean = clean.slice(2);
  } else if (/^\/[no]([a-z0-9])/i.test(clean)) {
    clean = clean.slice(2);
  }

  // Preserve slash paths casing or uppercase standard codes
  if (clean.startsWith("/")) {
    clean = clean.toUpperCase();
  } else {
    clean = clean.toUpperCase();
  }

  return clean;
}

/**
 * Returns true if a string matches a known transaction code in the registry
 * or satisfies standard SAP transaction code naming conventions.
 */
export function isKnownTCode(str) {
  if (!str || typeof str !== "string") return false;
  const clean = normalizeTCode(str);
  if (!clean || clean.length < 3 || clean.length > 25) return false;

  // Direct hit in registry
  if (SAP_TCODE_REGISTRY[clean]) return true;

  // Exclude common non-tcode tokens
  if (EXCLUDED_WORDS.has(clean)) return false;

  // Namespaced SAP t-codes (e.g. /SCWM/STAGE, /SAPAPO/RRP3, /UI2/FLP, /S4H/...)
  if (/^\/[A-Z0-9_]{2,10}\/[A-Z0-9_]{2,14}$/i.test(clean)) {
    return true;
  }

  // Classic SAP transaction codes: 3-8 alphanumeric characters
  if (/^[A-Z][A-Z0-9]{2,7}$/i.test(clean)) {
    // If it contains a number (e.g., VA01, ME21N, SM59, ST05, CR03, SE16N)
    if (/\d/.test(clean)) return true;

    // Or starts with classic SAP module functional prefixes
    const sapPrefixRegex = /^(SM|RZ|ST|SE|SU|SP|SL|DB|SH|SC|CR|CO|CS|MD|LP|ME|MM|MB|MK|ML|VA|VL|VF|VT|VS|FB|FS|FK|FD|KS|KP|KO|KB|KE|CJ|IW|IQ|IE|IL|QA|QM|QS|PP|PM|WM|EWM|LE|SD|FI|CO|BC|BW|BI|HR|PA|OM|COOIS|SPRO|MIGO|MMBE|FBL|Z[A-Z0-9]|Y[A-Z0-9])/i;
    if (sapPrefixRegex.test(clean)) return true;
  }

  return false;
}

/**
 * Retrieves registry entry or synthesizes a rich fallback descriptor for pattern-matched codes.
 */
export function getTCodeInfo(rawCode) {
  const clean = normalizeTCode(rawCode);
  if (SAP_TCODE_REGISTRY[clean]) {
    return SAP_TCODE_REGISTRY[clean];
  }

  // Synthesize intelligent fallback metadata based on SAP conventions
  let module = "SAP Enterprise";
  let safety = "Operational Execution";
  let safetyType = "exec";
  let auth = ["S_TCODE"];
  let category = "SAP Standard Transaction";

  if (clean.startsWith("/SCWM/")) {
    module = "EWM";
    auth = ["/SCWM/AUTH", "/SCWM/MON"];
    safety = clean.includes("MON") ? "Read-Only Monitoring" : "Operational Execution";
    safetyType = clean.includes("MON") ? "safe" : "exec";
    category = "Extended Warehouse Management";
  } else if (/^(CR|CO|CS|MD)/i.test(clean)) {
    module = "PP";
    auth = ["C_AFKO_AWK"];
    category = "Production Planning & Shop Floor Control";
    if (clean.endsWith("03") || clean.startsWith("COOIS") || clean.startsWith("MD04")) {
      safety = "Read-Only Monitoring";
      safetyType = "safe";
    } else if (clean.endsWith("01") || clean.endsWith("02")) {
      safety = "Master Data";
      safetyType = "master";
    }
  } else if (/^(ME|MM|MB|MIGO|MMBE)/i.test(clean)) {
    module = "MM";
    auth = ["M_MATE_MAN", "M_BEST_BSA"];
    category = "Materials Management & Inventory";
    if (clean.endsWith("03") || clean === "MMBE") {
      safety = "Read-Only Monitoring";
      safetyType = "safe";
    }
  } else if (/^(VA|VL|VF|VT)/i.test(clean)) {
    module = "SD";
    auth = ["V_VBAK_VKO", "V_LIKP_VST"];
    category = "Sales & Outbound Logistics";
    if (clean.endsWith("03")) {
      safety = "Read-Only Monitoring";
      safetyType = "safe";
    }
  } else if (/^(FB|FS|KS|FBL)/i.test(clean)) {
    module = "FI/CO";
    auth = ["F_BKPF_BUK", "K_CSKS"];
    category = "Financial Accounting & Management Controlling";
    if (clean.endsWith("03") || clean.startsWith("FBL")) {
      safety = "Read-Only Monitoring";
      safetyType = "safe";
    } else {
      safety = "Caution";
      safetyType = "caution";
    }
  } else if (/^(SM|RZ|ST|SE|SU|SP|SL|DB)/i.test(clean)) {
    module = "Basis";
    auth = ["S_TABU_DIS", "S_ADMI_FCD"];
    category = "System Administration & Diagnostics";
    if (/^(SM21|SLG1|ST05|ST22|SM37|SM50|SM66|DB02)/i.test(clean)) {
      safety = "Read-Only Diagnostics";
      safetyType = "safe";
    } else {
      safety = "Caution";
      safetyType = "caution";
    }
  } else if (clean.startsWith("Z") || clean.startsWith("Y")) {
    module = "Custom ABAP";
    auth = ["S_TCODE", "Z_CUSTOM_AUTH"];
    safety = "Custom Enterprise Scope";
    safetyType = "caution";
    category = "Customer Extension Transaction";
  }

  // Generate readable description from standard verb suffixes
  let actionVerb = "Execute";
  if (clean.endsWith("01")) actionVerb = "Create";
  else if (clean.endsWith("02")) actionVerb = "Change";
  else if (clean.endsWith("03")) actionVerb = "Display (Read-Only)";

  return {
    code: clean,
    description: `${actionVerb} ${clean} · SAP ${module} Cockpit`,
    module,
    auth,
    safety,
    safetyType,
    category
  };
}

/**
 * Returns distinct styling badges for SAP modules.
 */
function getModuleBadgeStyle(module) {
  switch (module) {
    case "Basis/BC":
    case "Basis":
      return {
        bg: "rgba(6, 182, 212, 0.12)",
        border: "rgba(6, 182, 212, 0.35)",
        color: "#22D3EE",
        label: `[${module}]`
      };
    case "EWM":
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.35)",
        color: "#34D399",
        label: `[${module}]`
      };
    case "PP":
    case "PP/WM":
    case "PP/MM":
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.35)",
        color: "#FBBF24",
        label: `[${module}]`
      };
    case "MM":
      return {
        bg: "rgba(59, 130, 246, 0.12)",
        border: "rgba(59, 130, 246, 0.35)",
        color: "#60A5FA",
        label: `[${module}]`
      };
    case "SD":
      return {
        bg: "rgba(168, 85, 247, 0.12)",
        border: "rgba(168, 85, 247, 0.35)",
        color: "#C084FC",
        label: `[${module}]`
      };
    case "FI/CO":
      return {
        bg: "rgba(244, 63, 94, 0.12)",
        border: "rgba(244, 63, 94, 0.35)",
        color: "#FB7185",
        label: `[${module}]`
      };
    default:
      return {
        bg: "rgba(255, 255, 255, 0.08)",
        border: "rgba(255, 255, 255, 0.16)",
        color: "var(--text-muted, #A1A1AA)",
        label: `[${module}]`
      };
  }
}

/**
 * Returns distinct styling badges for safety classifications.
 */
function getSafetyBadgeStyle(safety) {
  const s = String(safety || "").toLowerCase();

  if (s.includes("read-only") || s.includes("safe") || s.includes("diagnostics") || s.includes("monitoring")) {
    return {
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.32)",
      color: "#34D399",
      icon: "🛡️",
      text: safety
    };
  }

  if (s.includes("caution") || s.includes("warning") || s.includes("config") || s.includes("admin")) {
    return {
      bg: "rgba(245, 158, 11, 0.14)",
      border: "rgba(245, 158, 11, 0.35)",
      color: "#FBBF24",
      icon: "⚡",
      text: safety
    };
  }

  if (s.includes("master")) {
    return {
      bg: "rgba(139, 92, 246, 0.13)",
      border: "rgba(139, 92, 246, 0.35)",
      color: "#A78BFA",
      icon: "📦",
      text: safety
    };
  }

  // Operational Execution
  return {
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.32)",
    color: "#60A5FA",
    icon: "⚙️",
    text: safety
  };
}

/**
 * TCodeHoverCard Component
 * Interactive inline SAP T-Code badge with rich floating popover card.
 *
 * Props:
 * - code: string (e.g. "SMQ1" or "/SCWM/STAGE")
 * - children: optional fallback React node
 * - style: optional inline style object for the badge
 * - className: optional CSS class
 */
export default function TCodeHoverCard({
  code,
  children,
  style = {},
  className = ""
}) {
  const rawTarget = code || (typeof children === "string" ? children : "");
  const normalized = normalizeTCode(rawTarget);
  const isValid = isKnownTCode(normalized);

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptSent, setPromptSent] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placeAbove: false });

  const badgeRef = useRef(null);
  const popoverRef = useRef(null);
  const hideTimerRef = useRef(null);
  const copyTimerRef = useRef(null);
  const promptTimerRef = useRef(null);

  // If not recognized as an SAP t-code, render children or code as plain text
  if (!isValid) {
    return children || code || null;
  }

  const info = getTCodeInfo(normalized);
  const moduleBadge = getModuleBadgeStyle(info.module);
  const safetyBadge = getSafetyBadgeStyle(info.safety);

  // Clear pending hide timer
  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Compute position relative to badge
  const updatePosition = useCallback(() => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const popoverWidth = 350;
    const estHeight = 210;
    const margin = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceAbove >= estHeight + margin || spaceAbove > spaceBelow;

    let top = placeAbove
      ? Math.max(margin, rect.top - estHeight - margin)
      : Math.min(window.innerHeight - estHeight - margin, rect.bottom + margin);

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    left = Math.max(margin, Math.min(window.innerWidth - popoverWidth - margin, left));

    setCoords({ top, left, placeAbove });
  }, []);

  // Precision adjustment once popover is mounted in DOM
  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current || !badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const popRect = popoverRef.current.getBoundingClientRect();
    const margin = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceAbove >= popRect.height + margin || spaceAbove > spaceBelow;

    let top = placeAbove
      ? rect.top - popRect.height - margin
      : rect.bottom + margin;

    // Safety bounds
    if (placeAbove && top < margin) {
      top = rect.bottom + margin;
    } else if (!placeAbove && top + popRect.height > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - popRect.height - margin);
    }

    let left = rect.left + rect.width / 2 - popRect.width / 2;
    left = Math.max(margin, Math.min(window.innerWidth - popRect.width - margin, left));

    setCoords({ top, left, placeAbove });
  }, [isOpen]);

  // Window listeners for scroll, resize, escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      cancelHide();
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    };
  }, [cancelHide]);

  // Mouse handlers for badge
  const handleBadgeMouseEnter = () => {
    cancelHide();
    updatePosition();
    setIsOpen(true);
  };

  const handleBadgeMouseLeave = () => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  const handlePopoverMouseEnter = () => {
    cancelHide();
  };

  const handlePopoverMouseLeave = () => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  // Action: Copy Code
  const handleCopyCode = async (e) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(info.code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = info.code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.warn("Could not copy t-code to clipboard:", err);
    }
  };

  // Action: Ask Nexus about this code
  const handleAskNexus = (e) => {
    e.stopPropagation();
    const authList = (info.auth || []).join(", ");
    const promptText = `Explain SAP transaction code ${info.code} (${info.description}): key prerequisites, required authorizations (${authList || "standard"}), typical error triage, and best practices.`;

    if (typeof window !== "undefined") {
      // 1. Check window.nexusInsertPrompt
      if (typeof window.nexusInsertPrompt === "function") {
        window.nexusInsertPrompt(promptText);
      }

      // 2. Dispatch custom event for flexible integration
      window.dispatchEvent(
        new CustomEvent("nexus-insert-prompt", {
          detail: {
            prompt: promptText,
            code: info.code,
            module: info.module
          }
        })
      );
    }

    setPromptSent(true);
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = setTimeout(() => {
      setPromptSent(false);
    }, 1800);
  };

  return (
    <>
      {/* Interactive Inline Badge */}
      <span
        ref={badgeRef}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`nexus-tcode-badge ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 7px",
          borderRadius: 5,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "0.85em",
          fontWeight: 600,
          lineHeight: 1.35,
          cursor: "pointer",
          verticalAlign: "baseline",
          margin: "0 2px",
          border: isOpen
            ? "1px solid var(--burgundy-rich, #6E1A2D)"
            : "1px solid var(--border-subtle, rgba(110, 26, 45, 0.25))",
          background: isOpen
            ? "var(--burgundy-light, rgba(110, 26, 45, 0.16))"
            : "rgba(110, 26, 45, 0.08)",
          color: "var(--burgundy-rich, #6E1A2D)",
          boxShadow: isOpen
            ? "0 0 10px var(--burgundy-glow, rgba(110, 26, 45, 0.3))"
            : "none",
          transition: "all 0.15s ease",
          userSelect: "none",
          ...style
        }}
        onMouseEnter={handleBadgeMouseEnter}
        onMouseLeave={handleBadgeMouseLeave}
        onClick={handleBadgeClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleBadgeClick(e);
          }
        }}
      >
        <span
          style={{
            fontSize: "0.82em",
            opacity: 0.85,
            display: "inline-block",
            transform: "translateY(-0.5px)"
          }}
        >
          ⚡
        </span>
        <span style={{ letterSpacing: "0.01em" }}>
          {children || info.code}
        </span>
      </span>

      {/* Floating Popover Card via Portal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={`SAP Transaction Code ${info.code}`}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: 350,
              maxWidth: "calc(100vw - 24px)",
              background: "var(--bg-card, #1A1A1A)",
              color: "var(--text-primary, #EDEDED)",
              borderRadius: 12,
              border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
              boxShadow:
                "0 18px 36px -6px rgba(0, 0, 0, 0.45), 0 8px 16px -4px rgba(0, 0, 0, 0.3)",
              padding: "14px 16px",
              zIndex: 99999,
              fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
              boxSizing: "border-box",
              animation: "tcodePopIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <style>{`
              @keyframes tcodePopIn {
                from { opacity: 0; transform: scale(0.96) translateY(${coords.placeAbove ? "4px" : "-4px"}); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              .tcode-action-btn {
                flex: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 6px 10px;
                border-radius: 7px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-primary, #EDEDED);
                font-family: var(--font-sans, sans-serif);
                transition: all 0.15s ease;
                white-space: nowrap;
              }
              .tcode-action-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-1px);
              }
              .tcode-action-btn:active {
                transform: translateY(0);
              }
              .tcode-action-nexus {
                background: var(--burgundy-gradient, linear-gradient(135deg, #7A1930 0%, #4D0E1C 100%)) !important;
                border-color: var(--burgundy-rich, #8E2038) !important;
                color: #FFFFFF !important;
              }
              .tcode-action-nexus:hover {
                filter: brightness(1.1);
                box-shadow: 0 2px 10px var(--burgundy-glow, rgba(110, 26, 45, 0.45));
              }
            `}</style>

            {/* Header: Code & Top Badges */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8
              }}
            >
              {/* T-Code in Bold Mono */}
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontWeight: 800,
                  fontSize: 16.5,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary, #EDEDED)"
                }}
              >
                {info.code}
              </div>

              {/* Module & Safety Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {/* Module Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono, monospace)",
                    background: moduleBadge.bg,
                    border: `1px solid ${moduleBadge.border}`,
                    color: moduleBadge.color
                  }}
                >
                  {moduleBadge.label}
                </span>

                {/* Safety Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 600,
                    background: safetyBadge.bg,
                    border: `1px solid ${safetyBadge.border}`,
                    color: safetyBadge.color
                  }}
                  title={`Execution Safety: ${safetyBadge.text}`}
                >
                  <span style={{ fontSize: 11 }}>{safetyBadge.icon}</span>
                  <span>{safetyBadge.text}</span>
                </span>
              </div>
            </div>

            {/* Full Description */}
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.45,
                color: "var(--text-primary, #EDEDED)",
                fontWeight: 500,
                marginBottom: 4
              }}
            >
              {info.description}
            </div>

            {/* Category / Context Hint */}
            {info.category && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted, #A1A1AA)",
                  marginBottom: 10
                }}
              >
                {info.category}
              </div>
            )}

            {/* Required Authorization Objects */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted, #A1A1AA)",
                  marginBottom: 5
                }}
              >
                Required Authorization Objects
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {info.auth && info.auth.length > 0 ? (
                  info.auth.map((authObj) => (
                    <span
                      key={authObj}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
                        color: "var(--text-primary, #EDEDED)"
                      }}
                    >
                      {authObj}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 11,
                      color: "var(--text-muted, #A1A1AA)"
                    }}
                  >
                    S_TCODE (Default)
                  </span>
                )}
              </div>
            </div>

            {/* Subtle Divider */}
            <div
              style={{
                height: 1,
                background: "var(--border-subtle, rgba(255, 255, 255, 0.08))",
                marginBottom: 10
              }}
            />

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Copy Code */}
              <button
                type="button"
                className="tcode-action-btn"
                onClick={handleCopyCode}
                title={`Copy ${info.code} to clipboard`}
              >
                <span>{copied ? "✓" : "📋"}</span>
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>

              {/* Ask Nexus */}
              <button
                type="button"
                className="tcode-action-btn tcode-action-nexus"
                onClick={handleAskNexus}
                title={`Ask Nexus Copilot to analyze ${info.code}`}
              >
                <span>{promptSent ? "✓" : "💬"}</span>
                <span>{promptSent ? "Prompt Added" : `Ask Nexus about ${info.code}`}</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
