const path = require('path')
const RAGService = require('../services/RAGService')
const DocumentIngestionService = require('../services/DocumentIngestionService')
const chromaDB = require('../services/ChromaDBService')
const pdfParse = require('pdf-parse')

/**
 * RAG Controller
 * Handles RAG-related endpoints
 */

class RAGController {
  /**
   * Search knowledge base
   * POST /api/rag/search
   */
  static async search(req, res) {
    try {
      const { query, topK = 5 } = req.body

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required' })
      }

      const results = await RAGService.search(query, topK)

      res.json({
        success: true,
        query,
        results,
        count: results.length,
      })
    } catch (error) {
      console.error('Search error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Get context for chatbot
   * POST /api/rag/context
   */
  static async getContext(req, res) {
    try {
      const { query, topK = 5 } = req.body

      if (!query || query.trim().length === 0) {
        return res.json({ context: null })
      }

      const context = await RAGService.buildContext(query, topK)

      res.json({
        success: true,
        context,
      })
    } catch (error) {
      console.error('Context error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Search by category
   * GET /api/rag/category/:category
   */
  static async searchByCategory(req, res) {
    try {
      const { category } = req.params
      const { topK = 10 } = req.query

      const results = await RAGService.searchByCategory(category, parseInt(topK))

      res.json({
        success: true,
        category,
        results,
        count: results.length,
      })
    } catch (error) {
      console.error('Category search error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Search by tags
   * POST /api/rag/tags
   */
  static async searchByTags(req, res) {
    try {
      const { tags = [], topK = 10 } = req.body

      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Tags array is required' })
      }

      const results = await RAGService.searchByTags(tags, topK)

      res.json({
        success: true,
        tags,
        results,
        count: results.length,
      })
    } catch (error) {
      console.error('Tag search error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Get knowledge base statistics
   * GET /api/rag/stats
   */
  static async getStats(req, res) {
    try {
      const stats = await RAGService.getStats()

      res.json({
        success: true,
        stats,
      })
    } catch (error) {
      console.error('Stats error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Diagnostic endpoint for Render production RAG failure root cause
   */
  static async getDiagnostic(req, res) {
    try {
      const fs = require('fs')
      
      const diagnostic = {
        cwd: process.cwd(),
        node_env: process.env.NODE_ENV,
        rag_enabled: process.env.RAG_ENABLED,
        vector_backend: process.env.VECTOR_STORE_BACKEND,
        chroma_url: process.env.CHROMA_URL,
        files: {
          data_dir: null,
          data_chroma: null,
          knowledge_base: null,
          caregiver_support: null
        },
        vector_store_exists: false
      }

      const dataDir = path.join(process.cwd(), 'data')
      const chromaDir = path.join(dataDir, 'chroma')
      const kbDir = path.join(dataDir, 'knowledge-base')
      const caregiverDir = path.join(kbDir, 'caregiver_support')
      const vectorStoreJson = path.join(chromaDir, 'vector-store.json')

      try { diagnostic.files.data_dir = fs.readdirSync(dataDir) } catch (e) { diagnostic.files.data_dir = e.message }
      try { diagnostic.files.data_chroma = fs.readdirSync(chromaDir) } catch (e) { diagnostic.files.data_chroma = e.message }
      try { diagnostic.files.knowledge_base = fs.readdirSync(kbDir) } catch (e) { diagnostic.files.knowledge_base = e.message }
      try { diagnostic.files.caregiver_support = fs.readdirSync(caregiverDir) } catch (e) { diagnostic.files.caregiver_support = e.message }
      try { diagnostic.vector_store_exists = fs.existsSync(vectorStoreJson) } catch(e) {}

      diagnostic.logs = {
        ingestion_errors: global.RAG_DIAGNOSTIC_LOGS || [],
        embedding_logs: global.RAG_EMBEDDING_LOGS || []
      }

      res.json(diagnostic)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Initialize with sample data
   * POST /api/rag/init-samples
   */
  static async initializeSamples(req, res) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          error: 'Sample initialization only allowed in development',
        })
      }

      const result = await DocumentIngestionService.initializeSampleData()

      res.json({
        success: true,
        message: 'Sample data initialized',
        ...result,
      })
    } catch (error) {
      console.error('Init samples error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Add document
   * POST /api/rag/documents
   */
  static async addDocument(req, res) {
    try {
      const { content, metadata } = req.body

      if (!content || !metadata) {
        return res.status(400).json({
          error: 'Content and metadata are required',
        })
      }

      const result = await DocumentIngestionService.addDocument(content, metadata)

      res.json({
        success: true,
        message: 'Document added successfully',
        ...result,
      })
    } catch (error) {
      console.error('Add document error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Upload PDF or text file to knowledge base
   * POST /api/rag/upload
   */
  static async uploadDocument(req, res) {
    try {
      // Handle text upload
      if (req.body.content) {
        const { content, title, category = 'user-uploads' } = req.body

        if (!content || content.trim().length < 10) {
          return res.status(400).json({ error: 'Content is too short' })
        }

        const source = `user-${Date.now()}-${(title || 'document').replace(/\s+/g, '-').toLowerCase()}.txt`

        const result = await DocumentIngestionService.addDocument(content, {
          source,
          category,
          title: title || 'User Upload',
          date_added: new Date().toISOString(),
          tags: ['user-upload', category],
        })

        return res.json({
          success: true,
          message: 'Text added to knowledge base',
          source,
          chunksAdded: result.chunksAdded,
        })
      }

      // Handle PDF upload
      if (req.file) {
        let content = ''
        let numPages = 1
        try {
          const parsed = await pdfParse(req.file.buffer)
          content  = parsed.text || ''
          numPages = parsed.numpages || 1
        } catch (parseErr) {
          console.error('PDF parse error:', parseErr.message)
          return res.status(422).json({ error: 'Could not extract text from PDF' })
        }

        if (!content || content.trim().length < 10) {
          return res.status(400).json({ error: 'PDF has no readable text' })
        }

        const originalName = req.file.originalname.replace(/\.pdf$/i, '')
        const source = `pdf-${Date.now()}-${originalName.replace(/\s+/g, '-').toLowerCase()}.txt`
        const category = req.body.category || 'user-uploads'

        const result = await DocumentIngestionService.addDocument(content, {
          source,
          category,
          title: originalName,
          date_added: new Date().toISOString(),
          tags: ['pdf-upload', category],
        })

        return res.json({
          success: true,
          message: `PDF "${originalName}" added to knowledge base`,
          source,
          pages: numPages,
          chunksAdded: result.chunksAdded,
        })
      }

      return res.status(400).json({ error: 'No content or file provided' })
    } catch (error) {
      console.error('Upload document error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Delete document
   * DELETE /api/rag/documents/:source
   */
  static async deleteDocument(req, res) {
    try {
      const { source } = req.params

      if (!source) {
        return res.status(400).json({ error: 'Source is required' })
      }

      const result = await RAGService.deleteDocument(source)

      res.json({
        success: true,
        message: 'Document deleted successfully',
        ...result,
      })
    } catch (error) {
      console.error('Delete document error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Reset knowledge base (dev only)
   * POST /api/rag/reset
   */
  static async reset(req, res) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          error: 'Reset only allowed in development',
        })
      }

      await chromaDB.resetCollection()

      res.json({
        success: true,
        message: 'Knowledge base reset successfully',
      })
    } catch (error) {
      console.error('Reset error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = RAGController