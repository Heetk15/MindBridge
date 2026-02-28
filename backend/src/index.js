require('dotenv').config()
const app = require('./app')
const initializeRAGModule = require('./modules/rag/init')
const { connectDB } = require('./config/database')

const PORT = process.env.PORT || 5004

// Initialize and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Initialize RAG module
    await initializeRAGModule()

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 MindBridge Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Database: Connected`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
