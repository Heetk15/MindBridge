const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')

const app = express()

// Security Middleware
app.use(helmet())

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
      process.env.CLIENT_URL
    ]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Logging
app.use(morgan('combined'))

// Compression
app.use(compression())

// Health Check Route
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'MindBridge API Server',
    version: '1.0.0',
    status: 'operational'
  })
})

// API Routes
app.use('/api/v1/alerts', require('./modules/alerts/routes'))
app.use('/api/v1/auth', require('./modules/auth/routes'))
app.use('/api/v1/admin', require('./modules/admin/routes'))
app.use('/api/v1/video', require('./modules/video/routes'))
app.use('/api/chatbot', require('./modules/chatbot/routes'))
app.use('/api/rag', require('./modules/rag/routes'))
// app.use('/api/users', require('./modules/users/routes'))

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path
  })
})

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  })
})

module.exports = app
