# MindBridge

An AI-powered elderly care and caregiver support platform designed to improve safety, communication, and health management for senior citizens.

Built using React, Node.js, MongoDB, Groq, Gemini, Twilio, and Retrieval-Augmented Generation (RAG).

## The Problem

Many elderly individuals face challenges such as:

* Cognitive decline and memory-related confusion
* Medication non-adherence
* Delayed emergency response
* Social isolation
* Increased caregiver burden

Traditional communication tools do not provide contextual support, emergency awareness, or healthcare-focused guidance.

MindBridge was developed during a hackathon to address these challenges through an AI-assisted care ecosystem.

## Key Features

* AI-powered conversational companion
* Retrieval-Augmented Generation (RAG) chatbot
* Dementia-aware conversational support
* Emergency risk detection and escalation
* Caregiver monitoring dashboard
* Medication reminders and adherence tracking
* Real-time location tracking and geofencing
* Video calling and communication tools
* SOS alerts through Twilio and Telegram integrations
* Cognitive wellness activities and engagement features

## Architecture Highlights

### Intelligent Intent Routing

User conversations are classified into specialized categories before response generation:

* Dementia De-escalation
* Medication Guidance
* Emergency Escalation
* Caregiver Support
* General Wellness

This enables safer and more context-aware responses.

### Retrieval-Augmented Generation (RAG)

The chatbot combines:

* Semantic vector search
* Knowledge-base retrieval
* Context assembly
* LLM response generation

to reduce hallucinations and provide evidence-backed guidance.

### Emergency Detection Pipeline

High-risk conversations are analyzed and scored in real time.

Potential emergencies trigger:

* Confirmation workflows
* Caregiver notifications
* Telegram alerts
* Twilio emergency escalation

### Real-Time Communication

Socket.io powers:

* Live notifications
* Presence updates
* Video call signaling
* Emergency event propagation

## Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Shadcn/UI

### Backend

* Node.js
* Express.js
* Socket.io
* JWT Authentication

### AI & Intelligence

* Groq
* Gemini
* Retrieval-Augmented Generation (RAG)
* all-MiniLM-L6-v2 Embeddings
* Vector Similarity Search

### Data & Infrastructure

* MongoDB Atlas
* Twilio
* Telegram Bot API
* Render
* Vercel
* Docker

## Concepts Demonstrated

* Retrieval-Augmented Generation (RAG)
* Vector Embeddings
* Semantic Search
* Cosine Similarity
* Intent Classification
* Real-Time Systems
* JWT Authentication
* Emergency Escalation Workflows
* Event-Driven Architecture
* WebSocket Communication
* API Integration
* Cloud Deployment
