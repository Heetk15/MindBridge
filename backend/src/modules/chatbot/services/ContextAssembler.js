const PromptTemplates = require('./PromptTemplates');

class ContextAssembler {
  /**
   * Assembles the structured user state, RAG chunks, and user query into a single formatted prompt.
   * @param {Object} userState The structured data from UserContextService
   * @param {Array} ragDocs The retrieved RAG chunks
   * @param {string} userQuery The user's input message
   * @param {Array<string>} conversationContext The recent chat history
   * @param {string} intentMode The classified intent string
   * @returns {string} The formatted contextual prompt ready for the LLM
   */
  static assemble(userState, ragDocs, userQuery, conversationContext = [], intentMode = 'GENERAL_WELLNESS') {
    let prompt = '';

    // 0. Inject System Prompt Template
    const systemPrompt = PromptTemplates[intentMode] || PromptTemplates.GENERAL_WELLNESS;
    prompt += `${systemPrompt}\n\n`;

    // 1. Inject Deterministic User State
    if (userState) {
      prompt += '<USER_STATE>\n';
      
      prompt += `Profile:\n`;
      prompt += `- Name: ${userState.profile.name}\n`;
      prompt += `- Age: ${userState.profile.age}\n`;
      if (userState.profile.allergies && userState.profile.allergies.length > 0) {
        prompt += `- Allergies: ${userState.profile.allergies.join(', ')}\n`;
      }

      if (userState.emergencyContacts && userState.emergencyContacts.length > 0) {
        prompt += `\nEmergency Contacts:\n`;
        userState.emergencyContacts.forEach((c, i) => {
          prompt += `- ${i+1}. ${c.name} (${c.relationship}) - Phone: ${c.phone}\n`;
        });
      }

      if (userState.medications && userState.medications.length > 0) {
        prompt += `\nActive Medications:\n`;
        userState.medications.forEach((m, i) => {
          prompt += `- ${i+1}. ${m.name}: ${m.dosage} ${m.frequency} (Schedule: ${(m.scheduleTimes || []).join(', ')})\n`;
        });
      } else {
        prompt += `\nActive Medications: None logged.\n`;
      }

      prompt += '</USER_STATE>\n\n';
    }

    // 2. Inject Conversation Context (Short-term memory)
    if (conversationContext && conversationContext.length > 0) {
      prompt += '<RECENT_CONVERSATION>\n';
      conversationContext.forEach((msg, idx) => {
        prompt += `[Msg -${conversationContext.length - idx}]: ${msg}\n`;
      });
      prompt += '</RECENT_CONVERSATION>\n\n';
    }

    // 3. Inject Probabilistic Knowledge Base (RAG)
    if (ragDocs && ragDocs.length > 0) {
      prompt += '<KNOWLEDGE_BASE>\n';
      ragDocs.forEach((doc, idx) => {
        const content = doc.content ? doc.content.substring(0, 500).trim() : '';
        prompt += `[Doc ${idx + 1}]: ${content}\n---\n`;
      });
      prompt += '</KNOWLEDGE_BASE>\n\n';
    }

    // 4. Inject the actual user question
    prompt += `[USER QUESTION]:\n${userQuery}`;

    return prompt;
  }
}

module.exports = ContextAssembler;
