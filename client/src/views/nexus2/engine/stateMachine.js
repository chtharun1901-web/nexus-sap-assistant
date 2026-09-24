// Nexus 2.0 SAP GTS Simulation State Machine & Downstream Propagator

export class GtsStateMachine {
  constructor(initialData) {
    this.partners = [...(initialData.partners || [])];
    this.documents = [...(initialData.documents || [])];
    this.licenses = [...(initialData.licenses || [])];
    this.queues = [...(initialData.queues || [])];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn({
      partners: [...this.partners],
      documents: [...this.documents],
      licenses: [...this.licenses],
      queues: [...this.queues]
    }));
  }

  getSnapshot() {
    return {
      partners: this.partners,
      documents: this.documents,
      licenses: this.licenses,
      queues: this.queues
    };
  }

  // 1. Release Blocked Partner
  releasePartner(partnerId, { reasonCode, comment, fourEyes, user = "OFFICER_CURRENT" }) {
    const idx = this.partners.findIndex(p => p.id === partnerId);
    if (idx === -1) return false;

    const partner = { ...this.partners[idx] };
    const oldStatus = partner.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    partner.status = "RELEASED";
    partner.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "SPL_RELEASED",
        oldStatus,
        newStatus: "RELEASED",
        reasonCode,
        comment: `${reasonCode}: ${comment} (Dual-Control 4-Eyes Verified: ${fourEyes ? 'YES' : 'NO'})`,
        sourceSystem: "SAP GTS /SAPSLL/SPL_CHCK"
      },
      ...partner.auditTrail
    ];

    this.partners[idx] = partner;

    // Check if any blocked documents for this partner can now be updated
    this.documents = this.documents.map(doc => {
      if (doc.partner.includes(partner.partnerNumber)) {
        const updatedDoc = { ...doc };
        if (updatedDoc.complianceCards?.spl) {
          updatedDoc.complianceCards = {
            ...updatedDoc.complianceCards,
            spl: {
              ...updatedDoc.complianceCards.spl,
              status: "PASSED",
              result: "Partner Released via SPL Audit RC01",
              reason: `Cleared by Compliance Officer ${user}`,
              nextAction: "None"
            }
          };
        }
        return updatedDoc;
      }
      return doc;
    });

    this.notify();
    return true;
  }

  // 2. Confirm Block on Partner
  confirmBlockPartner(partnerId, { reasonCode, comment, user = "OFFICER_CURRENT" }) {
    const idx = this.partners.findIndex(p => p.id === partnerId);
    if (idx === -1) return false;

    const partner = { ...this.partners[idx] };
    const oldStatus = partner.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    partner.status = "CONFIRMED_BLOCK";
    partner.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "SPL_CONFIRMED_BLOCK",
        oldStatus,
        newStatus: "CONFIRMED_BLOCK",
        reasonCode,
        comment: `${reasonCode}: ${comment}`,
        sourceSystem: "SAP GTS /SAPSLL/SPL_CHCK"
      },
      ...partner.auditTrail
    ];

    this.partners[idx] = partner;
    this.notify();
    return true;
  }

  // 3. Release Blocked Document with Downstream S/4HANA and EWM Propagation
  releaseDocument(docId, { reasonCode, comment, fourEyes, user = "OFFICER_CURRENT" }) {
    const idx = this.documents.findIndex(d => d.id === docId);
    if (idx === -1) return false;

    const doc = { ...this.documents[idx] };
    const oldStatus = doc.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    doc.status = "RELEASED";
    doc.owner = user;
    doc.lastChanged = "Just now";

    // Downstream S/4HANA and EWM Execution update
    doc.downstreamImpact = {
      s4Status: "CLEARED: Delivery Block 01 removed in VBAK/VBEP. Feeder status synced via RFC.",
      ewmStatus: "RELEASED: Warehouse Outbound Delivery created. Picking waves activated in EWM.",
      actionToUnblock: "Fully cleared. All downstream SAP logistics systems unblocked."
    };

    // Update Document Flow steps
    doc.documentFlow = doc.documentFlow.map(step => {
      if (step.system === "SAP GTS" && (step.status === "BLOCKED" || step.status === "PENDING")) {
        return { ...step, status: "COMPLETED", detail: `Released by ${user} with Reason ${reasonCode}` };
      }
      if (step.system === "S/4HANA" && step.status === "BLOCKED") {
        return { ...step, status: "COMPLETED", detail: "Delivery block removed. Feeder status synchronized." };
      }
      if (step.system === "SAP EWM" && (step.status === "HELD" || step.status === "BLOCKED")) {
        return { ...step, status: "COMPLETED", detail: "Picking Wave generated. EWM Warehouse Task 70019 ready for execution." };
      }
      return step;
    });

    // Add downstream step if not present
    if (!doc.documentFlow.some(s => s.step.includes("EWM Picking Executed"))) {
      doc.documentFlow.push({
        step: "EWM Warehouse Execution Active",
        system: "SAP EWM",
        status: "ACTIVE",
        detail: "Goods Issue staging permitted. Physical picking underway."
      });
    }

    doc.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "DOC_RELEASED",
        oldStatus,
        newStatus: "RELEASED",
        reasonCode,
        comment: `${reasonCode}: ${comment} (Dual Control 4-Eyes: ${fourEyes ? 'YES' : 'NO'})`,
        sourceSystem: "SAP GTS /SAPSLL/BL_DOCS"
      },
      ...doc.auditTrail
    ];

    this.documents[idx] = doc;
    this.notify();
    return true;
  }

  // 4. Confirm Block on Document
  confirmBlockDocument(docId, { reasonCode, comment, user = "OFFICER_CURRENT" }) {
    const idx = this.documents.findIndex(d => d.id === docId);
    if (idx === -1) return false;

    const doc = { ...this.documents[idx] };
    const oldStatus = doc.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    doc.status = "CONFIRMED_BLOCK";
    doc.owner = user;
    doc.lastChanged = "Just now";

    doc.downstreamImpact = {
      s4Status: "PERMANENT HARD BLOCK: Rejection Reason '98' (Compliance Block) set in VBAK.",
      ewmStatus: "CANCELLED: Inbound/Outbound delivery rejected. Stock released back to available inventory.",
      actionToUnblock: "Cannot unblock without written authorization from Group General Counsel."
    };

    doc.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "DOC_CONFIRMED_BLOCK",
        oldStatus,
        newStatus: "CONFIRMED_BLOCK",
        reasonCode,
        comment: `${reasonCode}: ${comment}`,
        sourceSystem: "SAP GTS /SAPSLL/BL_DOCS"
      },
      ...doc.auditTrail
    ];

    this.documents[idx] = doc;
    this.notify();
    return true;
  }

  // 5. Assign License to Document & Auto-recheck
  assignLicense(docId, licenseId, { user = "OFFICER_CURRENT" }) {
    const docIdx = this.documents.findIndex(d => d.id === docId);
    const licIdx = this.licenses.findIndex(l => l.id === licenseId);
    if (docIdx === -1 || licIdx === -1) return false;

    const doc = { ...this.documents[docIdx] };
    const license = { ...this.licenses[licIdx] };
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // Update license assigned documents and remaining quota
    if (!license.assignedDocuments.includes(docId)) {
      license.assignedDocuments.push(docId);
      const docVal = parseFloat(doc.netValue.replace(/,/g, '')) || 0;
      const remVal = Math.max(0, parseFloat(license.remainingValue.replace(/,/g, '')) - docVal);
      license.remainingValue = remVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Update document compliance card
    doc.complianceCards.legalControl = {
      status: "PASSED",
      rule: `Assigned License ${license.licenseNumber} (${license.type})`,
      input: `Doc Value ${doc.netValue} ${doc.currency} / License Remaining ${license.remainingValue}`,
      result: "Authorized: Quota available and destination country valid",
      reason: `Assigned by ${user}. License active through ${license.validTo}`,
      nextAction: "Release document"
    };

    doc.status = "UNDER_REVIEW";
    doc.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "LICENSE_ASSIGNED",
        oldStatus: "BLOCKED",
        newStatus: "UNDER_REVIEW",
        comment: `Assigned Export License ${license.licenseNumber}. Legal control check passed.`,
        sourceSystem: "SAP GTS /SAPSLL/LIC_MGMT"
      },
      ...doc.auditTrail
    ];

    this.documents[docIdx] = doc;
    this.licenses[licIdx] = license;
    this.notify();
    return true;
  }

  // 6. Escalate Document for 4-Eyes Review
  escalateDocument(docId, { reasonCode = "RC04", comment, user = "OFFICER_CURRENT" }) {
    const idx = this.documents.findIndex(d => d.id === docId);
    if (idx === -1) return false;

    const doc = { ...this.documents[idx] };
    const oldStatus = doc.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    doc.status = "UNDER_REVIEW";
    doc.owner = user;
    doc.lastChanged = "Just now";

    doc.downstreamImpact = {
      s4Status: "COMPLIANCE REVIEW IN PROGRESS: Feeder system delivery block remains active pending four-eyes approval.",
      ewmStatus: "ON HOLD: Warehouse execution suspended pending compliance review completion.",
      actionToUnblock: "Awaiting senior trade compliance officer or director authorization."
    };

    doc.auditTrail = [
      {
        timestamp: nowStr,
        user,
        action: "DOC_ESCALATED",
        oldStatus,
        newStatus: "UNDER_REVIEW",
        reasonCode,
        comment: `${reasonCode}: ${comment}`,
        sourceSystem: "SAP GTS /SAPSLL/BL_DOCS"
      },
      ...doc.auditTrail
    ];

    this.documents[idx] = doc;
    this.notify();
    return true;
  }
}
