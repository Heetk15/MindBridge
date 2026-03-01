const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const initializeRAGModule = require('./modules/rag/init')
const { connectDB } = require('./config/database')
const { initializeSocket } = require('./socket/callSignaling')
const TaskScheduler = require('./services/TaskScheduler')

const PORT = process.env.PORT || 5004
let server = null

// Initialize and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Initialize RAG module
    await initializeRAGModule()

    // Create HTTP server from Express app
    server = http.createServer(app)

    // Initialize Socket.io with CORS for LAN + production access
    const io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (mobile apps, curl)
          if (!origin) return callback(null, true)
          // Allow local network origins for LAN video calls
          if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/)) {
            return callback(null, true)
          }
          // Allow CORS_ORIGIN list (production frontend URL)
          const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
          if (allowed.includes(origin)) return callback(null, true)
          // In development, allow all
          if (process.env.NODE_ENV !== 'production') return callback(null, true)
          callback(new Error('Not allowed by CORS'))
        },
        credentials: true,
      },
    })

    // Initialize real-time call signaling
    initializeSocket(io)

    // Make io accessible from routes if needed
    app.set('io', io)

    // Start task overdue scheduler
    TaskScheduler.start()

    // Start server on all interfaces (0.0.0.0) for LAN access
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MindBridge Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Database: Connected`)
      console.log(`🔌 Socket.io: Ready for video call signaling`)
      console.log(`🌐 LAN Access: http://<your-ip>:${PORT}`)
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
