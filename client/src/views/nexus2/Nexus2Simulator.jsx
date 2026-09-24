import React, { useState, useEffect, useMemo, useRef } from "react";
import Nexus2Header from "./components/Nexus2Header.jsx";
import FioriSidebar from "./components/FioriSidebar.jsx";
import WorklistView from "./components/WorklistView.jsx";
import WorkItemDetail from "./components/WorkItemDetail.jsx";
import OfficerActionDialog from "./components/OfficerActionDialog.jsx";
import LearningSidePanel from "./components/LearningSidePanel.jsx";
import LandscapeModal from "./components/LandscapeModal.jsx";

import {
  INITIAL_PARTNERS,
  INITIAL_DOCUMENTS,
  INITIAL_LICENSES,
  INITIAL_CUSTOMS_DECLARATIONS,
  INITIAL_INTEGRATION_QUEUES,
  ROLES
} from "./data/initialData.js";
import { GtsStateMachine } from "./engine/stateMachine.js";

export default function Nexus2Simulator({ onNavigate }) {
  // 1. Initialize State Machine
  const stateMachineRef = useRef(null);
  if (!stateMachineRef.current) {
    stateMachineRef.current = new GtsStateMachine({
      partners: INITIAL_PARTNERS,
      documents: INITIAL_DOCUMENTS,
      licenses: INITIAL_LICENSES,
      queues: INITIAL_INTEGRATION_QUEUES
    });
  }

  const [gtsState, setGtsState] = useState(() => stateMachineRef.current.getSnapshot());

  useEffect(() => {
    const unsubscribe = stateMachineRef.current.subscribe((updated) => {
      setGtsState(updated);
    });
    return unsubscribe;
  }, []);

  // 2. Navigation & UI State
  const [activeMenu, setActiveMenu] = useState("blocked_docs");
  const [activeRole, setActiveRole] = useState("COMPLIANCE_OFFICER");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordType, setSelectedRecordType] = useState("document");
  const [showLearningPanel, setShowLearningPanel] = useState(true);
  const [showLandscapeModal, setShowLandscapeModal] = useState(false);

  // 3. Action Dialog State
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    actionType: "RELEASE",
    item: null,
    itemType: "document"
  });

  // Calculate live badge counts for sidebar
  const badgeCounts = useMemo(() => {
    const blockedPartners = gtsState.partners.filter(p => p.status === "BLOCKED").length;
    const blockedDocs = gtsState.documents.filter(d => d.status === "BLOCKED").length;
    const licenses = gtsState.licenses.filter(l => l.status === "EXPIRING_QUOTA").length;
    const exportDecs = INITIAL_CUSTOMS_DECLARATIONS.filter(d => d.status === "CLEARED").length;
    const exitOverdue = INITIAL_CUSTOMS_DECLARATIONS.filter(d => d.status === "EXIT_OVERDUE").length;
    const queueErrors = gtsState.queues.filter(q => q.status === "STOPPED").length;

    return { blockedPartners, blockedDocs, licenses, exportDecs, exitOverdue, queueErrors };
  }, [gtsState]);

  // Keep selected record synced with state updates
  useEffect(() => {
    if (!selectedRecord) return;
    if (selectedRecordType === "document") {
      const refreshed = gtsState.documents.find(d => d.id === selectedRecord.id);
      if (refreshed) setSelectedRecord(refreshed);
    } else if (selectedRecordType === "partner") {
      const refreshed = gtsState.partners.find(p => p.id === selectedRecord.id);
      if (refreshed) setSelectedRecord(refreshed);
    }
  }, [gtsState, selectedRecordType]);

  const handleSelectRecord = (record, type) => {
    setSelectedRecord(record);
    setSelectedRecordType(type);
  };

  const handleOpenActionDialog = (actionType, item, itemType) => {
    setActionDialog({
      isOpen: true,
      actionType,
      item: item || selectedRecord,
      itemType: itemType || selectedRecordType
    });
  };

  const handleConfirmAction = ({ actionType, reasonCode, comment, licenseId, fourEyes }) => {
    const sm = stateMachineRef.current;
    const currentOfficer = ROLES.find(r => r.id === activeRole)?.title || "COMPLIANCE_OFFICER";

    if (actionDialog.itemType === "document") {
      if (actionType === "RELEASE") {
        sm.releaseDocument(actionDialog.item.id, { reasonCode, comment, fourEyes, user: currentOfficer });
      } else if (actionType === "CONFIRM_BLOCK") {
        sm.confirmBlockDocument(actionDialog.item.id, { reasonCode, comment, user: currentOfficer });
      } else if (actionType === "ASSIGN_LICENSE") {
        sm.assignLicense(actionDialog.item.id, licenseId, { user: currentOfficer });
      }
    } else if (actionDialog.itemType === "partner") {
      if (actionType === "RELEASE") {
        sm.releasePartner(actionDialog.item.id, { reasonCode, comment, fourEyes, user: currentOfficer });
      } else if (actionType === "CONFIRM_BLOCK") {
        sm.confirmBlockPartner(actionDialog.item.id, { reasonCode, comment, user: currentOfficer });
      }
    }

    setActionDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg-main)"
      }}
    >
      {/* 1. Fiori Top Bar */}
      <Nexus2Header
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        showLearningPanel={showLearningPanel}
        onToggleLearningPanel={() => setShowLearningPanel(prev => !prev)}
        onOpenLandscape={() => setShowLandscapeModal(true)}
        onExitSimulator={() => onNavigate && onNavigate("workspace")}
      />

      {/* 2. Workspace Body: Left Sidebar + Center Content + Right Learning Panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Navigation Tree */}
        <FioriSidebar
          activeMenu={activeMenu}
          onSelectMenu={(menuId) => {
            setActiveMenu(menuId);
            setSelectedRecord(null); // Clear detail view on menu switch
          }}
          badgeCounts={badgeCounts}
        />

        {/* Center Main Stage (Worklist OR Detail View) */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {selectedRecord ? (
            <WorkItemDetail
              item={selectedRecord}
              type={selectedRecordType}
              onBack={() => setSelectedRecord(null)}
              onOpenActionDialog={handleOpenActionDialog}
            />
          ) : (
            <WorklistView
              activeMenu={activeMenu}
              partners={gtsState.partners}
              documents={gtsState.documents}
              licenses={gtsState.licenses}
              declarations={INITIAL_CUSTOMS_DECLARATIONS}
              queues={gtsState.queues}
              onSelectRecord={handleSelectRecord}
              onOpenActionDialog={handleOpenActionDialog}
              selectedId={selectedRecord?.id}
            />
          )}
        </main>

        {/* Right Learning Explanation Panel (Collapsible) */}
        {showLearningPanel && (
          <LearningSidePanel
            activeMenu={activeMenu}
            selectedItem={selectedRecord}
            itemType={selectedRecordType}
            activeRole={activeRole}
          />
        )}
      </div>

      {/* 3. Action Adjudication Modal */}
      {actionDialog.isOpen && (
        <OfficerActionDialog
          isOpen={actionDialog.isOpen}
          actionType={actionDialog.actionType}
          item={actionDialog.item}
          itemType={actionDialog.itemType}
          licenses={gtsState.licenses}
          onClose={() => setActionDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* 4. Architecture Landscape Modal */}
      {showLandscapeModal && (
        <LandscapeModal
          isOpen={showLandscapeModal}
          onClose={() => setShowLandscapeModal(false)}
        />
      )}
    </div>
  );
}
