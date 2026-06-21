const path = require('path');
const SimpleVectorStore = require('./src/modules/rag/services/SimpleVectorStore');
const QueryExpansionService = require('./src/modules/rag/services/QueryExpansionService');

const queries = [
  'What should I do if I miss my medication?',
  'Who is my emergency contact?',
  'Tell me about my grandchildren.',
  'What time is my doctor appointment?',
  'How much water should I drink?',
  'I feel dizzy and confused.',
  'What is my daughter\'s name?',
  'Can you help me remember my pills?',
  'How do I use my inhaler?',
  'Tell me a story about my past.'
];

(async () => {
  const storePath = path.join(__dirname, 'data', 'chroma', 'vector-store.json');
  const store = new SimpleVectorStore(storePath);
  await store.initialize();

  console.log('--- RAW SIMILARITY SCORES ---');
  for (const q of queries) {
    console.log('\nQuery:', q);
    const expanded = QueryExpansionService.getExpandedQueryString(q);
    
    const queryEmb = await SimpleVectorStore.getEmbedding(expanded);
    const scored = store.documents.map(doc => {
      let sim = 0;
      if (doc.embedding) {
        sim = SimpleVectorStore.cosineSimilarity(doc.embedding, queryEmb);
      }
      return { source: doc.metadata?.source, chunk: doc.metadata?.chunk_index, text: doc.content.substring(0, 50).replace(/\n/g, ' '), sim };
    });
    
    scored.sort((a,b) => b.sim - a.sim);
    console.log('Top 3:');
    scored.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. [${r.source} #${r.chunk}] Sim: ${r.sim.toFixed(4)} - ${r.text}`);
    });
  }
})();
