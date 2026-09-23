import { extractDrawingFlowData, buildDrawingMlXml } from "./client/src/utils/valueStreamMapping.js";

try {
  console.log("Testing empty call...");
  const f1 = extractDrawingFlowData(null, null, null, null);
  console.log("f1:", f1);
  const xml1 = buildDrawingMlXml(f1);
  console.log("xml1 length:", xml1.length);

  console.log("Testing with undefined conversationTurns...");
  const f2 = extractDrawingFlowData({ title: "CO01 Test" }, "Some text", undefined, "conv-123");
  console.log("f2:", f2);
  const xml2 = buildDrawingMlXml(f2);
  console.log("xml2 length:", xml2.length);

  console.log("ALL PASSED!");
} catch (err) {
  console.error("ERROR:", err);
}
