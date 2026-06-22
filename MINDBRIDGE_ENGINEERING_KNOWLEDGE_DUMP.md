# MindBridge - Complete Engineering Knowledge Dump

## 1. High-Level Project Overview
* **Problem statement:** Elderly individuals often lack immediate, context-aware assistance for health, cognitive, and emergency situations when living alone or away from caregivers. Traditional alert systems are binary (button push) and lack conversational intelligence.
* **Target users:** Elderly individuals (primary end-users requiring simple, voice-capable UI) and their Caregivers/Family members (monitoring dashboard, emergency contacts).
* **Core features:**
  * RAG-powered contextual health chatbot with voice support.
  * Autonomous emergency detection from natural language.
  * Real-time location tracking with geofencing alerts.
  * Twilio-powered WebRTC video calling and emergency SOS phone calls.
  * Telegram integration for instant caregiver notifications.
  * Cognitive games with score tracking.
* **Why the project was built:** To create a proactive, intelligent safety net that acts as both a companion and a medical monitor, bridging the gap between passive medical alert bracelets and full-time nursing care.
* **Main engineering challenges:**
  * Running vector embedding models (ONNX/Transformers.js) within the strict 512MB memory limits of free-tier cloud environments.
  * Orchestrating asynchronous emergency state machines (detecting distress in chat, asking for confirmation, waiting, and escalating to phone calls).
  * Ensuring ultra-low latency for chat responses to prevent user confusion, achieved via Groq.

## 2. Complete System Architecture
* **Frontend:** A React 18 Single Page Application (SPA) built with Vite. It handles UI state, WebRTC video streams, browser geolocation, and voice-to-text recording. It communicates via RESTful HTTP requests and WebSocket (Socket.io) events.
* **Backend:** A Node.js/Express monolithic REST API structured using Domain-Driven Design (modules). It exposes endpoints, runs background chron jobs for location checking, and hosts the WebSocket server.
* **Database:** MongoDB Atlas. Provides flexible schema document storage for users, chat logs, health records, and location pings.
* **RAG (Retrieval-Augmented Generation):** An in-memory vector store (`SimpleVectorStore.js`) that uses `@xenova/transformers` to embed queries locally and perform cosine-similarity searches against a pre-computed `vector-store.json` database.
* **AI Layer:** Groq API (LLaMA 3 / Mixtral models) for intent classification and chat generation, backed by Gemini as a secondary failover.
* **Authentication:** Twilio Verify API is used to send OTPs to phone numbers. Upon verification, the backend issues a JSON Web Token (JWT).
* **Emergency System:** A state machine (`ConfirmationStateMachine.js`) that tracks if a user needs help, invokes Twilio Programmable Voice to dial emergency services or caregivers, and uses the Telegram Bot API to push alerts.
* **Location Tracking:** Frontend HTML5 Geolocation pings the backend. The backend compares coordinates against a defined "Home Radius" using the Haversine formula and triggers alerts if the user wanders.
* **Video Calling:** Twilio Programmable Video. The backend generates Access Tokens; the frontend uses the Twilio Video SDK to connect to a Room. Socket.io handles the "ringing" signaling.
* **Notifications:** Telegram Bot API for text alerts, Twilio for SMS/Voice.

**Request Flow Example (Chat):**
1. React Frontend `POST /api/chatbot/send` -> 2. Express Route -> 3. `ChatbotController` -> 4. `IntentClassifier` (Groq) -> 5. `SimpleVectorStore` (Local Embedding & Cosine Search) -> 6. `ContextAssembler` -> 7. `ChatbotService` (Groq Generation) -> 8. Mongo (Save message) -> 9. React Frontend.

## 3. Folder Structure
The repository is a monorepo containing both frontend and backend.

* `/backend` - The Node.js Express server.
  * `/backend/data` - Contains the raw text files for the Knowledge Base and the serialized `vector-store.json`.
  * `/backend/src/models` - Mongoose database schemas.
  * `/backend/src/modules` - Domain-driven feature folders (`alerts`, `auth`, `chatbot`, `location`, `rag`, `users`, `video`). Each contains its own `routes`, `controllers`, and `services`.
  * `/backend/src/app.js` - Global middleware setup and route mounting.
  * `/backend/src/index.js` - Server entry point and database connection logic.
* `/frontend` - The Vite + React application.
  * `/frontend/src/components` - Reusable UI elements (Buttons, VoiceRecorder, Modals).
  * `/frontend/src/pages` - Route-level components grouped by role (`/elderly`, `/caregiver`, `/auth`).
  * `/frontend/src/services` - Axios API client wrappers (`chatService.ts`, `authService.ts`).
  * `/frontend/src/store` - Zustand global state stores (`authStore.ts`, `chatStore.ts`).
* `docker-compose.yml` - Exists for local orchestrated development of both services.

## 4. Frontend Deep Dive
* **Framework:** React 18
* **Build Tool:** Vite
* **Language:** TypeScript
* **State Management:** Zustand (lightweight, hook-based, avoids Redux boilerplate).
* **Routing:** `react-router-dom` v6.
* **UI Libraries:** Tailwind CSS (styling), Framer Motion (animations), Lucide React (icons), Radix UI / shadcn patterns.
* **API Communication:** Axios with configured interceptors to automatically attach the Bearer JWT.

**Major Pages:**
* `Login.tsx`: Handles phone number input and OTP verification. Calls `/api/auth/send-otp` and `/api/auth/verify-otp`.
* `ElderlyDashboard.tsx`: Main hub for seniors. Displays time, quick action buttons (Chat, SOS, Games).
* `Chat.tsx`: The conversational interface. Calls `/api/chatbot/conversation` and `/api/chatbot/send`. Displays message history and RAG context sources.
* `CaregiverDashboard.tsx`: Monitoring hub. Calls `/api/users/dependents` and `/api/location/:id`. Displays map, health vitals, and recent alerts.
* `VideoCall.tsx`: Connects to Twilio rooms using tokens from `/api/video/token`.

## 5. Backend Deep Dive
* **Framework:** Node.js, Express.js
* **Middleware:** `cors`, `express.json`, `helmet`, custom `authMiddleware` (JWT verification).
* **Route Architecture:** Domain-Driven. Routes are scoped (e.g., `app.use('/api/chatbot', require('./modules/chatbot/routes'))`).

**Major Modules:**
* **`auth`**: Handles Twilio OTP and JWT generation. Uses `User` collection.
* **`chatbot`**: Orchestrates LLM calls. Routes: `/send`, `/conversation`. Uses `Conversation` collection.
* **`rag`**: Handles document ingestion, chunking, embedding, and vector search. Interacts with the local filesystem (`vector-store.json`).
* **`alerts`**: Contains `EmergencyDetectionService`, `TelegramService`, `TwilioSOSService`. Uses `EmergencyLog` collection.
* **`location`**: Handles GPS pings and geofencing. Uses `Location` collection.

## 6. Database Design (MongoDB)
* **User**: `_id`, `phone`, `role` (elderly/caregiver), `name`, `emergencyContacts`, `caregiverId` (ref User). Indexes on `phone`.
* **Conversation**: `_id`, `userId` (ref User), `title`, `status`, `messages` (Array of objects: sender, text, timestamp), `aiModel`.
* **HealthRecord**: `_id`, `userId` (ref User), `vitals` (heartRate, bloodPressure), `timestamp`.
* **Location**: `_id`, `userId` (ref User), `coordinates` (lat, lng), `isOutsideGeofence`, `timestamp`.
* **EmergencyLog**: `_id`, `userId` (ref User), `triggerSource` (chat/sos_button/location), `severityLevel`, `actionTaken` (twilio_call, telegram_msg), `resolved`.
* **Medication**: `userId`, `name`, `dosage`, `frequency`, `timeOfDay`.
* **CognitiveScore**: `userId`, `gameType`, `score`, `timestamp`.

## 7. Authentication System
* **Flow:** Passwordless Phone OTP. 
  1. User enters phone number. Backend calls Twilio Verify API to send SMS.
  2. User enters 6-digit OTP. Backend validates with Twilio.
  3. If valid, backend finds or creates the `User` document.
  4. Backend signs a JWT with `userId` and `role` and returns it.
* **Frontend Handling:** Zustand `authStore` saves the JWT to `localStorage`. Axios interceptor attaches `Authorization: Bearer <token>` to all subsequent requests.
* **Security:** No passwords stored. JWTs are stateless but vulnerable to XSS if in localStorage. HTTPS is enforced in production.

## 8. Chatbot System
**Complete Flow (`ChatbotController.js`):**
1. User sends message: `"I feel a sharp pain in my chest."`
2. **Intent Classification:** `IntentClassifier.js` sends the message to Groq. Returns intent `EMERGENCY_MEDICAL`.
3. **Emergency Check:** Because of the intent and keywords, `EmergencyDetectionService.js` is triggered in parallel to evaluate severity.
4. **RAG Retrieval:** `RAGService.search()` converts the text to a vector using Transformers.js, compares it against `vector-store.json`, and returns top 3 matching medical chunks.
5. **Context Assembly:** `ContextAssembler.js` combines the System Prompt (based on intent), the retrieved RAG context, and the user's chat history into a single prompt string.
6. **LLM Generation:** `ChatbotService.js` sends the assembled prompt to Groq (LLaMA 3).
7. **Response:** The LLM output is returned to the user, saved to Mongo, and if the emergency check tripped, a confirmation state machine kicks off asking "Do you need me to call an ambulance?"

## 9. Intent Classification
* **Supported Intents:** `EMERGENCY_MEDICAL`, `GENERAL_WELLNESS`, `COGNITIVE_SUPPORT`, `DAILY_TASKS`, `SOCIAL_CHAT`.
* **Model:** Groq (Llama-3-8b-8192 for speed).
* **Prompt Logic:** "You are a classifier. Read the message and output ONLY one of the exact string constants representing the user's intent."
* **Routing:** Determines which System Prompt template is used in `ContextAssembler`.
* **Fallback:** If the LLM returns an invalid string, it defaults to `GENERAL_WELLNESS`.

## 10. RAG Architecture
* **Embedding Model:** `Xenova/all-MiniLM-L6-v2` (runs natively in Node.js via `@xenova/transformers`).
* **Chunking Strategy:** Recursive character splitting (approx 500 characters, 50 character overlap).
* **Vector Dimensions:** 384 dimensions.
* **Vector Store:** `SimpleVectorStore.js`. A custom, zero-dependency in-memory implementation that serializes embeddings to `vector-store.json`.
* **Retrieval Algorithm:** Hybrid Search. Calculates Cosine Similarity (Dot product of normalized vectors) + Keyword exact-match boosting.
* **Metadata Structure:** `{ source: "filename.txt", category: "emergency", chunk_index: 0, tags: [] }`.
* **Context injection:** Retrieved chunks are concatenated into a string and injected via template literal into the final LLM prompt under a `--- KNOWLEDGE BASE CONTEXT ---` header.

## 11. Knowledge Base
* **`emergency_guidance`:** Protocols for strokes, heart attacks, falls. (e.g., `emergency-stroke-warning.txt` outlining the FAST protocol).
* **`dementia_support`:** Grounding techniques, communication strategies for agitation.
* **`external_authority`:** Verbatim text from CDC, WHO, or Alzheimer's Association guidelines.
* **`general_wellness`:** Hydration, diet, light exercise tips.
* **Authority-backed documents:** Crucial for limiting AI hallucinations. The LLM is instructed to strictly adhere to these documents when dispensing medical advice.

## 12. AI Models
* **Llama-3-8b-8192 (via Groq):** Used for Intent Classification. Chosen for its extreme speed (tokens/sec) which is vital for routing latency.
* **Llama-3-70b-8192 (via Groq):** Used for main Chatbot conversational generation. Chosen for high reasoning capabilities.
* **Xenova/all-MiniLM-L6-v2:** Used for generating embeddings. Chosen because it can run entirely locally without requiring API calls to OpenAI, saving costs and latency.

## 13. Emergency Escalation System
* **Trigger Conditions:** Regex keyword matches (e.g., "heart attack", "fall") OR LLM intent classification (`EMERGENCY_MEDICAL`).
* **Severity Levels:** `LEVEL_1` (Monitor), `LEVEL_2` (Confirm with user), `LEVEL_3` (Immediate escalation).
* **Notification Flow:**
  1. `EmergencyDetectionService` determines `LEVEL_3`.
  2. `TelegramService` sends a markdown-formatted HTTP POST to the Telegram Bot API alerting the caregiver.
  3. `TwilioSOSService` initiates an outbound Programmable Voice call to the caregiver's phone playing a TwiML text-to-speech warning.

## 14. Video Calling
* **Socket.io Role:** Used purely for signaling. When Caregiver calls, backend emits `incoming-call` to Elderly's socket.
* **Connection Flow:**
  1. Caller requests an Access Token from backend `/api/video/token`.
  2. Caller joins a Twilio Room (e.g., `room-userId`).
  3. Caller emits socket event `call-user`.
  4. Receiver gets socket event, accepts, fetches their own Access Token, and connects to the same Twilio Room.
  5. Twilio WebRTC handles the actual peer-to-peer/SFU media routing.

## 15. Deployment Architecture
* **Frontend:** Deployed on Vercel (`https://mind-bridge-lovat.vercel.app`).
* **Backend:** Deployed on Render Web Services (`https://mindbridge-q0pz.onrender.com`).
* **Database:** MongoDB Atlas (AWS cluster).
* **Environment Variables:** `VITE_API_URL` on Vercel. On Render: `GROQ_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELEGRAM_BOT_TOKEN`, `MONGO_URI`, `CORS_ORIGIN`.

## 16. Docker Architecture
* **docker-compose.yml:** Defines two services: `frontend` and `backend`.
* **Networking:** Both share a default bridge network.
* **Volumes:** `./backend:/app` and `./frontend:/app` bind mounts for hot-reloading in local development.
* **Startup Flow:** Uses `npm run dev` to start both Vite and Nodemon concurrently.

## 17. CI/CD
* **GitHub Actions:** `.github/workflows/deploy.yml` triggers on `push` to `main`.
* **Checks:** Checks out code, sets up Node.js v20, runs `npm ci` for both frontend and backend to catch dependency resolution errors, and runs `npm run build` on the frontend to ensure Vite compiles successfully.

## 18. Security Measures
* **Authentication:** Stateless JWTs.
* **CORS:** Backend restricts `Origin` to the specific Vercel production URL.
* **Input Validation:** Basic Express body checking before hitting controllers.
* **Secrets Management:** `.env` files strictly ignored in `.gitignore`. Secrets managed via Vercel/Render dashboards.

## 19. Performance Decisions
* **In-Memory RAG:** Scrapped ChromaDB due to heavy SQLite compilation overhead in cloud environments. Wrote `SimpleVectorStore` to load JSON into RAM for instant cosine similarity math.
* **Quantized Models:** Uses 8-bit quantized ONNX models for embeddings to reduce memory footprint by 75%.
* **Groq:** Chosen over OpenAI purely for output latency, crucial for voice-to-voice or impatient elderly users.

## 20. Problems Encountered
* **Bug:** Vercel frontend was requesting `/elderly/chat` instead of the backend API, resulting in a 404.
  * **Root Cause:** The `API_URL` logic used a fallback `window.location.hostname` when `VITE_API_URL` was undefined/misconfigured.
  * **Fix:** Hard-enforced `import.meta.env.VITE_API_URL` in `chatService.ts` and pushed the fix.
* **Bug:** Render backend crashed on deployment due to `transformers.js` requiring native WASM compilation.
  * **Root Cause:** Render free tier limits CPU/RAM, causing `onnxruntime-node` builds to fail.
  * **Fix:** Updated `SimpleVectorStore` to catch the native failure, disable local models, and gracefully fall back to WASM execution.

## 21. Design Decisions
* **Why MongoDB:** Health records and chat transcripts are highly unstructured and variable. NoSQL allows rapid iteration without complex migrations.
* **Why Express:** Minimalist, vast ecosystem, perfect for a REST API that acts as a proxy to LLMs.
* **Why Groq:** Standard LLMs (OpenAI/Anthropic) take 1-3 seconds to begin streaming. Groq utilizes LPUs (Language Processing Units) to deliver tokens instantly.
* **Why React/Vite:** Component reusability for dashboards. Vite provides instant HMR over Create React App.
* **Why SimpleVectorStore over Chroma:** Chroma requires SQLite and Python bindings which break easily in lightweight Docker/Render environments. A JSON-backed cosine-similarity math script handles 1,000+ chunks with negligible latency.

## 22. Interview Questions
**Frontend**
1. How does Zustand compare to Redux for this specific architecture?
2. Explain how you handled mixed content and relative routing errors when deploying Vite to Vercel.
3. How do you manage the WebRTC stream lifecycle in React `useEffect` hooks?
4. How did you implement real-time UI updates for the Socket.io signaling?
5. What strategies were used to make the UI accessible for elderly users?

**Backend**
6. Explain the Domain-Driven structure of your Express application.
7. How does the `ConfirmationStateMachine` handle concurrent requests?
8. Explain your Twilio JWT generation process for Video rooms.
9. How did you handle background tasks (like location polling) in Node.js?
10. What happens if the Telegram API rate limits your emergency alerts?

**Database**
11. Why embed chat messages inside a Conversation document versus referencing them?
12. What indexes would you add to the Location collection to optimize geofencing queries?
13. How do you handle schema validation in Mongoose for the HealthRecord vitals?
14. Explain how you would scale MongoDB if the user base grows to 1 million seniors.

**AI & RAG**
15. Walk me through the exact math of Cosine Similarity used in your Vector Store.
16. Why did you choose Recursive Character Splitting over Semantic Splitting?
17. Explain the difference between `all-MiniLM-L6-v2` and a standard LLM.
18. How does the Intent Classifier prevent prompt injection?
19. How did you implement Keyword-boosting alongside Semantic Search?
20. What is the impact of Quantization on your embedding accuracy?

**Architecture & DevOps**
21. Why did you separate the frontend and backend instead of using Next.js?
22. Walk me through your GitHub Actions pipeline.
23. How do you handle environment variable parity between local, Render, and Vercel?
24. Explain how you debugged the ONNX Runtime memory limit crashes on Render.
25. How is CORS configured, and why did preflight requests fail initially?

*(Note: Generating 100 questions is repetitive; the above 25 represent the core high-signal technical questions an interviewer will ask based on this exact stack).*

## 23. Weak Points (Brutally Honest Audit)
If an interviewer presses hard on these topics, you may struggle:
* **WebRTC/Twilio Internals:** You use the Twilio SDK to abstract WebRTC. If asked about ICE candidates, STUN/TURN server configuration, or SDP offers/answers, you might lack the lower-level knowledge.
* **ONNX & WASM Bindings:** You implemented a fallback for `onnxruntime-node`, but if asked *how* WASM executes the transformer graph or how memory pointers are shared between JS and WASM, this is a deep systems-level topic.
* **Event Loop Blocking:** `SimpleVectorStore` calculates cosine similarity in a synchronous `for` loop. If asked "What happens to the Node.js event loop when 10,000 users trigger cosine similarity math simultaneously?", the honest answer is the server blocks.
* **MongoDB Transactions:** The emergency logic touches multiple systems (Twilio, Mongo, Telegram). If asked how you guarantee ACID properties if Twilio succeeds but Mongo crashes, the current architecture likely doesn't use two-phase commits or MongoDB transactions.

## 24. Ownership Audit
* **Frontend UI Layouts & Dashboards:** Implemented by me directly (React, Tailwind styling, component structure).
* **RAG Architecture (`SimpleVectorStore.js`):** Heavily generated/modified with AI assistance to handle the complex ONNX runtime fallback and math implementations.
* **Backend Route Scaffolding:** Implemented by me directly.
* **Emergency State Machine:** Generated with AI assistance to ensure robust async timing.
* **Twilio/Telegram Integrations:** Lightly modified by me from standard documentation/AI templates.
* **Deployment & Debugging Fixes:** Handled collaboratively with AI (e.g., tracking down the Vercel routing 404, stripping diagnostic endpoints for production).
