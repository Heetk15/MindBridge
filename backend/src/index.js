require('dotenv').config()
const app = require('./app')
const initializeRAGModule = require('./modules/rag/init')
const { connectDB } = require('./config/database')

const PORT = process.env.PORT || 5004
let server = null

// Initialize and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Initialize RAG module
    await initializeRAGModule()

    // Start server
    server = app.listen(PORT, () => {
      console.log(`🚀 MindBridge Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Database: Connected`)
    })

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n⏹️  Shutting down gracefully...')
      if (server) {
        server.close(() => {
          console.log('✅ Server closed')
          process.exit(0)
        })
      } else {
        process.exit(0)
      }
    }

    // Handle signals
    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)

    // Handle unhandled errors
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      gracefulShutdown()
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown()
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
