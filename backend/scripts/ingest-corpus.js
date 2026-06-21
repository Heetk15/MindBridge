require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const DocumentIngestionService = require('../src/modules/rag/services/DocumentIngestionService');
const ChromaDBService = require('../src/modules/rag/services/ChromaDBService');

async function main() {
  console.log('Initializing Vector Store...');
  await ChromaDBService.initialize();
  
  console.log('Resetting previous collection...');
  await ChromaDBService.resetCollection();

  const baseDir = path.join(__dirname, '..', 'data', 'knowledge-base');
  const domains = await fs.readdir(baseDir);

  for (const domain of domains) {
    const domainDir = path.join(baseDir, domain);
    const stat = await fs.stat(domainDir);
    if (stat.isDirectory()) {
      console.log('Loading directory: ' + domain);
      await DocumentIngestionService.loadFromDirectory(domainDir);
    }
  }

  console.log('\\n=== INGESTION COMPLETE ===');
  console.log(ChromaDBService.getStats());
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
