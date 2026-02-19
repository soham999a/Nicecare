# Cloud Functions Setup Guide

This document covers the setup steps required to get the **Server-Side RAG + SSE Streaming + Feedback** feature fully operational.

> **Branch:** `dev/platform-ai`

---

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Step 1 — Upgrade to Firebase Blaze Plan](#step-1--upgrade-to-firebase-blaze-plan)
- [Step 2 — Set the Gemini API Key Secret](#step-2--set-the-gemini-api-key-secret)
- [Step 3 — Deploy Cloud Functions](#step-3--deploy-cloud-functions)
- [Step 4 — Configure Local Environment](#step-4--configure-local-environment)
- [Step 5 — Configure GitHub Secrets for CI/CD](#step-5--configure-github-secrets-for-cicd)
- [Step 6 — Verify End-to-End](#step-6--verify-end-to-end)
- [Local Emulator Development (Optional)](#local-emulator-development-optional)
- [Architecture Overview](#architecture-overview)
- [Deployed Cloud Functions](#deployed-cloud-functions)
- [Troubleshooting](#troubleshooting)

---

## Background

### What changed

Previously, both chatbots (CRM Customer Assistant and Inventory Assistant) ran their entire RAG pipeline **client-side** — Firestore queries, context building, and Gemini API calls all happened in the browser. This exposed the `VITE_GOOGLE_AI_API_KEY` in the frontend bundle, making it extractable from browser DevTools, and client-side rate limiting was trivially bypassed by refreshing the page.

### What's new

| Before | After |
|---|---|
| Gemini API key in browser bundle (`VITE_GOOGLE_AI_API_KEY`) | API key stored in Google Cloud Secret Manager, accessed only by Cloud Functions |
| Client-side Firestore queries for RAG context | Server-side Firestore reads via Firebase Admin SDK |
| Client-side rate limiting (useless — resets on refresh) | Server-side per-UID rate limiting (10 req/min) |
| Full response wait (CRM chatbot) | SSE streaming for both chatbots |
| No feedback mechanism | Thumbs up/down + optional free-text comment persisted to Firestore |

---

## Prerequisites

- **Node.js 20+** installed locally
- **Firebase CLI** v13+ installed (`npm install -g firebase-tools`)
- Logged into Firebase CLI (`firebase login`)
- A **Google AI / Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Step 1 — Upgrade to Firebase Blaze Plan

Cloud Functions (2nd gen) and Secret Manager require the **Blaze (pay-as-you-go)** plan.

👉 **Go to:** https://console.firebase.google.com/project/remoteshopsupport/usage/details

Click **"Modify plan"** → select **Blaze** → add a billing account.

> **Cost note:** Blaze is still free within the generous free tier:
> - 2 million function invocations/month
> - 400,000 GB-seconds of compute
> - 200,000 CPU-seconds
> - 10 GB/month of Secret Manager access
>
> For a dev/small-scale project, you'll likely stay within free limits.

---

## Step 2 — Set the Gemini API Key Secret

From the project root:

```bash
cd /path/to/Firebase-CRUD-
firebase functions:secrets:set GOOGLE_AI_API_KEY
```

The CLI will prompt you to paste your Gemini API key. This stores it in **Google Cloud Secret Manager**. The value is the same key you previously used as `VITE_GOOGLE_AI_API_KEY`.

**Verify it was set:**

```bash
firebase functions:secrets:access GOOGLE_AI_API_KEY
```

This should print your API key back.

> **How it works:** In `functions/index.js`, each function declares `secrets: [googleAiApiKey]` where `googleAiApiKey = defineSecret('GOOGLE_AI_API_KEY')`. At runtime, the secret is injected as `process.env.GOOGLE_AI_API_KEY` — it never touches the client.

---

## Step 3 — Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys all 6 functions. After deployment, the CLI prints each function's URL:

```
✔  functions[askAboutInventory(us-central1)] Successful create operation.
Function URL (askAboutInventory(us-central1)): https://us-central1-remoteshopsupport.cloudfunctions.net/askAboutInventory
...
```

Note the **base URL** (everything before the function name):

```
https://us-central1-remoteshopsupport.cloudfunctions.net
```

You'll need this for Step 4.

---

## Step 4 — Configure Local Environment

### 4a. Update `.env`

Open or create your `.env` file in the project root. Use `.env.example` as reference:

```env
# Firebase Client SDK Config (keep existing values)
VITE_FIREBASE_API_KEY=your-existing-value
VITE_FIREBASE_AUTH_DOMAIN=remoteshopsupport.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=remoteshopsupport
VITE_FIREBASE_STORAGE_BUCKET=remoteshopsupport.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-existing-value
VITE_FIREBASE_APP_ID=your-existing-value

# Cloud Functions URL (from Step 3)
VITE_FUNCTIONS_URL=https://us-central1-remoteshopsupport.cloudfunctions.net
```

### 4b. Remove the old API key

If `VITE_GOOGLE_AI_API_KEY` is still in your `.env`, **delete or comment it out**. It is no longer referenced anywhere in the client code.

---

## Step 5 — Configure GitHub Secrets for CI/CD

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** and add:

| Secret Name | Value | How to get it |
|---|---|---|
| `VITE_FUNCTIONS_URL` | `https://us-central1-remoteshopsupport.cloudfunctions.net` | From Step 3 deploy output |
| `FIREBASE_TOKEN` | `1//0abc...` (long token string) | Run `firebase login:ci` in terminal — it opens a browser, you authenticate, and it prints a token |

### What the CI/CD workflows do

**On merge to `main`** (`firebase-hosting-merge.yml`):
1. Run tests with all `VITE_*` env vars
2. Install functions dependencies (`cd functions && npm ci`)
3. Build the frontend (`npm ci && npm run build`)
4. Deploy both hosting + functions (`firebase deploy --only hosting,functions`)

**On pull request** (`firebase-hosting-pull-request.yml`):
1. Run tests
2. Install functions dependencies
3. Build the frontend
4. Deploy a preview channel (hosting only — functions aren't previewed)

---

## Step 6 — Verify End-to-End

After completing Steps 1–5:

### 6a. Start the dev server

```bash
npm run dev
```

### 6b. Test streaming

1. Open the app in browser
2. Navigate to either chatbot (CRM Dashboard → chat icon, or Inventory → chat icon)
3. Ask a question (e.g., "How many customers do I have?")
4. You should see:
   - A "Thinking" / "Analyzing" shimmer animation
   - Text appearing character-by-character with a blinking cursor (`▊`)
   - A meta line after completion (e.g., "Analyzed 15 customer records")

### 6c. Test feedback

1. After a response finishes streaming, you should see 👍 and 👎 buttons below it
2. Click either button — it should highlight (turn blue)
3. After clicking, a 💬 (comment) icon appears
4. Click it → type a comment → click Submit
5. **Verify in Firestore:** Go to Firebase Console → Firestore → `chatFeedback` collection. You should see a document with:
   ```json
   {
     "messageId": "uuid-string",
     "userId": "firebase-uid",
     "question": "How many customers do I have?",
     "answer": "Based on your records...",
     "rating": "up",
     "comment": "Very helpful!",
     "module": "crm",
     "createdAt": "2026-02-09T...",
     "updatedAt": "2026-02-09T..."
   }
   ```

### 6d. Test rate limiting

Rapidly send 11+ messages within 1 minute. The 11th request should return an error: _"Rate limit exceeded. Please wait X seconds before trying again."_

---

## Local Emulator Development (Optional)

The `firebase.json` already has emulator ports configured. To develop locally without hitting production:

### Start emulators

```bash
firebase emulators:start
```

This starts:

| Service | Port | URL |
|---|---|---|
| Auth Emulator | 9099 | http://127.0.0.1:9099 |
| Functions Emulator | 5001 | http://127.0.0.1:5001 |
| Firestore Emulator | 8080 | http://127.0.0.1:8080 |
| Hosting Emulator | 5000 | http://127.0.0.1:5000 |
| Emulator UI | 4000 | http://127.0.0.1:4000 |

### Point frontend to emulators

Temporarily update your `.env`:

```env
VITE_FUNCTIONS_URL=http://127.0.0.1:5001/remoteshopsupport/us-central1
```

Then run `npm run dev` in a separate terminal.

> **Note:** The Functions emulator needs the `GOOGLE_AI_API_KEY` environment variable. You can set it via a `.secret.local` file in the `functions/` directory:
>
> ```
> GOOGLE_AI_API_KEY=your-gemini-api-key
> ```
>
> This file should be gitignored (it is, by the `*.local` pattern in `.gitignore`).

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│                                              │
│  CustomerChatbot.jsx   InventoryChatbot.jsx  │
│        │                      │              │
│        ▼                      ▼              │
│   ragService.js      inventoryRagService.js  │
│        │                      │              │
│        └──────┐    ┌──────────┘              │
│               ▼    ▼                         │
│           sseClient.js ── feedbackService.js  │
│             │  (SSE)           │  (POST)      │
└─────────────┼──────────────────┼─────────────┘
              │ Authorization:   │
              │ Bearer <token>   │
              ▼                  ▼
┌─────────────────────────────────────────────┐
│         Cloud Functions (2nd gen)            │
│                                              │
│  askAboutInventory    askAboutCustomers      │
│  inventorySummary     customerSummary        │
│  inventoryLowStock    submitFeedback         │
│        │                      │              │
│   ┌────┴────┐            ┌────┴────┐         │
│   │ Gemini  │            │Firestore│         │
│   │   API   │            │  Admin  │         │
│   └─────────┘            └─────────┘         │
│                                              │
│  Secret: GOOGLE_AI_API_KEY (Secret Manager)  │
└──────────────────────────────────────────────┘
```

**Request flow:**
1. User sends a question in the chatbot
2. Component calls the service (e.g., `askAboutCustomers`)
3. Service calls `fetchSSE()` which gets a Firebase ID token and makes a `POST` to the Cloud Function
4. Cloud Function verifies the token, checks rate limit, queries Firestore via Admin SDK, builds RAG context, and streams Gemini's response as SSE
5. `sseClient.js` reads the SSE stream, calling `onStream(chunk, fullText)` for each chunk → UI updates in real-time
6. On `done` event, the final metadata (e.g., `customersUsed`) is returned
7. User can then rate the response with 👍/👎 → `feedbackService.js` POSTs to `submitFeedback`

---

## Deployed Cloud Functions

| Function | Method | Purpose |
|---|---|---|
| `askAboutInventory` | POST | Answer inventory questions with RAG + streaming |
| `inventorySummary` | POST | Generate a business summary with RAG + streaming |
| `inventoryLowStock` | POST | Analyze low stock items with RAG + streaming |
| `askAboutCustomers` | POST | Answer customer questions with RAG + streaming |
| `customerSummary` | POST | Generate customer summary with RAG + streaming |
| `submitFeedback` | POST | Save thumbs up/down + optional comment to Firestore |

All RAG functions: `cors: true`, `timeoutSeconds: 120`, `memory: 512MiB`, require `GOOGLE_AI_API_KEY` secret.

---

## Troubleshooting

### "Your project must be on the Blaze plan"
You haven't completed [Step 1](#step-1--upgrade-to-firebase-blaze-plan).

### "Missing or invalid Authorization header"
The frontend isn't sending the Firebase ID token. Check that `VITE_FUNCTIONS_URL` is set correctly in `.env` and the user is logged in.

### "Rate limit exceeded"
Wait 60 seconds. The server enforces 10 requests per minute per user. This resets automatically.

### Functions deploy fails in CI
Make sure `FIREBASE_TOKEN` is set in GitHub Secrets ([Step 5](#step-5--configure-github-secrets-for-cicd)). Generate it with `firebase login:ci`.

### Chatbot shows error but Firestore has data
Check the browser console for CORS errors. Ensure the function was deployed with `cors: true` (it is by default in `functions/index.js`).

### "Not authenticated. Please log in."
The `auth.currentUser` is null when the SSE client tries to get an ID token. This means the user's Firebase Auth session expired or they're not logged in.

### Emulator: "Could not load the default credentials"
When using emulators, the Functions emulator needs the Gemini API key. Create `functions/.secret.local` with `GOOGLE_AI_API_KEY=your-key`.
