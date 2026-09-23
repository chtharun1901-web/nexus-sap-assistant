import * as XLSX from "xlsx";

export const InterviewExportService = {
  exportWord: (sessionTitle, items, profile = {}) => {
    let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
    html += "<head><meta charset='utf-8'><title>" + (sessionTitle || "Infosys SAP Interview Preparation Pack") + "</title>";
    html += "<style>body{font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#1F2937;margin:30px;}";
    html += "h1{color:#D97706;font-size:20pt;border-bottom:2px solid #D97706;padding-bottom:6px;margin-bottom:15px;}";
    html += "h2{color:#0F172A;font-size:14pt;margin-top:20px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;}";
    html += ".meta-box{background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;padding:12px;margin-bottom:20px;}";
    html += ".q-card{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:14px;margin-bottom:16px;page-break-inside:avoid;}";
    html += ".q-title{font-weight:bold;color:#1E3A8A;font-size:12pt;margin-bottom:8px;}";
    html += ".section-title{font-weight:bold;color:#475569;font-size:10pt;text-transform:uppercase;margin-top:8px;}";
    html += ".badge{display:inline-block;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:4px;font-size:9pt;font-weight:bold;margin-right:6px;}";
    html += ".score-badge{display:inline-block;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:4px;font-weight:bold;}";
    html += "ul{margin-top:4px;margin-bottom:8px;padding-left:20px;}li{margin-bottom:4px;}</style></head>";
    html += "<body><h1>Infosys SAP Interview Preparation Pack</h1>";
    html += "<div class='meta-box'>";
    html += "<p><strong>Candidate Target Role:</strong> " + (profile.targetRole || "Senior SAP PP/EWM Consultant") + "</p>";
    html += "<p><strong>Target Enterprise:</strong> Infosys Global Delivery Center</p>";
    html += "<p><strong>Experience Level:</strong> " + (profile.yearsExp || "5+") + " Years | <strong>Modules:</strong> " + (profile.modules || "SAP PP, EWM, MM, Integration") + "</p>";
    html += "<p><strong>Date Generated:</strong> " + new Date().toLocaleDateString() + " | <strong>Total Questions:</strong> " + items.length + "</p></div>";
    html += "<h2>Master Interview Questions & Model Answers</h2>";

    items.forEach((item, idx) => {
      html += "<div class='q-card'>";
      html += "<div class='q-title'>" + (idx + 1) + ". " + (item.question || "Interview Question") + "</div>";
      html += "<div><span class='badge'>" + (item.category || "SAP Technical") + "</span><span class='badge'>" + (item.difficulty || "Intermediate") + "</span>";
      if (item.score) html += "<span class='score-badge'>Score: " + item.score + "/100</span>";
      html += "</div>";

      if (item.shortAnswer) {
        html += "<div class='section-title'>30-Second Spoken Answer</div><p style='font-style:italic;color:#334155;'>&ldquo;" + item.shortAnswer + "&rdquo;</p>";
      }
      if (item.keyPoints && item.keyPoints.length) {
        html += "<div class='section-title'>Key Points to Mention</div><ul>" + item.keyPoints.map(kp => "<li>" + kp + "</li>").join("") + "</ul>";
      }
      if (item.example) {
        html += "<div class='section-title'>Practical Project Example</div><p>" + item.example + "</p>";
      }
      if (item.followUps && item.followUps.length) {
        html += "<div class='section-title'>Anticipated Follow-Up Questions</div><ul>" + item.followUps.map(f => "<li><strong>" + f.q + "</strong><br/><em>Answer:</em> " + f.a + "</li>").join("") + "</ul>";
      }
      if (item.commonMistakes && item.commonMistakes.length) {
        html += "<div class='section-title'>Mistakes to Avoid</div><ul style='color:#991B1B;'>" + item.commonMistakes.map(m => "<li>" + m + "</li>").join("") + "</ul>";
      }
      html += "</div>";
    });

    html += "<h2>Final-Day Revision Checklist</h2><ul>";
    html += "<li>Review Enterprise Hierarchy: Client &rarr; Company Code &rarr; Plant &rarr; Storage Location &rarr; EWM Warehouse.</li>";
    html += "<li>Articulate difference between PMR-based Advanced Production Integration and classic Delivery-Based staging.</li>";
    html += "<li>Explain qRFC FIFO mechanics in SMQ1/SMQ2 and state clearly: &ldquo;Never delete production queues without business evaluation.&rdquo;</li>";
    html += "<li>Structure all behavioral scenarios into Situation, Task, Action, and Result (STAR).</li>";
    html += "<li>Deliver a crisp 90-second self-introduction highlighting hands-on SAP problem-solving.</li>";
    html += "</ul></body></html>";

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Infosys_Interview_Prep_Pack_" + Date.now() + ".doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportExcel: (sessionTitle, items, profile = {}) => {
    const wb = XLSX.utils.book_new();
    const qData = items.map((it, idx) => ({
      "No.": idx + 1,
      "Category": it.category || "SAP Technical",
      "Question": it.question,
      "Difficulty": it.difficulty || "Intermediate",
      "Score": it.score || "N/A",
      "30s Spoken Answer": it.shortAnswer || it.answer || "",
      "Key Points": Array.isArray(it.keyPoints) ? it.keyPoints.join("; ") : "",
      "Practical Example": it.example || "",
      "T-Codes": Array.isArray(it.tcodes) ? it.tcodes.join(", ") : "",
      "Common Mistakes": Array.isArray(it.commonMistakes) ? it.commonMistakes.join("; ") : ""
    }));
    const wsQ = XLSX.utils.json_to_sheet(qData);
    XLSX.utils.book_append_sheet(wb, wsQ, "Interview Questions");

    const profileData = [
      { Metric: "Candidate Target Role", Value: profile.targetRole || "Senior SAP PP/EWM Consultant" },
      { Metric: "Target Enterprise", Value: "Infosys Global Delivery Center" },
      { Metric: "Experience Level", Value: profile.yearsExp || "5+ Years" },
      { Metric: "Key Modules", Value: profile.modules || "SAP PP, EWM, MM, qRFC" },
      { Metric: "Export Date", Value: new Date().toISOString() },
      { Metric: "Questions Practiced", Value: items.length }
    ];
    const wsProf = XLSX.utils.json_to_sheet(profileData);
    XLSX.utils.book_append_sheet(wb, wsProf, "Candidate Profile");

    XLSX.writeFile(wb, "Infosys_Interview_Pack_" + Date.now() + ".xlsx");
  },

  exportJSON: (items, profile = {}) => {
    const data = {
      title: "Infosys SAP Interview Preparation Pack",
      generatedAt: new Date().toISOString(),
      profile,
      totalQuestions: items.length,
      items
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Infosys_Interview_Data_" + Date.now() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
