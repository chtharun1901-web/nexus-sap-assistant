import { sanitizeMermaid } from "./client/src/components/MermaidDiagram.jsx";

const rawChart = `flowchart TD
    PO["Production Order Released"] --> StagingReq["WM Staging Triggered (/SCWM/STAGE)"]
    StagingReq --> Sim["Simulation: Check Stock Availability & Bins"]
    Sim --> Exec["Execution: Create Warehouse Tasks (Pick & Move)"]
    Exec --> PSA["Materials Arrive at Production Supply Area (PSA)"]
    PSA --> Prod["Workers Consume Parts During Manufacturing"]`;

try {
  const sanitized = sanitizeMermaid(rawChart);
  console.log("Sanitized result:\n", sanitized);
} catch (e) {
  console.error("Sanitize Error:", e);
}
