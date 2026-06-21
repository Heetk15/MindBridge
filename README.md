<div align="center">
  <h1>🧠 MindBridge</h1>
  <p>An AI-Powered Elderly Companion & Caregiver Support System</p>
  
  ![MindBridge Dashboard](/docs/assets/placeholder-dashboard.png)
</div>

## 📖 Problem Statement
As the global population ages, millions of elderly individuals—particularly those facing early-stage dementia or cognitive decline—suffer from isolation, confusion, and medical non-adherence. Simultaneously, their caregivers experience profound burnout. **MindBridge** is an AI companion built to bridge this gap, offering empathetic conversation, cognitive monitoring, emergency escalation, and authority-backed medical guidance.

## ✨ Key Features
- **Empathetic AI Companion:** Conversational interface tailored for elderly users.
- **Cognitive Safety Monitoring:** Real-time intent routing to detect distress, confusion, or medical emergencies.
- **Caregiver Dashboard:** Remote monitoring, medication tracking, and actionable insights for family members.
- **Authority-Backed Knowledge:** RAG (Retrieval-Augmented Generation) pipeline integrated with verified medical guidelines (Alzheimer's Association, NIA, CDC).
- **Graceful Fallbacks:** Cloud-to-Local database resilience to ensure zero downtime.

## 🏗 Architecture

### 1. The Stack
- **Frontend:** React, Vite, TailwindCSS (Containerized via SPA Serve)
- **Backend:** Node.js, Express (Dockerized)
- **Database:** MongoDB (Atlas Cloud + Local Docker Fallback)
- **Vector Store:** ChromaDB (Semantic Search) + Local JSON Store (Keyword Search)

![Architecture Diagram](/docs/assets/placeholder-architecture.png)

### 2. AI Architecture & Intent Routing
MindBridge does not rely on a single prompt. Instead, it utilizes an **LLM Router** (powered by Gemini/Groq) to classify user queries into distinct cognitive intents before processing. 

- `DEMENTIA_DEESCALATION`
- `MEDICATION_GUIDANCE`
- `EMERGENCY_ESCALATION`
- `CAREGIVER_SUPPORT`
- `GENERAL_WELLNESS`

This ensures that a user asking "Where am I?" receives a specialized de-escalation response rather than a generic chatbot reply.

### 3. Retrieval Architecture (RAG)
The system employs a **Hybrid RAG Pipeline**:
1. **Semantic Search (ChromaDB):** Retrieves concept-matching documents using `all-MiniLM-L6-v2` embeddings.
2. **Keyword Boost (SimpleVectorStore):** Fuses exact-match terminology against the semantic candidates.
3. **Context Assembler:** Synthesizes the exact medical guidelines and feeds them into the LLM context window.

## 📊 Results & Metrics

We rigorously benchmarked the AI pipelines to ensure medical safety and reliability:

- **Intent Routing Accuracy:** `100.00%` across 5 distinct cognitive categories.
- **Top-3 Retrieval Accuracy:** `92.9%` (Mean Reciprocal Rank: `0.894`).
- **Knowledge Corpus Size:** `78` highly-curated chunks explicitly sourced from external medical authorities.

## 🚀 Deployment Instructions

MindBridge is fully containerized for a zero-configuration launch.

### Prerequisites
- Docker & Docker Compose
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/MindBridge.git
cd MindBridge

# 2. Configure Environment Variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY or GROQ_API_KEY

# 3. Spin up the infrastructure
docker compose up -d
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5004](http://localhost:5004)

> **Note on MongoDB:** If `MONGODB_URI` is left blank in your `.env`, the backend will automatically connect to the local Mongo container spun up by Docker Compose.

---
*Built with ❤️ for those who cared for us.*
