const axios = require('axios');

/**
 * Intent Classifier for MindBridge
 * Uses a lightweight LLM call to classify user intent to route to the correct prompt template.
 */
class IntentClassifier {
  /**
   * Classifies a user query into one of 5 modes.
   * @param {string} query The user's input query
   * @returns {Promise<string>} The intent enum string
   */
  static async classify(query) {
    const prompt = `Classify the following query from an elderly user into exactly ONE of the following intents:
    
1. DEMENTIA_DEESCALATION (e.g., "I want to go home", "I'm scared", "Where am I?", "Who is David?", "They are stealing my things")
2. MEDICATION_GUIDANCE (e.g., "Did I take my pill?", "When should I take Donepezil?", "Can I take ibuprofen?")
3. EMERGENCY_ESCALATION (e.g., "I fell", "My chest hurts", "I can't breathe", "I smell smoke")
4. CAREGIVER_SUPPORT (e.g., "How can David help me?", "My son is stressed", "I feel like a burden")
5. GENERAL_WELLNESS (e.g., "Is yoga safe?", "Why is calcium important?", "Hello", "How are you?")

Query: "${query}"

Output ONLY the exact string name of the intent. Nothing else.`;

    try {
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        return 'GENERAL_WELLNESS';
      }

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 20
        },
        { 
          timeout: 5000, 
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json' 
          } 
        }
      );
      
      const reply = response.data?.choices?.[0]?.message?.content?.trim() || '';
      
      const validIntents = [
        'DEMENTIA_DEESCALATION', 
        'MEDICATION_GUIDANCE', 
        'EMERGENCY_ESCALATION', 
        'CAREGIVER_SUPPORT', 
        'GENERAL_WELLNESS'
      ];
      
      // Strict matching
      const matched = validIntents.find(i => reply.includes(i));
      
      if (matched) {
        return matched;
      }
      
      return 'GENERAL_WELLNESS'; // Safe fallback
    } catch (e) {
      console.error('❌ Intent Router Error:', e.message);
      return 'GENERAL_WELLNESS'; // Safe fallback on API failure
    }
  }
}

module.exports = IntentClassifier;
