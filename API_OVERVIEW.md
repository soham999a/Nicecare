# API Overview — How Frontend Maps to Backend

This project uses **two distinct API mechanisms** depending on what you're doing.

---

## The Two "Backends"

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
└──────────────────┬────────────────────┬─────────────────┘
                   │                    │
          ① Firestore SDK          ② HTTP/SSE (fetch)
          (direct, realtime)       (via Cloud Functions)
                   │                    │
    ┌──────────────▼──────┐    ┌────────▼──────────────┐
    │  Firebase Firestore  │    │  Firebase Cloud        │
    │  (NoSQL Database)    │    │  Functions (backend    │
    │  - stores            │    │  server: functions/)   │
    │  - products          │    │  - AI chatbot logic    │
    │  - employees         │    │  - RAG pipeline        │
    │  - sales             │    │  - feedback writes     │
    └─────────────────────┘    └───────────────────────┘
```

---

## Path ① — Firestore Direct (CRUD Data)

For all regular data (stores, products, employees, sales), the frontend talks **directly** to Firestore via the Firebase SDK. No backend server involved.

**The chain:**

```
Page (e.g. StoreManagement.jsx)
    └── Hook (useStores.js)                          ← React hook, owned by UI
         └── Repository (storesRepository.js)        ← Firestore SDK calls
              └── Firebase Firestore (cloud DB)      ← actual data storage
```

**Key files:**

| Layer | File | Role |
|---|---|---|
| Config | `src/config/firebase.js` | Initializes Firebase `auth` and `db` using `.env` keys |
| Collection names | `src/backend/firestore/collections.js` | Constants like `'stores'`, `'products'` |
| Schemas | `src/backend/firestore/schemas.js` | Documents what fields each collection has |
| Repositories | `src/backend/firestore/repositories/` | Actual Firestore `addDoc`, `onSnapshot`, `updateDoc`, `deleteDoc` calls |
| Hooks | `src/hooks/useStores.js`, `useProducts.js` etc. | Call the repo, manage React state, expose to pages |
| Form mappings | `src/backend/contracts/formMappings.js` | Documents how form fields map to Firestore fields |

**Example — Saving a new Store:**

```
User fills form → StoreManagement.jsx calls addStore()
  → useStores.addStore() → storesRepository.addStore(ownerUid, data)
     → Firebase SDK addDoc(collection(db, 'stores'), {...})  ← goes to Firestore
```

---

## Path ② — Cloud Functions HTTP API (AI Chatbot)

For AI chatbot features, the frontend sends HTTP POST requests to **Firebase Cloud Functions** (`functions/index.js`). The base URL comes from `VITE_FUNCTIONS_URL` in `.env`.

**The chain:**

```
InventoryChatbot / CustomerChatbot component
    └── endpoints layer  (src/backend/endpoints/)
         └── sseClient.js  (postSSE)   ← authenticated fetch() with streaming
              └── Cloud Function URL   ← functions/index.js running on Firebase
                   └── Gemini AI API  ← generates the streamed response
```

**Key files:**

| Layer | File | Role |
|---|---|---|
| URL config | `src/backend/client/config.js` | Reads `VITE_FUNCTIONS_URL` from `.env` |
| Auth token | `src/backend/client/httpClient.js` | Gets Firebase ID token → adds `Authorization: Bearer <token>` header |
| SSE transport | `src/backend/client/sseClient.js` | `postSSE()` — sends POST, streams `data:` events back in real-time |
| HTTP transport | `src/backend/client/httpClient.js` | `postJson()` — regular POST for non-streaming calls |
| CRM endpoints | `src/backend/endpoints/crmEndpoints.js` | `askAboutCustomers`, `generateCustomerSummary` |
| Inventory endpoints | `src/backend/endpoints/inventoryEndpoints.js` | `askAboutInventory`, `generateInventorySummary`, `analyzeLowStock` |
| Feedback endpoint | `src/backend/endpoints/feedbackEndpoints.js` | `submitFeedback` (thumbs up/down) |
| API contracts | `src/backend/contracts/apiContracts.js` | Documents all endpoint names + expected request body fields |
| **Cloud Functions** | `functions/index.js` | The actual server — verifies auth, calls Gemini AI, streams response back |

**The 6 API endpoints:**

| Endpoint | Transport | Description |
|---|---|---|
| `POST /askAboutInventory` | SSE streaming | AI answers inventory questions |
| `POST /inventorySummary` | SSE streaming | AI summary of all inventory |
| `POST /inventoryLowStock` | SSE streaming | AI analysis of low-stock items |
| `POST /askAboutCustomers` | SSE streaming | AI answers CRM questions |
| `POST /customerSummary` | SSE streaming | AI summary of all customers |
| `POST /submitFeedback` | Regular JSON | Saves thumbs up/down feedback to Firestore |

---

## Authentication Layer

Every API request (both paths) requires authentication:

- **Firestore direct** — Firebase security rules (`firestore.rules`) enforce `request.auth != null` checks server-side.
- **Cloud Functions** — `httpClient.js` calls `auth.currentUser.getIdToken()` and sends a `Bearer` token; the function's `verifyAuth()` utility validates it before processing any request.

---

## Why SSE (Server-Sent Events)?

The AI responses are streamed word-by-word so the user sees the answer appear in real-time (like ChatGPT). `sseClient.js` reads the stream chunk by chunk (`data: {"chunk": "..."}` lines) and calls `onStream(chunk)` so the UI can update progressively. The final event is `data: {"done": true, ...meta}`.

---

## Local Development

`local-backend.js` in the project root is a local Node.js/Express server that **mirrors** the Cloud Functions. When `VITE_FUNCTIONS_URL=http://localhost:3001` is set in `.env`, the frontend hits this local server instead of Firebase — allowing testing without deploying.

```
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Local backend (mirrors Cloud Functions)
node local-backend.js
```
