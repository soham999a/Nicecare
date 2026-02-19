# 🏗️ Architecture Diagram

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BROWSER                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         React 19 + Vite + React Router                       │   │
│  │                                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                          main.jsx (Entry Point)                        │   │   │
│  │  │                          └─► App.jsx (Router)                          │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                     │                                         │   │
│  │              ┌──────────────────────┼──────────────────────┐                   │   │
│  │              ▼                      ▼                      ▼                   │   │
│  │  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐       │   │
│  │  │   Landing Page   │   │   CRM Module     │   │  Inventory Module    │       │   │
│  │  │    (Route: /)    │   │ (Route: /crm/*)  │   │(Route: /inventory/*) │       │   │
│  │  └──────────────────┘   └──────────────────┘   └──────────────────────┘       │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FIREBASE BACKEND                                       │
│  ┌────────────────────────┐  ┌──────────────────────────────────────────────────┐   │
│  │   Firebase Auth        │  │              Cloud Firestore                     │   │
│  │  • Email/Password      │  │  Collections:                                   │   │
│  │  • Email Verification  │  │    • customers      • stores                    │   │
│  │  • Password Reset      │  │    • inventoryUsers  • products                 │   │
│  └────────────────────────┘  │    • sales           • stockMovements           │   │
│                              │    • customerEmbeddings                          │   │
│  ┌────────────────────────┐  │    • inventoryEmbeddings                        │   │
│  │   Firebase Hosting     │  │    • employeeInvitations                        │   │
│  │  (CI/CD via GitHub)    │  └──────────────────────────────────────────────────┘   │
│  └────────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL APIs                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │   Google Generative AI (Gemini)                                             │   │
│  │    • gemini-embedding-001  → vector embeddings for RAG                      │   │
│  │    • gemini-2.5-flash      → AI-powered Q&A chatbot (+ streaming)           │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Application Layer Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              App.jsx                                       │
│                         (Root Router Component)                            │
│                                                                            │
│   Wraps everything in:  ThemeProvider  →  BrowserRouter                    │
│                                                                            │
│   ┌──────────┐    ┌──────────────────────┐    ┌────────────────────────┐   │
│   │    /     │    │     /crm/*           │    │    /inventory/*        │   │
│   │ Landing  │    │  AuthProvider wraps   │    │ InventoryAuthProvider  │   │
│   │  Page    │    │  all CRM routes       │    │ wraps all inv. routes  │   │
│   └──────────┘    └──────────────────────┘    └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Providers (Global State)

```
                    ┌──────────────────────────┐
                    │      ThemeProvider        │
                    │  • theme (light/dark)     │
                    │  • toggleTheme()          │
                    │  • Persists to            │
                    │    localStorage           │
                    └────────────┬─────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                              ▼
   ┌──────────────────────────┐   ┌──────────────────────────────┐
   │      AuthProvider        │   │   InventoryAuthProvider       │
   │     (CRM Module)        │   │     (Inventory Module)        │
   │                          │   │                                │
   │  • currentUser           │   │  • currentUser                 │
   │  • signup()              │   │  • userProfile (role-aware)    │
   │  • login()               │   │  • signupMaster()              │
   │  • logout()              │   │  • signupEmployee()            │
   │  • resetPassword()       │   │  • createEmployee() (invite)   │
   │  • resendVerification()  │   │  • login() / logout()          │
   │                          │   │  • resetPassword()             │
   │  Firestore: users        │   │  • isMaster / isMember         │
   │  Auth: onAuthStateChanged│   │                                │
   └──────────────────────────┘   │  Firestore: inventoryUsers,    │
                                  │    employeeInvitations          │
                                  │  Auth: onAuthStateChanged       │
                                  └──────────────────────────────────┘
```

---

## CRM Module

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CRM MODULE (/crm/*)                             │
│                                                                            │
│  PAGES                          COMPONENTS                                 │
│  ─────                          ──────────                                 │
│  ┌──────────────────┐           ┌────────────────────┐                     │
│  │   LoginPage      │           │     Navbar         │                     │
│  │   SignupPage     │           │  • logout           │                     │
│  │   ForgotPassword │           │  • theme toggle     │                     │
│  │   VerifyEmail    │           └────────────────────┘                     │
│  └──────────────────┘           ┌────────────────────┐                     │
│  ┌──────────────────┐           │  CustomerForm      │                     │
│  │   DashboardPage  │◄─────────│  • Add/validate     │                     │
│  │  (Protected)     │           │    customer data    │                     │
│  │                  │           └────────────────────┘                     │
│  │  Composes:       │           ┌────────────────────┐                     │
│  │  • Navbar        │           │  CustomerTable     │                     │
│  │  • CustomerForm  │           │  • List / search    │                     │
│  │  • CustomerTable │           │  • Delete customers │                     │
│  │  • EditModal     │           │  • Open edit modal  │                     │
│  │  • Chatbot       │           └────────────────────┘                     │
│  └──────────────────┘           ┌────────────────────┐                     │
│          │                      │ EditCustomerModal  │                     │
│          ▼                      │  • Edit customer    │                     │
│  ┌──────────────────┐           └────────────────────┘                     │
│  │  ProtectedRoute  │           ┌────────────────────┐                     │
│  │  • Checks auth   │           │ CustomerChatbot    │                     │
│  │  • Checks email  │           │  • RAG-powered Q&A │                     │
│  │    verification  │           │  • Uses ragService  │                     │
│  └──────────────────┘           └────────────────────┘                     │
│                                                                            │
│  HOOK                           SERVICE                                    │
│  ────                           ───────                                    │
│  ┌──────────────────┐           ┌────────────────────┐                     │
│  │  useCustomers()  │           │   ragService.js    │                     │
│  │                  │           │                    │                     │
│  │  • customers[]   │           │  • buildEmbeddings │                     │
│  │  • addCustomer   │  Firestore│  • searchSimilar   │                     │
│  │  • updateCustomer│◄─────────►│  • askQuestion     │                     │
│  │  • deleteCustomer│           │  • Gemini AI chat  │                     │
│  │  • searchCustomer│           │  • Rate limiting   │                     │
│  │  • Real-time sub │           │                    │                     │
│  └──────────────────┘           └────────────────────┘                     │
│           │                              │                                 │
│           ▼                              ▼                                 │
│  ┌─────────────────────────────────────────────┐                           │
│  │          Firestore Collections              │                           │
│  │   • customers   • customerEmbeddings        │                           │
│  └─────────────────────────────────────────────┘                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Inventory Module

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         INVENTORY MODULE (/inventory/*)                               │
│                                                                                      │
│  AUTH PAGES                     MASTER PAGES (requireMaster=true)                     │
│  ──────────                     ────────────                                          │
│  ┌────────────────────┐         ┌────────────────────────────────────────────┐        │
│  │ InventoryLoginPage │         │  MasterDashboard   (/inventory/dashboard) │        │
│  │ InventorySignupPage│         │  StoreManagement   (/inventory/stores)    │        │
│  │ InventoryForgot    │         │  EmployeeManagement(/inventory/employees) │        │
│  │ InventoryVerify    │         │  ProductManagement (/inventory/products)  │        │
│  └────────────────────┘         │  SalesReports      (/inventory/sales)    │        │
│                                 └────────────────────────────────────────────┘        │
│  MEMBER PAGES                   SHARED COMPONENTS                                    │
│  ────────────                   ─────────────────                                     │
│  ┌────────────────────┐         ┌──────────────────────┐                              │
│  │ MemberPOS          │         │  InventoryNavbar     │                              │
│  │  (/inventory/pos)  │         │  • Role-aware nav    │                              │
│  │                    │         ├──────────────────────┤                              │
│  │ MemberSales        │         │  InventoryChatbot    │                              │
│  │ (/inventory/sales) │         │  • RAG Q&A + stream  │                              │
│  └────────────────────┘         ├──────────────────────┤                              │
│                                 │  LowStockAlert       │                              │
│  ROUTE GUARD                    │  • Threshold warning  │                              │
│  ───────────                    ├──────────────────────┤                              │
│  ┌────────────────────┐         │  DigitalReceipt      │                              │
│  │InventoryProtected  │         │  • Print-ready bill   │                              │
│  │  Route             │         └──────────────────────┘                              │
│  │ • Checks auth      │                                                               │
│  │ • Checks role      │                                                               │
│  │   (master/member)  │                                                               │
│  └────────────────────┘                                                               │
│                                                                                      │
│  HOOKS                                        SERVICE                                │
│  ─────                                        ───────                                │
│  ┌──────────────┐ ┌──────────────┐            ┌──────────────────────────┐            │
│  │ useStores()  │ │useProducts() │            │ inventoryRagService.js   │            │
│  │ • CRUD stores│ │ • CRUD items │            │                          │            │
│  │ • Real-time  │ │ • Stock mgmt │            │ • buildInventoryEmbed()  │            │
│  └──────┬───────┘ │ • Low-stock  │            │ • searchInventory()      │            │
│         │         │   detection  │            │ • askInventoryQuestion() │            │
│  ┌──────┴───────┐ └──────┬───────┘            │ • Streaming responses   │            │
│  │useEmployees()│ ┌──────┴───────┐            │ • Multi-entity context  │            │
│  │ • CRUD staff │ │  useSales()  │            │ • Role-aware answers    │            │
│  │ • Invitations│ │ • Record txn │            └──────────┬───────────────┘            │
│  └──────────────┘ │ • Analytics  │                       │                            │
│  ┌──────────────┐ └──────────────┘                       │                            │
│  │  usePOS()    │                                        │                            │
│  │ • Cart mgmt  │──── composes useProducts + useSales    │                            │
│  │ • Checkout   │                                        │                            │
│  │ • Receipts   │                                        │                            │
│  └──────────────┘                                        │                            │
│         │                                                │                            │
│         ▼                                                ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐          │
│  │                        Firestore Collections                            │          │
│  │  • stores  • products  • sales  • stockMovements  • inventoryUsers     │          │
│  │  • employeeInvitations  • inventoryEmbeddings                          │          │
│  └─────────────────────────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
  User Interaction
        │
        ▼
  ┌───────────┐     ┌──────────────┐     ┌──────────────────┐
  │   React   │────►│   Context    │────►│  Firebase Auth    │
  │   Pages   │     │  Providers   │     │  (Authentication) │
  └─────┬─────┘     └──────────────┘     └──────────────────┘
        │
        ▼
  ┌───────────┐     ┌──────────────┐     ┌──────────────────┐
  │   React   │────►│   Custom     │────►│  Cloud Firestore  │
  │Components │     │   Hooks      │     │  (CRUD + Realtime)│
  └─────┬─────┘     └──────────────┘     └──────────────────┘
        │
        ▼
  ┌───────────┐     ┌──────────────┐     ┌──────────────────┐
  │  Chatbot  │────►│  RAG Service │────►│  Gemini AI API    │
  │Components │     │  (Embeddings │     │  (LLM + Embed)    │
  │           │     │   + Search)  │     │                    │
  └───────────┘     └──────┬───────┘     └──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Firestore   │
                    │  Embeddings  │
                    │  Collections │
                    └──────────────┘
```

---

## Role-Based Access Model (Inventory)

```
                    ┌───────────────────┐
                    │  Business Owner   │
                    │   (Master Role)   │
                    └────────┬──────────┘
                             │ creates invitation
                             ▼
                    ┌───────────────────┐
                    │ employeeInvitations│
                    │  (invite code)    │
                    └────────┬──────────┘
                             │ employee signs up with code
                             ▼
                    ┌───────────────────┐
                    │    Employee       │
                    │  (Member Role)    │
                    └───────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │  Master can access:          Member can access:         │
  │  • Dashboard                 • POS (Point of Sale)      │
  │  • Store Management          • My Sales                 │
  │  • Employee Management                                  │
  │  • Product Management                                   │
  │  • Sales Reports                                        │
  └─────────────────────────────────────────────────────────┘
```

---

## CI/CD & Deployment

```
  ┌────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │  Developer │────►│   GitHub Repo    │────►│  GitHub Actions   │
  │   (Push)   │     │                  │     │                   │
  └────────────┘     └──────────────────┘     │  • PR Preview     │
                                              │  • Merge Deploy   │
                                              └────────┬──────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │ Firebase Hosting  │
                                              │  (Production)     │
                                              └──────────────────┘
```

---

## Tech Stack Summary

| Layer          | Technology                                       |
|----------------|--------------------------------------------------|
| **Frontend**   | React 19, React Router 7, Vite 7                |
| **Styling**    | CSS with CSS Variables (dark/light theme)        |
| **Backend**    | Firebase (Auth, Firestore, Hosting)              |
| **AI/ML**      | Google Gemini (embeddings + generative chat)     |
| **Testing**    | Vitest, React Testing Library, jsdom, v8 coverage|
| **CI/CD**      | GitHub Actions → Firebase Hosting                |
| **Linting**    | ESLint 9 (flat config)                           |
