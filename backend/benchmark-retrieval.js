const path = require('path');
const fs = require('fs');
const SimpleVectorStore = require('./src/modules/rag/services/SimpleVectorStore');
const QueryExpansionService = require('./src/modules/rag/services/QueryExpansionService');

const queries = [
  // Dementia Support
  { q: "My mother thinks she is living in the past, what do I do?", expected: "dementia-confusion-handling.txt" },
  { q: "He is trying to leave the house at night.", expected: "dementia-wandering-behavior.txt" },
  { q: "How do I deal with sudden angry outbursts?", expected: "dementia-agitation-handling.txt" },
  { q: "What can I do to help my mom remember things?", expected: "dementia-memory-reinforcement.txt" },
  { q: "How should I talk to someone with dementia?", expected: "dementia-communication-strategies.txt" },
  { q: "My wife is looking for her dead husband.", expected: "dementia-reassurance-techniques.txt" },

  // Caregiver Support
  { q: "I'm exhausted and can't take this anymore.", expected: "caregiver-burnout-prevention.txt" },
  { q: "How do I talk to my dad about taking away his car keys?", expected: "caregiver-difficult-conversations.txt" },
  { q: "Why is it important to have a consistent schedule?", expected: "caregiver-daily-routines.txt" },
  { q: "How do I safely store medications at home?", expected: "caregiver-medication-management.txt" },
  { q: "I feel guilty for getting angry at my mom.", expected: "caregiver-emotional-support.txt" },

  // Medication Adherence
  { q: "He refuses to swallow his pills.", expected: "medication-refusal-handling.txt" },
  { q: "How can I remember to give the midday dose?", expected: "medication-tracking-strategies.txt" },
  { q: "Can I mix these two medications?", expected: "medication-safety-guidelines.txt" },

  // Emergency Guidance
  { q: "She just fell in the bathroom but says she's fine.", expected: "emergency-fall-response.txt" },
  { q: "What are the signs of a stroke?", expected: "emergency-stroke-warning.txt" },
  { q: "My dad hasn't peed all day and is confused.", expected: "emergency-dehydration-signs.txt" },
  { q: "He is complaining of chest pain and shortness of breath.", expected: "emergency-chest-pain.txt" },
  { q: "Should I go to the ER or urgent care for a minor cut?", expected: "emergency-escalation-procedures.txt" },

  // Elderly Wellness
  { q: "What are good brain games to play?", expected: "wellness-cognitive-stimulation.txt" },
  { q: "How can I encourage my mom to eat more?", expected: "wellness-senior-nutrition.txt" },
  { q: "What type of exercise is safe for seniors?", expected: "wellness-senior-exercise.txt" },
  { q: "Why does my dad need to socialize more?", expected: "wellness-social-engagement.txt" },

  // Platform Help
  { q: "How do I add a new medication reminder?", expected: "platform-reminders-setup.txt" },
  { q: "Where is the SOS button?", expected: "platform-sos-feature.txt" },
  { q: "How do I see my loved one's activity log?", expected: "platform-caregiver-dashboard.txt" },
  { q: "How do I update the emergency contacts list?", expected: "platform-profile-management.txt" },
  { q: "How long should I play the memory games?", expected: "platform-games-guide.txt" }
];

(async () => {
  console.log('⏳ Initializing Benchmark...\n');
  const storePath = path.join(__dirname, 'data', 'chroma', 'vector-store.json');
  const store = new SimpleVectorStore(storePath);
  await store.initialize();

  // --- Corpus Statistics ---
  const docs = store.documents;
  const totalChunks = docs.length;
  const sources = new Set();
  let totalLength = 0;
  let minLength = Infinity;
  let maxLength = 0;

  docs.forEach(d => {
    sources.add(d.metadata.source);
    const len = d.content.length;
    totalLength += len;
    if (len < minLength) minLength = len;
    if (len > maxLength) maxLength = len;
  });

  console.log('--- Corpus Statistics ---');
  console.log(`Total Chunks:      ${totalChunks}`);
  console.log(`Total Sources:     ${sources.size}`);
  console.log(`Average Chunk:     ${Math.round(totalLength / totalChunks)} chars`);
  console.log(`Largest Chunk:     ${maxLength} chars`);
  console.log(`Smallest Chunk:    ${minLength} chars`);
  console.log(`Sources Represented:`);
  Array.from(sources).forEach(s => console.log(`  - ${s}`));
  console.log('\n-------------------------\n');

  // --- Run Queries ---
  const results = [];
  
  for (const item of queries) {
    // We bypass semantic threshold inside hybridQuery for the benchmark by passing 0 threshold
    // Actually, hybridQuery hardcodes 0.15 threshold. We'll manually compute similarity here to get all raw scores.
    
    const queryEmbedding = await SimpleVectorStore.getEmbedding(item.q);
    const keywordScores = await store.keywordSearch(item.q, totalChunks);
    
    const scoredDocs = store.documents.map(doc => {
      let semanticSim = 0;
      if (doc.embedding) semanticSim = SimpleVectorStore.cosineSimilarity(doc.embedding, queryEmbedding);
      
      const kwMatch = keywordScores.find(k => k.id === doc.id);
      const kwScore = kwMatch ? kwMatch.keywordScore : 0;
      
      const combinedScore = (semanticSim * 0.7) + (kwScore * 0.3);
      return { source: doc.metadata.source, chunk: doc.metadata.chunk_index, combinedScore, semanticSim, kwScore };
    });

    scoredDocs.sort((a,b) => b.combinedScore - a.combinedScore);
    const top = scoredDocs.slice(0, 3);
    
    // Find expected rank
    const expectedRank = scoredDocs.findIndex(d => d.source === item.expected) + 1;
    
    const isTop1 = expectedRank === 1;
    const isTop3 = expectedRank > 0 && expectedRank <= 3;
    
    results.push({
      query: item.q,
      expectedDocument: item.expected,
      top1: top[0] ? top[0].source : null,
      top2: top[1] ? top[1].source : null,
      top3: top[2] ? top[2].source : null,
      top1Score: top[0] ? top[0].combinedScore : 0,
      top2Score: top[1] ? top[1].combinedScore : 0,
      top3Score: top[2] ? top[2].combinedScore : 0,
      expectedRank,
      isTop1,
      isTop3,
      allScores: scoredDocs.map(d => ({ source: d.source, score: d.combinedScore }))
    });
  }

  // --- Calculate Metrics ---
  const top1Acc = results.filter(r => r.isTop1).length / queries.length;
  const top3Acc = results.filter(r => r.isTop3).length / queries.length;
  
  let mrrSum = 0;
  results.forEach(r => {
    if (r.expectedRank > 0) mrrSum += (1 / r.expectedRank);
  });
  const mrr = mrrSum / queries.length;

  console.log('--- Retrieval Quality Metrics ---');
  console.log(`Top-1 Accuracy: ${(top1Acc * 100).toFixed(1)}%`);
  console.log(`Top-3 Accuracy: ${(top3Acc * 100).toFixed(1)}%`);
  console.log(`Mean Reciprocal Rank (MRR): ${mrr.toFixed(3)}`);
  
  // Print JSON summary
  console.log('\n--- Detailed JSON Output ---');
  const jsonOut = results.map(r => ({
    query: r.query,
    expectedDocument: r.expectedDocument,
    top1: r.top1,
    top2: r.top2,
    top3: r.top3,
    top1Score: Number(r.top1Score.toFixed(3)),
    top2Score: Number(r.top2Score.toFixed(3)),
    top3Score: Number(r.top3Score.toFixed(3)),
    pass: r.isTop3
  }));
  fs.writeFileSync('benchmark-results.json', JSON.stringify(jsonOut, null, 2));
  console.log('Detailed JSON saved to benchmark-results.json');

  // --- Threshold Analysis ---
  console.log('\n--- Threshold Analysis ---');
  const thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50];
  console.log('Threshold | Top-1 Acc | Top-3 Acc | Retained Queries');
  console.log('----------------------------------------------------');
  
  thresholds.forEach(th => {
    let top1Count = 0;
    let top3Count = 0;
    let retainedCount = 0;
    
    results.forEach(r => {
      // Filter out scores below threshold
      const validDocs = r.allScores.filter(d => d.score >= th);
      if (validDocs.length > 0) {
        retainedCount++;
        // Check if expected is top 1
        if (validDocs[0].source === r.expectedDocument) top1Count++;
        // Check if expected is in top 3
        const inTop3 = validDocs.slice(0, 3).some(d => d.source === r.expectedDocument);
        if (inTop3) top3Count++;
      }
    });
    
    const t1 = ((top1Count / queries.length) * 100).toFixed(1).padStart(5);
    const t3 = ((top3Count / queries.length) * 100).toFixed(1).padStart(5);
    const req = ((retainedCount / queries.length) * 100).toFixed(1).padStart(5);
    
    console.log(`${th.toFixed(2).padStart(9)} |   ${t1}% |   ${t3}% |     ${req}%`);
  });
  
})();
