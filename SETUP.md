# MindBridge Setup & Deployment Guide

This guide provides instructions to spin up the entire MindBridge application (Frontend, Backend, MongoDB, ChromaDB) with a single command. 

## Prerequisites
- **Docker** and **Docker Compose** installed on your system.
- Git (if cloning).

## Quick Start (Docker)

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd AfterMath_Apex-008_Humanity
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *Note: Open `.env` and fill in your `GEMINI_API_KEY` or `GROQ_API_KEY` for the AI to function properly.*

3. **Start the System:**
   ```bash
   docker compose up -d
   ```

4. **Access the Application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5004

## Architecture Overview
The `docker-compose.yml` spins up four integrated services:
- **`frontend`**: React/Vite application running on port 3000.
- **`backend`**: Node.js/Express API server running on port 5004.
- **`mongo`**: Local MongoDB 6.0 instance storing conversations and profiles on port 27017 (only used if `MONGODB_URI` is omitted from `.env`).
- **`chroma`**: ChromaDB instance running on port 8000 for managing semantic embeddings and RAG functionality.

## Troubleshooting

- **Database Issues:** If you provided an external MongoDB Atlas string in `.env` (`MONGODB_URI`), the backend will seamlessly use that instead of the local Docker Mongo.
- **Stopping the Services:**
  ```bash
  docker compose down
  ```
- **Rebuilding Containers:** If you make changes to the source code, rebuild the images with:
  ```bash
  docker compose up --build -d
  ```
