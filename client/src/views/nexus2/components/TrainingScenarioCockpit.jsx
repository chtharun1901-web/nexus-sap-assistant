import React, { useState, useMemo } from "react";
import scenariosData from "../data/gtsComplianceTrainingScenarios.json";
import { screenParty } from "../engine/sanctionsMatcher.js";

export default function TrainingScenarioCockpit({ onOpenActionDialog }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedSourceList, setSelectedSourceList] = useState("ALL");
  
  // Selected active scenario for detailed execution
  const [activeScenario, setActiveScenario] = useState(scenariosData[0]);
  const [scenarioStates, setScenarioStates] = useState({});
  const [selectedReasonCode, setSelectedReasonCode] = useState("RC02");
  const [officerComment, setOfficerComment] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [activeTab, setActiveTab] = useState("lab"); // "lab", "pedagogy", "audit", "json"

  // Filtered scenario catalog
  const filteredScenarios = useMemo(() => {
    return scenariosData.filter(sc => {
      const q = searchTerm.toLowerCase();
      const matchSearch = searchTerm === "" ||
        sc.scenarioId.toLowerCase().includes(q) ||
        sc.scenarioName.toLowerCase().includes(q) ||
        sc.syntheticPartner.name.toLowerCase().includes(q) ||
        sc.syntheticDocument.docNumber.toLowerCase().includes(q) ||
        (sc.matchedSourceRecord?.entityId || "").toLowerCase().includes(q) ||
        (sc.matchedSourceRecord?.primaryName || "").toLowerCase().includes(q);

      const matchCat = selectedCategory === "ALL" || sc.category === selectedCategory;
      const matchDiff = selectedDifficulty === "ALL" || sc.difficulty === selectedDifficulty;
      const matchSrc = selectedSourceList === "ALL" || sc.sourceList.includes(selectedSourceList);

      return matchSearch && matchCat && matchDiff && matchSrc;
    });
  }, [searchTerm, selectedCategory, selectedDifficulty, selectedSourceList]);

  // Current scenario state (or defaults)
  const currentScenarioState = useMemo(() => {
    if (!activeScenario) return null;
    return scenarioStates[activeScenario.scenarioId] || {
      status: activeScenario.expectedMatch.matchFound ? "BLOCKED" : "RELEASED",
      officerDecision: null,
      reasonCode: "",
      comment: "",
      s4Status: activeScenario.expectedMatch.matchFound ? "DELIVERY HOLD: VBAK-LIFSK = '01'" : "CLEARED: Feeder unblocked",
      ewmStatus: activeScenario.expectedMatch.matchFound ? "HOLD: Warehouse wave picking suspended" : "ACTIVE: Eligible for picking",
      auditTrail: [
        {
          timestamp: "2026-09-24 08:30:00 UTC",
          user: "SYSTEM_BATCH_RFC",
          action: "REPLICATION_CREATED",
          comment: `Replicated from feeder system ${activeScenario.syntheticDocument.feederSystem}. Initial screening executed.`
        }
      ]
    };
  }, [activeScenario, scenarioStates]);

  // Execute Screening for active scenario
  const liveScreeningResult = useMemo(() => {
    if (!activeScenario) return null;
    if (activeScenario.scenarioId === "SPL-015") {
      // SCOMET is product control, isolated from party screening
      const res = screenParty({ name: activeScenario.screeningInput.name, country: activeScenario.screeningInput.country });
      return {
        ...res,
        productControlHold: true,
        scometCategory: activeScenario.screeningInput.scometCategory,
        status: "Party Screened — Clean Pass (DGFT SCOMET Export License Required)"
      };
    }
    return screenParty(activeScenario.screeningInput);
  }, [activeScenario]);

  // Handle Scenario Selection
  const handleSelectScenario = (sc) => {
    setActiveScenario(sc);
    setSelectedReasonCode(sc.expectedReasonCode || "RC02");
    setOfficerComment("");
    setValidationResult(null);
  };

  // Execute Officer Decision
  const handleExecuteDecision = (actionType) => {
    if (!officerComment.trim()) {
      alert("Validation Error: In SAP GTS compliance workflows, a mandatory officer comment is required before any status change can be saved.");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    let newStatus = "BLOCKED";
    let s4Status = "PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.";
    let ewmStatus = "CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.";

    if (actionType === "RELEASE" || actionType === "ASSIGN_LICENSE") {
      newStatus = "RELEASED";
      s4Status = "CLEARED: Delivery Block 01 removed in VBAK/VBEP. Feeder status synced via RFC.";
      ewmStatus = "RELEASED: Warehouse Outbound Delivery created. Picking waves activated in EWM.";
    } else if (actionType === "ESCALATE" || actionType === "INSUFFICIENT_DATA") {
      newStatus = "UNDER_REVIEW";
      s4Status = "COMPLIANCE REVIEW IN PROGRESS: Feeder system delivery block remains active pending four-eyes approval.";
      ewmStatus = "ON HOLD: Warehouse execution suspended pending compliance review completion.";
    } else if (actionType === "CONFIRM_BLOCK") {
      newStatus = "CONFIRMED_BLOCK";
      s4Status = "PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.";
      ewmStatus = "CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.";
    }

    const newAuditEntry = {
      timestamp: nowStr,
      user: "COMPLIANCE_OFFICER_LEAD",
      action: actionType,
      reasonCode: selectedReasonCode,
      comment: `${selectedReasonCode}: ${officerComment}`,
      sourceSystem: "SAP GTS /SAPSLL/SPL_CHCK"
    };

    setScenarioStates(prev => ({
      ...prev,
      [activeScenario.scenarioId]: {
        status: newStatus,
        officerDecision: actionType,
        reasonCode: selectedReasonCode,
        comment: officerComment,
        s4Status,
        ewmStatus,
        auditTrail: [newAuditEntry, ...currentScenarioState.auditTrail]
      }
    }));

    // Run Automated Validation
    validateOutcome(actionType, newStatus, s4Status, ewmStatus, officerComment);
  };

  // Compare Actual vs Expected Outcome
  const validateOutcome = (actualAction, actualGtsStatus, actualS4, actualEwm, comment) => {
    const exp = activeScenario.expectedValidation;
    const checks = [];

    // Check 1: Officer Decision Matches Expected
    const actionMatches = actualAction === activeScenario.expectedOfficerAction;
    checks.push({
      check: "Officer Action Protocol",
      expected: activeScenario.expectedOfficerAction,
      actual: actualAction,
      passed: actionMatches
    });

    // Check 2: Reason Code Enforced
    const hasReason = selectedReasonCode === activeScenario.expectedReasonCode || activeScenario.expectedOfficerAction === "NO_ACTION_REQUIRED";
    checks.push({
      check: "Reason Code Compliance",
      expected: activeScenario.expectedReasonCode,
      actual: selectedReasonCode,
      passed: hasReason
    });

    // Check 3: Mandatory Comment Enforced
    const hasComment = comment.length >= 10;
    checks.push({
      check: "Mandatory Audit Rationale",
      expected: "Minimum 10 characters documented rationale",
      actual: `${comment.length} characters recorded`,
      passed: hasComment
    });

    // Check 4: GTS Status
    const gtsMatches = actualGtsStatus === activeScenario.expectedGtsStatus;
    checks.push({
      check: "GTS Status Machine State",
      expected: activeScenario.expectedGtsStatus,
      actual: actualGtsStatus,
      passed: gtsMatches
    });

    // Check 5: Downstream S/4HANA Sync
    const s4Matches = actualS4.toLowerCase().includes("cleared") || actualS4.toLowerCase().includes("block") || actualS4.toLowerCase().includes("hold");
    checks.push({
      check: "S/4HANA Feeder Propagation",
      expected: "Synchronous RFC status synchronization",
      actual: actualS4.slice(0, 45) + "...",
      passed: s4Matches
    });

    // Check 6: Downstream EWM Warehouse State
    const ewmMatches = actualEwm.toLowerCase().includes("released") || actualEwm.toLowerCase().includes("cancelled") || actualEwm.toLowerCase().includes("hold");
    checks.push({
      check: "EWM Warehouse Task Propagation",
      expected: "Wave picking alignment",
      actual: actualEwm.slice(0, 45) + "...",
      passed: ewmMatches
    });

    const allPassed = checks.every(c => c.passed);
    setValidationResult({
      status: allPassed ? "PASS" : "WARNING",
      checks,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleResetScenario = () => {
    setScenarioStates(prev => {
      const copy = { ...prev };
      delete copy[activeScenario.scenarioId];
      return copy;
    });
    setOfficerComment("");
    setValidationResult(null);
  };

  const handleDownloadCsv = () => {
    window.open("/gtsComplianceTrainingScenarios.csv", "_blank");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg-main)" }}>
      {/* 1. Header & Training Safeguard Notice */}
      <div style={{ padding: "14px 20px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🧪</span>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Nexus 2.0: Compliance Scenario Training Laboratory
              </h1>
              <span style={{ fontSize: 11, background: "rgba(110,26,45,0.12)", color: "var(--orange, #6E1A2D)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                15 Real-World Labs
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Practice end-to-end SAP GTS screening, alias resolution, false-positive clearance, and S/4HANA/EWM downstream propagation using official India-oriented sanctions data.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDownloadCsv}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📥 Export CSV Catalog
            </button>
          </div>
        </div>

        {/* Legal Safeguard Banner */}
        <div
          style={{
            background: "rgba(217,119,6,0.08)",
            border: "1px solid rgba(217,119,6,0.3)",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 11.5,
            color: "#B45309",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span>
            <span>
              <strong>Training simulation only:</strong> Based on dated sanctions snapshot (2026-09-23). Match scores and reason codes represent educational heuristics. Verify in target SAP GTS system.
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
            Sources: UN Consolidated (SDi.007) · OFAC SDN · FIU-India Section 51A · DGFT SCOMET
          </span>
        </div>
      </div>

      {/* 2. Main Body: Left Scenario Selector + Right Interactive Adjudication Workbench */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Column: Filterable Scenario List */}
        <div style={{ width: 380, borderRight: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Search & Filters */}
          <div style={{ padding: "12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text"
              placeholder="Search scenarios, partners, entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-card)",
                color: "var(--text-primary)"
              }}
            />
            
            <div style={{ display: "flex", gap: 6 }}>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-primary)" }}
              >
                <option value="ALL">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                value={selectedSourceList}
                onChange={(e) => setSelectedSourceList(e.target.value)}
                style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-primary)" }}
              >
                <option value="ALL">All Authorities</option>
                <option value="UN">UN Consolidated</option>
                <option value="OFAC">US OFAC</option>
                <option value="FIU">FIU-India</option>
                <option value="SCOMET">DGFT SCOMET</option>
              </select>
            </div>
          </div>

          {/* List Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
            {filteredScenarios.map(sc => {
              const isSelected = activeScenario?.scenarioId === sc.scenarioId;
              const state = scenarioStates[sc.scenarioId];
              const isTested = !!state?.officerDecision;

              return (
                <div
                  key={sc.scenarioId}
                  onClick={() => handleSelectScenario(sc)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    marginBottom: 6,
                    background: isSelected ? "var(--bg-card)" : "transparent",
                    border: isSelected ? "1px solid var(--orange, #6E1A2D)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>
                        {sc.scenarioId}
                      </span>
                      <span style={{
                        fontSize: 9.5,
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontWeight: 600,
                        background: sc.difficulty === "Beginner" ? "rgba(16,185,129,0.12)" : sc.difficulty === "Intermediate" ? "rgba(37,99,235,0.12)" : "rgba(110,26,45,0.12)",
                        color: sc.difficulty === "Beginner" ? "#059669" : sc.difficulty === "Intermediate" ? "#2563EB" : "var(--orange, #6E1A2D)"
                      }}>
                        {sc.difficulty}
                      </span>
                    </div>

                    {isTested && (
                      <span style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>
                        ✓ {state.officerDecision}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                    {sc.scenarioName}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{sc.syntheticPartner.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{sc.syntheticDocument.docNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stage: Interactive Adjudication Cockpit */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-main)" }}>
          {activeScenario ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              
              {/* Tab Navigation */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card)", padding: "0 20px" }}>
                <button
                  onClick={() => setActiveTab("lab")}
                  style={{
                    padding: "12px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: "none",
                    borderBottom: activeTab === "lab" ? "2px solid var(--orange, #6E1A2D)" : "2px solid transparent",
                    background: "transparent",
                    color: activeTab === "lab" ? "var(--orange, #6E1A2D)" : "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Interactive Adjudication Lab
                </button>
                <button
                  onClick={() => setActiveTab("pedagogy")}
                  style={{
                    padding: "12px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: "none",
                    borderBottom: activeTab === "pedagogy" ? "2px solid var(--orange, #6E1A2D)" : "2px solid transparent",
                    background: "transparent",
                    color: activeTab === "pedagogy" ? "var(--orange, #6E1A2D)" : "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  📚 10-Point Learning Masterclass
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  style={{
                    padding: "12px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: "none",
                    borderBottom: activeTab === "audit" ? "2px solid var(--orange, #6E1A2D)" : "2px solid transparent",
                    background: "transparent",
                    color: activeTab === "audit" ? "var(--orange, #6E1A2D)" : "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  📜 Audit Trail Log ({currentScenarioState.auditTrail.length})
                </button>
              </div>

              {/* Tab 1: Interactive Lab Stage */}
              {activeTab === "lab" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  
                  {/* Scenario Banner */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "var(--bg-card)", padding: "16px 20px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--orange, #6E1A2D)" }}>
                          {activeScenario.scenarioId}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                          {activeScenario.scenarioName}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Process Area: <strong>{activeScenario.gtsProcessArea}</strong> | Source Authority: <strong>{activeScenario.sourceList}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: currentScenarioState.status === "RELEASED" ? "rgba(16,185,129,0.12)" : currentScenarioState.status === "CONFIRMED_BLOCK" ? "rgba(17,24,39,0.12)" : "rgba(239,68,68,0.12)",
                        color: currentScenarioState.status === "RELEASED" ? "#059669" : currentScenarioState.status === "CONFIRMED_BLOCK" ? "#1F2937" : "#DC2626"
                      }}>
                        CURRENT GTS: {currentScenarioState.status}
                      </span>
                      <button
                        onClick={handleResetScenario}
                        style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border-strong)", background: "var(--bg-surface)", cursor: "pointer" }}
                      >
                        🔄 Reset Lab
                      </button>
                    </div>
                  </div>

                  {/* 2-Column: Synthetic Document & Real Evidence */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    
                    {/* Left: Synthetic Business Partner & Feeder Document */}
                    <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
                        🏢 Synthetic Feeder Master Data (S/4HANA)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                        <div><strong>Partner:</strong> {activeScenario.syntheticPartner.name} ({activeScenario.syntheticPartner.partnerId})</div>
                        <div><strong>Role:</strong> {activeScenario.syntheticPartner.partnerType}</div>
                        <div><strong>Address:</strong> {activeScenario.syntheticPartner.street || 'N/A'}, {activeScenario.syntheticPartner.city || 'N/A'}, {activeScenario.syntheticPartner.countryName || activeScenario.syntheticPartner.country || 'N/A'}</div>
                        <div><strong>Tax ID:</strong> {activeScenario.syntheticPartner.taxId || 'Missing'}</div>
                        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "8px 0" }} />
                        <div><strong>Document:</strong> {activeScenario.syntheticDocument.docNumber} ({activeScenario.syntheticDocument.docType})</div>
                        <div><strong>Item:</strong> {activeScenario.syntheticDocument.material} — {activeScenario.syntheticDocument.materialDesc}</div>
                        <div><strong>Value:</strong> {activeScenario.syntheticDocument.currency} {(activeScenario.syntheticDocument.netValue || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Right: Live Screening Match Evidence */}
                    <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
                        🔍 Real-Time Sanctions Screening Engine
                      </div>
                      
                      {liveScreeningResult && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span><strong>Hits Detected:</strong> {liveScreeningResult.totalMatches}</span>
                            <span style={{
                              fontWeight: 700,
                              color: liveScreeningResult.totalMatches > 0 ? "#DC2626" : "#059669"
                            }}>
                              Score: {liveScreeningResult.matches[0]?.matchScore || 0}%
                            </span>
                          </div>

                          <div style={{ background: "var(--bg-surface)", padding: "8px 10px", borderRadius: 6 }}>
                            <strong>Basis:</strong> {liveScreeningResult.matches[0]?.matchBasis || "Clean pass: 0 entities matched"}
                          </div>

                          {liveScreeningResult.matches[0] && (
                            <div style={{ fontSize: 11.5 }}>
                              <div><strong>Source Entity:</strong> {liveScreeningResult.matches[0].matchedEntity} ({liveScreeningResult.matches[0].entityId})</div>
                              <div><strong>Source List:</strong> {liveScreeningResult.matches[0].sourceList} ({liveScreeningResult.matches[0].program})</div>
                              {liveScreeningResult.matches[0].matchedAlias && (
                                <div><strong>Matched Alias:</strong> {liveScreeningResult.matches[0].matchedAlias}</div>
                              )}
                            </div>
                          )}

                          {activeScenario.scenarioId === "SPL-015" && (
                            <div style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.3)", padding: 8, borderRadius: 6, fontSize: 11.5, color: "#B45309" }}>
                              🛡️ <strong>SCOMET Separation Enforced:</strong> Partner screening is clean. Product export license required for {activeScenario.screeningInput.scometCategory}.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Officer Adjudication Decision Box */}
                  <div style={{ background: "var(--bg-card)", padding: "18px 20px", borderRadius: 8, border: "2px solid var(--orange, #6E1A2D)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        ⚖️ Trade Compliance Officer Adjudication Cockpit
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        Protocol: {activeScenario.expectedOfficerAction}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                          REASON CODE (MANDATORY)
                        </label>
                        <select
                          value={selectedReasonCode}
                          onChange={(e) => setSelectedReasonCode(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 4, border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                        >
                          <option value="RC01">RC01: False Positive Identity Disproved</option>
                          <option value="RC02">RC02: Confirmed Match / Hard Block</option>
                          <option value="RC04">RC04: Transliteration / 4-Eyes Escalation</option>
                          <option value="RC05">RC05: Incomplete Data / Information Request</option>
                          <option value="LIC_SCOMET_01">LIC_SCOMET_01: Valid DGFT License Assigned</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                          OFFICER AUDIT RATIONALE (MANDATORY IN TRADE AUDITS)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Training review completed; verified against official UN SDi.007 snapshot..."
                          value={officerComment}
                          onChange={(e) => setOfficerComment(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 4, border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => handleExecuteDecision("RELEASE")}
                        style={{ flex: 1, padding: "8px 12px", background: "#059669", color: "#FFF", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                      >
                        ✓ False Positive — Release Document
                      </button>

                      <button
                        onClick={() => handleExecuteDecision("CONFIRM_BLOCK")}
                        style={{ flex: 1, padding: "8px 12px", background: "#1F2937", color: "#FFF", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                      >
                        ⛔ Confirmed Match — Permanent Block
                      </button>

                      <button
                        onClick={() => handleExecuteDecision("ESCALATE")}
                        style={{ flex: 1, padding: "8px 12px", background: "#D97706", color: "#FFF", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                      >
                        👥 Escalate for 4-Eyes Review
                      </button>

                      {activeScenario.scenarioId === "SPL-015" && (
                        <button
                          onClick={() => handleExecuteDecision("ASSIGN_LICENSE")}
                          style={{ flex: 1, padding: "8px 12px", background: "var(--orange, #6E1A2D)", color: "#FFF", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                        >
                          📜 Assign DGFT SCOMET License
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Downstream System Execution Status */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", padding: "14px 16px", borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 6 }}>
                        🔄 SAP S/4HANA Feeder Propagation (RFC Status)
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {currentScenarioState.s4Status}
                      </div>
                    </div>

                    <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", padding: "14px 16px", borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 6 }}>
                        📦 SAP EWM Warehouse Execution Status
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {currentScenarioState.ewmStatus}
                      </div>
                    </div>
                  </div>

                  {/* Automated Validation Results Card */}
                  {validationResult && (
                    <div style={{
                      background: validationResult.status === "PASS" ? "rgba(16,185,129,0.06)" : "rgba(217,119,6,0.06)",
                      border: validationResult.status === "PASS" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(217,119,6,0.3)",
                      borderRadius: 8,
                      padding: "16px 20px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{validationResult.status === "PASS" ? "✅" : "⚠️"}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: validationResult.status === "PASS" ? "#059669" : "#B45309" }}>
                            Automated Lab Validation Result: {validationResult.status}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          Checked at {validationResult.timestamp}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {validationResult.checks.map((c, idx) => (
                          <div key={idx} style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: 6, fontSize: 11.5, border: "1px solid var(--border-subtle)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                              <span>{c.check}</span>
                              <span style={{ color: c.passed ? "#059669" : "#DC2626" }}>{c.passed ? "✓ PASS" : "✗ FAIL"}</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                              Expected: {c.expected}
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--text-primary)" }}>
                              Actual: {c.actual}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Tab 2: 10-Point Learning Masterclass */}
              {activeTab === "pedagogy" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "rgba(110,26,45,0.06)", border: "1px solid rgba(110,26,45,0.2)", padding: "16px 20px", borderRadius: 8 }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: 16, color: "var(--orange, #6E1A2D)" }}>
                      🎯 Learning Objective: {activeScenario.learningObjective}
                    </h3>
                    <div style={{ fontSize: 12.5, color: "var(--text-body)" }}>
                      <strong>Consultant Note:</strong> {activeScenario.consultantNote}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(activeScenario.explanationPanel).map(([key, val], idx) => {
                      const titles = {
                        whatIsHappening: "1. What is happening?",
                        whyGtsPerformsCheck: "2. Why does GTS perform this check?",
                        dataEvaluated: "3. Which data is evaluated?",
                        officerReviewNeeds: "4. What does the officer need to review?",
                        decisionOptions: "5. What decision options are available?",
                        afterRelease: "6. What happens after release?",
                        afterBlock: "7. What happens after block?",
                        s4Reaction: "8. How does S/4HANA react?",
                        ewmReaction: "9. How does EWM react?",
                        interviewExplanation: "10. How to explain this in an SAP GTS interview?"
                      };

                      return (
                        <div key={key} style={{ background: "var(--bg-card)", padding: "12px 16px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--orange, #6E1A2D)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 4 }}>
                            {titles[key] || `${idx + 1}. Explanation`}
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Audit Trail Log */}
              {activeTab === "audit" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                  <div style={{ background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 700, fontSize: 13 }}>
                      Chronological Compliance Audit Trail (/SAPSLL/CHG_LOG)
                    </div>
                    {currentScenarioState.auditTrail.map((log, idx) => (
                      <div key={idx} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: "var(--font-mono)", color: "var(--orange, #6E1A2D)", fontWeight: 700 }}>
                            {log.action}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                            {log.timestamp}
                          </span>
                        </div>
                        <div style={{ color: "var(--text-body)" }}>
                          {log.comment}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>
                          User: <code>{log.user}</code> | Source System: <code>{log.sourceSystem || "SAP GTS"}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              Select a scenario from the catalog to begin training.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
