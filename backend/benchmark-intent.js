require('dotenv').config();
const IntentClassifier = require('./src/modules/chatbot/services/IntentClassifier');
const fs = require('fs');

const testCases = [
  // DEMENTIA_DEESCALATION
  { text: "Where am I? This isn't my house.", expected: "DEMENTIA_DEESCALATION" },
  { text: "I want to go home now.", expected: "DEMENTIA_DEESCALATION" },
  { text: "Who are you? You are stealing my things!", expected: "DEMENTIA_DEESCALATION" },
  { text: "When is my mother coming to pick me up?", expected: "DEMENTIA_DEESCALATION" },
  { text: "There is a strange man in the mirror.", expected: "DEMENTIA_DEESCALATION" },
  { text: "Why are they keeping me locked in here?", expected: "DEMENTIA_DEESCALATION" },

  // MEDICATION_GUIDANCE
  { text: "Did I already take my morning pills?", expected: "MEDICATION_GUIDANCE" },
  { text: "When am I supposed to take Donepezil?", expected: "MEDICATION_GUIDANCE" },
  { text: "Can I take ibuprofen with my blood pressure medicine?", expected: "MEDICATION_GUIDANCE" },
  { text: "I don't want to take those blue pills, they taste bad.", expected: "MEDICATION_GUIDANCE" },
  { text: "My doctor said to take it twice a day, right?", expected: "MEDICATION_GUIDANCE" },

  // EMERGENCY_ESCALATION
  { text: "I fell down and I can't get up.", expected: "EMERGENCY_ESCALATION" },
  { text: "My chest hurts really badly.", expected: "EMERGENCY_ESCALATION" },
  { text: "I can't breathe properly.", expected: "EMERGENCY_ESCALATION" },
  { text: "I smell smoke in the kitchen.", expected: "EMERGENCY_ESCALATION" },
  { text: "My husband collapsed on the floor.", expected: "EMERGENCY_ESCALATION" },
  { text: "The left side of my face feels numb.", expected: "EMERGENCY_ESCALATION" },

  // CAREGIVER_SUPPORT
  { text: "How can my son David help me more?", expected: "CAREGIVER_SUPPORT" },
  { text: "My daughter looks so stressed taking care of me.", expected: "CAREGIVER_SUPPORT" },
  { text: "I feel like a burden to my family.", expected: "CAREGIVER_SUPPORT" },
  { text: "Can you tell my caregiver I need a break?", expected: "CAREGIVER_SUPPORT" },

  // GENERAL_WELLNESS
  { text: "Is yoga safe for me to do?", expected: "GENERAL_WELLNESS" },
  { text: "Why is calcium important?", expected: "GENERAL_WELLNESS" },
  { text: "Hello, how are you doing today?", expected: "GENERAL_WELLNESS" },
  { text: "What's a good brain game to play?", expected: "GENERAL_WELLNESS" },
  { text: "Tell me a joke.", expected: "GENERAL_WELLNESS" },
  { text: "What should I eat for breakfast?", expected: "GENERAL_WELLNESS" },
];

(async () => {
  console.log('⏳ Running Intent Classification Benchmark...\n');
  
  const results = [];
  let correct = 0;
  
  const confusion = {};
  const intents = [
    'DEMENTIA_DEESCALATION', 
    'MEDICATION_GUIDANCE', 
    'EMERGENCY_ESCALATION', 
    'CAREGIVER_SUPPORT', 
    'GENERAL_WELLNESS'
  ];
  
  intents.forEach(actual => {
    confusion[actual] = {};
    intents.forEach(predicted => {
      confusion[actual][predicted] = 0;
    });
  });

  for (let i = 0; i < testCases.length; i++) {
    const item = testCases[i];
    console.log(`[${i+1}/${testCases.length}] Evaluating: "${item.text}"`);
    
    const predicted = await IntentClassifier.classify(item.text);
    const actual = item.expected;
    
    if (predicted === actual) correct++;
    
    if (confusion[actual] && confusion[actual][predicted] !== undefined) {
      confusion[actual][predicted]++;
    } else {
      console.warn(`Unexpected predicted intent: ${predicted}`);
    }
    
    results.push({
      text: item.text,
      actual,
      predicted,
      pass: actual === predicted
    });
    
    // Delay to respect API rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  
  const overallAccuracy = (correct / testCases.length) * 100;
  
  // Calculate per-intent accuracy
  const perIntentAccuracy = {};
  intents.forEach(intent => {
    const totalActual = testCases.filter(tc => tc.expected === intent).length;
    if (totalActual > 0) {
      perIntentAccuracy[intent] = (confusion[intent][intent] / totalActual) * 100;
    } else {
      perIntentAccuracy[intent] = 0;
    }
  });
  
  console.log('\n--- RESULTS ---');
  console.log(`Overall Accuracy: ${overallAccuracy.toFixed(2)}%`);
  
  console.log('\n--- PER-INTENT ACCURACY ---');
  Object.keys(perIntentAccuracy).forEach(k => {
    console.log(`${k}: ${perIntentAccuracy[k].toFixed(2)}%`);
  });
  
  console.log('\n--- CONFUSION MATRIX ---');
  console.log('Row: Actual | Column: Predicted\n');
  const header = ''.padStart(25) + intents.map(i => i.substring(0,4)).join(' | ');
  console.log(header);
  
  intents.forEach(actual => {
    let row = actual.padEnd(25);
    intents.forEach(predicted => {
      row += confusion[actual][predicted].toString().padStart(4) + ' | ';
    });
    console.log(row);
  });
  
  console.log('\n--- FAILURES ---');
  const failures = results.filter(r => !r.pass);
  if (failures.length === 0) {
    console.log('No failures! Perfect classification.');
  } else {
    failures.forEach(f => {
      console.log(`Query:     "${f.text}"`);
      console.log(`Actual:    ${f.actual}`);
      console.log(`Predicted: ${f.predicted}\n`);
    });
  }
  
  // Write markdown report
  let md = `# Intent Classification Evaluation\n\n`;
  md += `## Overall Accuracy: **${overallAccuracy.toFixed(2)}%**\n\n`;
  
  md += `## Per-Intent Accuracy\n`;
  Object.keys(perIntentAccuracy).forEach(k => {
    md += `- **${k}**: ${perIntentAccuracy[k].toFixed(2)}%\n`;
  });
  
  md += `\n## Confusion Matrix\n`;
  md += `| Actual \\ Predicted | ${intents.join(' | ')} |\n`;
  md += `|---|${intents.map(() => '---').join('|')}|\n`;
  
  intents.forEach(actual => {
    let row = `| **${actual}** |`;
    intents.forEach(predicted => {
      row += ` ${confusion[actual][predicted]} |`;
    });
    md += row + '\n';
  });
  
  md += `\n## Failure Examples\n`;
  if (failures.length === 0) {
    md += `No failures detected.\n`;
  } else {
    md += `| Query | Actual | Predicted |\n`;
    md += `|---|---|---|\n`;
    failures.forEach(f => {
      md += `| "${f.text}" | ${f.actual} | ${f.predicted} |\n`;
    });
  }
  
  fs.writeFileSync('INTENT_CLASSIFICATION_EVALUATION.md', md);
  console.log('\nReport written to INTENT_CLASSIFICATION_EVALUATION.md');
})();
