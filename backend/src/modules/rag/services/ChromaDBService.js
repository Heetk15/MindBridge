const path = require('path')
const { ChromaClient } = require('chromadb')
const SimpleVectorStore = require('./SimpleVectorStore')

/**
 * ChromaDB Adapter Service
 * Provides a hybrid wrapper over ChromaDB and SimpleVectorStore.
 * - Semantic Search: Handled by ChromaDB (if enabled/reachable) or SimpleVectorStore fallback.
 * - Keyword Search: Handled by SimpleVectorStore (always available).
 */
class ChromaDBService {
  static _initialized = false
  static _backend = 'simple'
  static _chromaClient = null
  static _chromaCollection = null
  static _simpleStore = null
  static _collectionWrapper = null

  /**
   * Initialize the vector store backend(s)
   */
  static async initialize() {
    if (this._initialized) {
      return
    }

    try {
      const dataDir = path.join(process.cwd(), 'data', 'chroma')
      const storePath = path.join(dataDir, 'vector-store.json')

      // Always initialize SimpleVectorStore as the ultimate fallback & keyword engine
      this._simpleStore = new SimpleVectorStore(storePath)
      await this._simpleStore.initialize()
      this._backend = 'simple'

      // If Chroma is configured, attempt connection
      if (process.env.VECTOR_STORE_BACKEND === 'chroma') {
        try {
          const client = new ChromaClient({ path: process.env.CHROMA_URL || "http://localhost:8000" })
          await client.heartbeat()
          this._chromaClient = client
          this._chromaCollection = await client.getOrCreateCollection({ name: "mindbridge-knowledge" })
          this._backend = 'chroma'
          console.log('✅ Connected to ChromaDB Server at', process.env.CHROMA_URL || "http://localhost:8000")
        } catch (chromaError) {
          console.warn('⚠️ ChromaDB server unreachable. Seamlessly falling back to SimpleVectorStore.', chromaError.message)
        }
      } else {
        console.log('✅ Vector store initialized using SimpleVectorStore (local mode)')
      }

      this._initialized = true
    } catch (error) {
      console.error('❌ Failed to initialize vector stores:', error.message)
      throw error
    }
  }

  /**
   * Get or create a collection wrapper
   */
  static getCollection() {
    if (!this._initialized) {
      throw new Error('Vector store not initialized. Call initialize() first.')
    }

    if (!this._collectionWrapper) {
      this._collectionWrapper = {
        add: async (data) => {
          // Always add to SimpleVectorStore (keeps JSON updated for keyword fallback)
          await this._simpleStore.add(data.ids, data.documents, data.metadatas)
          
          if (this._backend === 'chroma' && this._chromaCollection) {
            // Need embeddings since we compute them locally
            const embeddings = []
            for (const doc of data.documents) {
              embeddings.push(await SimpleVectorStore.getEmbedding(doc))
            }
            await this._chromaCollection.add({
              ids: data.ids,
              embeddings,
              metadatas: data.metadatas,
              documents: data.documents
            })
          }
        },
        
        query: async (queryData) => {
          const query = queryData.query_texts[0]
          const nResults = queryData.n_results || 5
          
          let semanticResults = []
          
          // 1. Semantic Retrieval
          if (this._backend === 'chroma' && this._chromaCollection) {
            try {
              const queryEmbedding = await SimpleVectorStore.getEmbedding(query)
              const response = await this._chromaCollection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: nResults * 2,
              })
              
              if (response.ids && response.ids[0]) {
                for (let i = 0; i < response.ids[0].length; i++) {
                  // Chroma returns distance (e.g. L2 or cosine distance). We convert to similarity.
                  // Assume distance is 1 - cosine similarity, or we use a heuristic.
                  const distance = response.distances[0][i]
                  const similarity = 1 - Math.min(distance, 1.0)
                  
                  semanticResults.push({
                    id: response.ids[0][i],
                    content: response.documents[0][i],
                    metadata: response.metadatas[0][i],
                    similarity,
                    distance
                  })
                }
              }
            } catch (err) {
              console.warn('Chroma query failed, falling back to simple semantic:', err.message)
              this._backend = 'simple' // Temporary fallback for this process life
            }
          }
          
          if (this._backend === 'simple' || semanticResults.length === 0) {
            // SimpleVectorStore native hybridQuery handles semantic + keyword
            return await this._simpleStore.hybridQuery(queryData.query_texts, nResults)
          }

          // 2. Keyword Retrieval Fallback
          // Get keyword results from the SimpleStore
          const keywordResults = await this._simpleStore.keywordSearch(query, nResults * 2)

          // 3. Merge Results (Hybrid Fusion)
          const resultMap = new Map()

          semanticResults.forEach(doc => {
            resultMap.set(doc.id, {
              id: doc.id,
              content: doc.content,
              metadata: doc.metadata,
              semanticSim: doc.similarity,
              keywordScore: 0,
              score: doc.similarity * 0.7, // 70% weight to Semantic (Chroma)
            })
          })

          keywordResults.forEach(doc => {
            if (resultMap.has(doc.id)) {
              const existing = resultMap.get(doc.id)
              existing.keywordScore = doc.keywordScore
              existing.score = (existing.semanticSim * 0.7) + (doc.keywordScore * 0.3)
            } else {
              resultMap.set(doc.id, {
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata,
                semanticSim: 0,
                keywordScore: doc.keywordScore,
                score: doc.keywordScore * 0.3, // 30% weight to Keyword
              })
            }
          })

          const results = Array.from(resultMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, nResults)

          // 4. Return Chroma-style Object
          return {
            ids: [results.map((r) => r.id)],
            documents: [results.map((r) => r.content)],
            distances: [results.map((r) => 1 - r.score)],
            metadatas: [results.map((r) => r.metadata)],
            _rawScores: results.map(r => r.score), // Passed for observability
          }
        },
        
        get: async (ids) => {
          return this._simpleStore.documents.filter((doc) => ids.includes(doc.id))
        },
        
        delete: async (ids) => {
          for (const id of ids) {
            await this._simpleStore.deleteById(id)
          }
          if (this._backend === 'chroma' && this._chromaCollection) {
            await this._chromaCollection.delete({ ids })
          }
        },
      }
    }

    return this._collectionWrapper
  }

  /**
   * Get vector store statistics
   */
  static async getStats() {
    if (!this._initialized) {
      return { status: 'not initialized' }
    }
    const stats = this._simpleStore.getStats()
    stats.backend = this._backend
    
    if (this._backend === 'chroma' && this._chromaCollection) {
      try {
        stats.chroma_documents = await this._chromaCollection.count()
      } catch (err) {
        stats.chroma_documents = 'error'
      }
    }
    
    const docsWithEmbeddings = this._simpleStore.documents.filter(d => d.embedding && d.embedding.length > 0).length
    stats.documents_with_embeddings = docsWithEmbeddings
    stats.has_corrupt_embeddings = docsWithEmbeddings < stats.total_documents * 0.5
    
    return stats
  }

  /**
   * Reset collection
   */
  static async resetCollection() {
    if (!this._initialized) {
      throw new Error('Vector store not initialized')
    }
    await this._simpleStore.clear()
    
    if (this._backend === 'chroma' && this._chromaClient) {
      try {
        await this._chromaClient.deleteCollection({ name: "mindbridge-knowledge" })
        this._chromaCollection = await this._chromaClient.createCollection({ name: "mindbridge-knowledge" })
      } catch(e) {
        console.warn('Failed to delete Chroma collection:', e.message)
      }
    }
    console.log('✅ Collection reset')
  }
}

module.exports = ChromaDBService