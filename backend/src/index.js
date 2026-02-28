require('dotenv').config()
const app = require('./app')
const initializeRAGModule = require('./modules/rag/init')

const PORT = process.env.PORT || 5004

// Initialize RAG module on startup
initializeRAGModule().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MindBridge Server running on port ${PORT}`)
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}).catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
