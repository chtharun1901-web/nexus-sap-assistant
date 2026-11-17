/**
 * Nexus Session Task & Intelligence Extractor
 * 
 * Provides:
 * 1. Task State Model for explicit and implied work items
 * 2. Separate Session Topic Map and Session Task Map
 * 3. Answers for "What did I ask?", "What is pending?", "What decisions were made?"
 * 
 * RULE: The `module` field must remain null for generic daily tasks.
 * Do not assign an SAP module unless task evidence supports it!
 */

export class TaskExtractor {
  /**
   * Extract tasks from conversation history and user prompt
   * @param {Array} messages - [{ id, role, content, createdAt }]
   * @param {Object} options - { currentFiles, activeTopic }
   */
  static extractSessionTasks(messages = [], options = {}) {
    const tasks = [];
    let taskCounter = 1;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role !== 'user') continue;

      const content = msg.content || '';
      const lower = content.toLowerCase();

      // Check for explicit action statements
      const actionMatches = [
        /(?:i have to|i need to|we need to|please|help me|can you|let'?s|must|target of)\s+([^.?!;\n]+)/gi,
        /(?:prepare|review|create|draft|send|build|analyze|track|schedule|verify|test)\s+([^.?!;\n]+)/gi
      ];

      for (const regex of actionMatches) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          const rawTask = match[0].trim();
          if (rawTask.length < 8 || rawTask.length > 120) continue;

          // Determine priority
          let priority = 'medium';
          if (lower.includes('urgent') || lower.includes('asap') || lower.includes('high priority') || lower.includes('first')) {
            priority = 'high';
          } else if (lower.includes('eventually') || lower.includes('later') || lower.includes('low priority')) {
            priority = 'low';
          }

          // Check if there is concrete SAP module evidence for this task
          let moduleCode = null;
          const sapModules = ['GTS', 'EWM', 'SD', 'MM', 'PP', 'FICO', 'TM', 'IS-Retail'];
          for (const m of sapModules) {
            const mReg = new RegExp(`\\b${m}\\b`, 'i');
            if (mReg.test(rawTask) || (lower.includes('sap') && mReg.test(lower))) {
              moduleCode = m.toUpperCase();
              break;
            }
          }

          // Category
          let category = 'Daily Work';
          if (lower.includes('email') || lower.includes('message')) category = 'Communication';
          else if (lower.includes('meeting') || lower.includes('calendar') || lower.includes('session')) category = 'Scheduling';
          else if (lower.includes('excel') || lower.includes('spreadsheet') || lower.includes('report')) category = 'Documentation';
          else if (moduleCode) category = `SAP ${moduleCode}`;

          // Check if completed in subsequent model message
          const nextModelMsg = messages[i + 1]?.role === 'model' ? messages[i + 1] : null;
          let status = 'identified';
          if (nextModelMsg) {
            status = 'completed';
          }

          tasks.push({
            taskId: `TASK-${String(taskCounter++).padStart(3, '0')}`,
            title: rawTask.slice(0, 70),
            description: rawTask,
            sourceMessageId: msg.id || `msg-${i}`,
            category,
            priority,
            status,
            deadline: lower.includes('today') ? 'Today' : (lower.includes('november') ? 'November End' : null),
            dependencies: [],
            relatedFiles: options.currentFiles || [],
            relatedTopics: options.activeTopic ? [options.activeTopic] : [],
            module: moduleCode, // null for generic tasks!
            nextAction: status === 'completed' ? 'Reviewed' : 'Awaiting execution'
          });
        }
      }
    }

    // Deduplicate by title similarity
    const unique = [];
    for (const t of tasks) {
      if (!unique.some(u => u.title.toLowerCase() === t.title.toLowerCase())) {
        unique.push(t);
      }
    }

    return unique.slice(0, 15);
  }

  /**
   * Generates Separate Session Topic Map and Session Task Map
   */
  static buildSessionIntelligence(messages = [], files = []) {
    const tasks = this.extractSessionTasks(messages, { currentFiles: files });

    const topicMap = {
      sapTopics: [],
      generalTopics: [],
      filesReferenced: files.map(f => f.filename || f.name || f)
    };

    const taskMap = {
      completedTasks: tasks.filter(t => t.status === 'completed'),
      pendingTasks: tasks.filter(t => t.status === 'identified' || t.status === 'in_progress'),
      blockedTasks: tasks.filter(t => t.status === 'blocked'),
      totalIdentified: tasks.length
    };

    // Classify topics across turns
    messages.forEach(m => {
      if (m.role === 'user') {
        const text = m.content || '';
        const lower = text.toLowerCase();
        
        if (/\b(?:gts|ewm|sd|mm|pp|fico|s\/4hana|sap)\b/i.test(text)) {
          if (!topicMap.sapTopics.includes(text.slice(0, 50))) {
            topicMap.sapTopics.push(text.slice(0, 50));
          }
        } else {
          if (!topicMap.generalTopics.includes(text.slice(0, 50))) {
            topicMap.generalTopics.push(text.slice(0, 50));
          }
        }
      }
    });

    return {
      sessionTopicMap: topicMap,
      sessionTaskMap: taskMap,
      summary: {
        totalQueries: messages.filter(m => m.role === 'user').length,
        sapTopicsCount: topicMap.sapTopics.length,
        generalTopicsCount: topicMap.generalTopics.length,
        completedCount: taskMap.completedTasks.length,
        pendingCount: taskMap.pendingTasks.length
      }
    };
  }

  /**
   * Answers Session Intelligence queries (e.g. "What are my pending items?")
   */
  static generateSessionSummaryAnswer(query = '', sessionIntelligence) {
    const { sessionTopicMap, sessionTaskMap } = sessionIntelligence;

    return `## Session Intelligence & Task Review

### 📋 Session Task Map
- **Completed Deliverables (${sessionTaskMap.completedTasks.length}):**
${sessionTaskMap.completedTasks.map(t => `  * [x] **${t.taskId}**: ${t.title} (${t.category})`).join('\n') || '  *(None logged)*'}

- **Pending & Next Actions (${sessionTaskMap.pendingTasks.length}):**
${sessionTaskMap.pendingTasks.map(t => `  * [ ] **${t.taskId}**: ${t.title} [Priority: ${t.priority.toUpperCase()}]`).join('\n') || '  *(All current session tasks resolved)*'}

---

### 🗺️ Session Topic Map
- **SAP Enterprise Topics:** ${sessionTopicMap.sapTopics.length > 0 ? sessionTopicMap.sapTopics.join(', ') : 'None in this session'}
- **General Daily Work Topics:** ${sessionTopicMap.generalTopics.length > 0 ? sessionTopicMap.generalTopics.join(', ') : 'None in this session'}
- **Active Files:** ${sessionTopicMap.filesReferenced.join(', ') || 'No attached files'}

---
**Recommended Next Action:** Review pending items above and designate priority sequence.
`;
  }
}
