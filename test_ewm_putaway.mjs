import { extractDrawingFlowData, buildDrawingMlXml } from "./client/src/utils/valueStreamMapping.js";

const sampleEwmPutawayDoc = {
  caseId: "conv-mttyywf6-c5df6c08",
  title: "What is resource management? in sap ewm",
  summary: "Resource management, WPT, Putaway Strategies and High Rack Storage (0010) in SAP EWM",
  overview: "In SAP EWM, Putaway Strategies determine the storage type and section search sequence (/SCWM/T331), while Putaway Rules decide the exact bin determination."
};

const f = extractDrawingFlowData(sampleEwmPutawayDoc, "Putaway Strategies, High Rack 0010, WPT, Resource Management", [], "conv-mttyywf6-c5df6c08");
console.log("Phase 1:", f.phase1);
console.log("Phase 2:", f.phase2);
