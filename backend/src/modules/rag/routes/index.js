const express = require('express')
const RAGController = require('../controllers/RAGController')

const router = express.Router()

/**
 * RAG Routes
 * Knowledge base and retrieval endpoints
 */

/**
 * POST /api/rag/search
 * Search knowledge base with query
 */
router.post('/search', RAGController.search)

/**
 * POST /api/rag/context
 * Get context for chatbot using RAG
 */
router.post('/context', RAGController.getContext)

/**
 * GET /api/rag/category/:category
 * Search documents by category
 */
router.get('/category/:category', RAGController.searchByCategory)

/**
 * POST /api/rag/tags
 * Search documents by tags
 */
router.post('/tags', RAGController.searchByTags)

/**
 * GET /api/rag/stats
 * Get knowledge base statistics
 */
router.get('/stats', RAGController.getStats)

/**
 * POST /api/rag/documents
 * Add new document to knowledge base
 */
router.post('/documents', RAGController.addDocument)

/**
 * DELETE /api/rag/documents/:source
 * Delete document by source
 */
router.delete('/documents/:source', RAGController.deleteDocument)

/**
 * POST /api/rag/init-samples
 * Initialize with sample data (dev only)
 */
router.post('/init-samples', RAGController.initializeSamples)

/**
 * POST /api/rag/reset
 * Reset knowledge base (dev only)
 */
router.post('/reset', RAGController.reset)

module.exports = router