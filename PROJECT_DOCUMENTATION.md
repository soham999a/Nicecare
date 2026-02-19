# CounterOne - CRM & Inventory Management System

<p align="center">
  <strong>A dual-platform business management solution built with React and Firebase</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Firebase-12.7.0-FFCA28?style=flat-square&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/Vite-7.2.4-646CFF?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

**CounterOne** is a comprehensive business management platform that combines two powerful applications:

### 1. CRM (Customer Relationship Management)
A system for managing customer profiles, tracking service orders, and maintaining customer relationships.

### 2. Inventory Management System
A complete retail solution with multi-store support, employee management, Point of Sale (POS), product catalog, and sales analytics.

### Key Architecture Decisions

- **Shared Firebase Authentication** - Users can have both CRM and Inventory accounts with the same email
- **Separate User Collections** - CRM users stored in `users`, Inventory users in `inventoryUsers`
- **Invitation-Based Employee Onboarding** - Solves the "email already in use" problem for existing CRM users joining as employees
- **Role-Based Access Control** - Masters (owners) have full access; Members (employees) have limited, store-specific access

---

## ✨ Features

### CRM Platform
| Feature | Description |
|---------|-------------|
| 👤 **Customer Management** | Full CRUD operations for customer profiles |
| 🔍 **Search & Filter** | Find customers quickly with search functionality |
| 🤖 **AI-Powered Chatbot** | Natural language queries about customer data using Google Gemini |
| 📧 **Email Verification** | Secure account verification workflow |
| 🔐 **Password Reset** | Self-service password recovery |
| 🌓 **Dark/Light Theme** | User preference-based theme switching |

### Inventory Platform
| Feature | Description |
|---------|-------------|
| 🏪 **Multi-Store Management** | Manage multiple retail locations |
| 👥 **Employee Management** | Invite and manage staff with role-based access |
| 📦 **Product Catalog** | Categories, SKU, barcodes, pricing |
| 📊 **Stock Tracking** | Real-time inventory with low-stock alerts |
| 🛒 **Point of Sale (POS)** | Fast checkout with barcode scanning |
| 🧾 **Digital Receipts** | Generate and share receipts |
| 📈 **Sales Analytics** | Revenue reports and performance tracking |
| 🔄 **Stock Movement History** | Track all inventory changes |

---

## 🛠 Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React | 19.2.0 |
| **Routing** | React Router DOM | 7.12.0 |
| **Backend** | Firebase (Auth, Firestore) | 12.7.0 |
| **AI/ML** | Google Generative AI | 0.24.1 |
| **Build Tool** | Vite | 7.2.4 |
| **Testing** | Vitest | 4.0.17 |
| **Test Utils** | Testing Library (React) | 16.3.1 |
| **Linting** | ESLint | 9.39.1 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **npm** or **yarn**
- **Firebase Project** with Authentication and Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Firebase-CRUD-

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file with your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google AI (for Chatbot)
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
Firebase-CRUD-/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── public/
│   └── images/              # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CustomerForm.jsx
│   │   ├── CustomerTable.jsx
│   │   ├── EditCustomerModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── inventory/       # Inventory-specific components
│   │       ├── DigitalReceipt.jsx
│   │       ├── InventoryNavbar.jsx
│   │       ├── InventoryProtectedRoute.jsx
│   │       └── LowStockAlert.jsx
│   │
│   ├── config/
│   │   └── firebase.js      # Firebase initialization
│   │
│   ├── context/             # React Context providers
│   │   ├── AuthContext.jsx          # CRM authentication
│   │   ├── InventoryAuthContext.jsx # Inventory authentication
│   │   └── ThemeContext.jsx         # Theme management
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useCustomers.js  # CRM customer operations
│   │   ├── useEmployees.js  # Employee management
│   │   ├── useProducts.js   # Product CRUD
│   │   ├── useStores.js     # Store management
│   │   ├── useSales.js      # Sales tracking
│   │   └── usePOS.js        # Point of Sale logic
│   │
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── inventory/       # Inventory pages
│   │       ├── MasterDashboard.jsx
│   │       ├── MemberPOS.jsx
│   │       ├── StoreManagement.jsx
│   │       └── ...
│   │
│   ├── services/
│   │   └── ragService.js    # AI/RAG service
│   │
│   ├── styles/              # CSS files
│   │   ├── theme.css        # CSS variables & theming
│   │   ├── landing.css      # Landing page styles
│   │   └── inventory.css    # Inventory system styles
│   │
│   └── test/                # Test utilities
│       ├── setup.js
│       ├── mocks/
│       └── utils/
│
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore indexes
├── firebase.json            # Firebase configuration
├── vite.config.js           # Vite configuration
└── package.json
```

---

## 🔐 Authentication

### CRM Authentication Flow

```
User Signup → Email Verification → Login → Dashboard
```

**Key Functions:**
- `signup(email, password, displayName)` - Create new account
- `login(email, password)` - Authenticate user
- `logout()` - Sign out user
- `resetPassword(email)` - Send password reset email
- `resendVerificationEmail()` - Resend verification email

### Inventory Authentication Flow

The Inventory system has two user types with different flows:

#### Master (Business Owner)
```
Standard Signup → Email Verification → Login → Master Dashboard
```

#### Member (Employee)
```
Master Creates Invitation → Employee Receives Code → Employee Signs Up → POS Access
```

### Invitation-Based Employee Onboarding

This system solves the problem where existing CRM users couldn't be added as employees:

```
┌─────────────────────────────────────────────────────────────┐
│                 EMPLOYEE ONBOARDING FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. MASTER CREATES INVITATION                                │
│     → Generates 8-character code (e.g., "A3B7K9XM")         │
│     → Creates record in employeeInvitations collection       │
│                                                              │
│  2. EMPLOYEE RECEIVES INVITATION                             │
│     → Master shares code OR signup link:                     │
│       /inventory/signup?type=employee&code=A3B7K9XM         │
│                                                              │
│  3. EMPLOYEE SIGNS UP                                        │
│     → Validates invitation code                              │
│     → Creates account (or uses existing)                     │
│     → Creates inventoryUsers profile                         │
│     → Marks invitation as 'accepted'                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Collections Overview

| Collection | Purpose | Owner |
|------------|---------|-------|
| `users` | CRM user profiles | Individual users |
| `customers` | CRM customer records | CRM users |
| `inventoryUsers` | Inventory user profiles | Individual users |
| `stores` | Retail store records | Masters |
| `employees` | Employee records | Masters |
| `employeeInvitations` | Pending invitations | Masters |
| `products` | Product catalog | Masters |
| `sales` | Sales transactions | Masters |
| `stockMovements` | Inventory audit trail | Masters |

### Document Schemas

#### `users` (CRM)
```javascript
{
  email: string,
  displayName: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `customers` (CRM)
```javascript
{
  ownerUid: string,      // Owner's Firebase UID
  name: string,
  email: string,
  phone: string,
  company: string,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `inventoryUsers`
```javascript
{
  email: string,
  displayName: string,
  role: "master" | "member",
  accountType: "inventory",
  // Member-only fields:
  assignedStoreId?: string,
  assignedStoreName?: string,
  ownerUid?: string,
  isActive?: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `stores`
```javascript
{
  ownerUid: string,
  name: string,
  address: string,
  phone: string,
  email: string,
  employeeCount: number,
  productCount: number,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `products`
```javascript
{
  ownerUid: string,
  storeId: string,
  name: string,
  description: string,
  sku: string,
  barcode: string,
  category: string,
  price: number,
  cost: number,
  stockQuantity: number,
  lowStockThreshold: number,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `sales`
```javascript
{
  ownerUid: string,
  storeId: string,
  storeName: string,
  employeeId: string,
  employeeName: string,
  items: [{
    productId: string,
    name: string,
    quantity: number,
    price: number,
    subtotal: number
  }],
  subtotal: number,
  tax: number,
  discount: number,
  total: number,
  paymentMethod: "cash" | "card" | "mobile",
  status: "completed" | "refunded",
  createdAt: Timestamp
}
```

---

## 📚 API Reference

### Context Hooks

#### `useAuth()` - CRM Authentication
```javascript
const {
  currentUser,           // Firebase User object
  signup,                // (email, password, displayName) => Promise
  login,                 // (email, password) => Promise
  logout,                // () => Promise
  resetPassword,         // (email) => Promise
  resendVerificationEmail // () => Promise
} = useAuth();
```

#### `useInventoryAuth()` - Inventory Authentication
```javascript
const {
  currentUser,           // Firebase User object
  userProfile,           // inventoryUsers document
  signupMaster,          // (email, password, businessName) => Promise
  signupEmployee,        // (email, password, inviteCode) => Promise
  createEmployee,        // (employeeData) => Promise
  checkInvitation,       // (inviteCode) => Promise
  login,                 // (email, password) => Promise
  logout,                // () => Promise
  isMaster,              // () => boolean
  isMember,              // () => boolean
} = useInventoryAuth();
```

#### `useTheme()` - Theme Management
```javascript
const {
  theme,                 // "light" | "dark"
  toggleTheme            // () => void
} = useTheme();
```

### Data Hooks

#### `useCustomers()` - CRM Customers
```javascript
const {
  customers,             // Customer[]
  loading,               // boolean
  error,                 // string | null
  addCustomer,           // (data) => Promise
  updateCustomer,        // (id, data) => Promise
  deleteCustomer         // (id) => Promise
} = useCustomers();
```

#### `useStores()` - Store Management
```javascript
const {
  stores,                // Store[]
  loading,               // boolean
  error,                 // string | null
  addStore,              // (data) => Promise<Store>
  updateStore,           // (id, data) => Promise
  deleteStore            // (id) => Promise
} = useStores();
```

#### `useProducts()` - Product Management
```javascript
const {
  products,              // Product[]
  loading,               // boolean
  error,                 // string | null
  addProduct,            // (data) => Promise<Product>
  updateProduct,         // (id, data) => Promise
  deleteProduct,         // (id) => Promise
  updateStock,           // (id, quantity, reason) => Promise
  getLowStockProducts    // () => Product[]
} = useProducts();
```

#### `useEmployees()` - Employee Management
```javascript
const {
  employees,             // Employee[]
  loading,               // boolean
  creating,              // boolean
  error,                 // string | null
  createEmployee,        // (data) => Promise<{inviteCode, ...}>
  updateEmployee,        // (id, data) => Promise
  toggleEmployeeActive,  // (id, isActive) => Promise
  deleteEmployee         // (id) => Promise
} = useEmployees();
```

#### `usePOS(storeId)` - Point of Sale
```javascript
const {
  cart,                  // CartItem[]
  products,              // Product[]
  processing,            // boolean
  lastSale,              // Sale | null
  addToCart,             // (product, quantity) => void
  updateCartItemQuantity,// (productId, quantity) => void
  removeFromCart,        // (productId) => void
  clearCart,             // () => void
  getCartTotals,         // () => { subtotal, tax, total }
  checkout,              // (paymentMethod, ...) => Promise<Sale>
  searchProducts,        // (term) => Product[]
  getProductByCode       // (code) => Product | null
} = usePOS(storeId);
```

#### `useSales()` - Sales Tracking
```javascript
const {
  sales,                 // Sale[]
  loading,               // boolean
  error,                 // string | null
  getSalesByDateRange,   // (start, end) => Sale[]
  getSalesByStore,       // (storeId) => Sale[]
  getTotalRevenue        // () => number
} = useSales();
```

---

## 🧪 Testing

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
src/
├── components/
│   └── __tests__/
│       ├── CustomerForm.test.jsx
│       └── EditCustomerModal.test.jsx
├── hooks/
│   └── __tests__/
│       ├── useEmployees.test.js
│       ├── usePOS.test.js
│       └── ...
├── pages/
│   └── __tests__/
│       ├── ForgotPasswordPage.test.jsx
│       └── SignupPage.test.jsx
└── test/
    ├── setup.js              # Test setup
    ├── mocks/
    │   ├── firebase.js       # Firebase mocks
    │   ├── contexts.jsx      # CRM context mocks
    │   └── inventoryContexts.jsx  # Inventory mocks
    └── utils/
        └── testUtils.jsx     # Testing utilities
```

### Coverage

View coverage reports at `coverage/index.html` after running:
```bash
npm run test:coverage
```

---

## 🚢 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### CI/CD Pipeline

The project includes GitHub Actions workflows:

- **`firebase-hosting-merge.yml`** - Auto-deploys to production on `main` branch push
- **`firebase-hosting-pull-request.yml`** - Creates preview deployments for PRs

### Build Optimization

```bash
# Create optimized production build
npm run build

# Preview the build locally
npm run preview
```

---

## 🤖 AI Features

### Customer Data Chatbot

The CRM platform includes an AI-powered chatbot that allows users to query their customer data using natural language. Built with **Google Gemini AI** and a RAG (Retrieval-Augmented Generation) architecture.

#### Capabilities

| Feature | Description |
|---------|-------------|
| 💬 **Natural Language Queries** | Ask questions like "How many customers do I have?" or "Show repairs in progress" |
| 🔍 **Semantic Search** | Uses vector embeddings to find relevant customer records |
| 📊 **Data Summarization** | Generate summaries of customer status, repairs, and analytics |
| 🎯 **Context-Aware Responses** | Retrieves relevant customer data before generating responses |

#### Example Queries

```
"How many customers do I have?"
"Show repairs in progress"
"Any urgent repairs pending?"
"Summarize today's status"
"Find customers with iPhone issues"
"Which repairs are overdue?"
```

#### How It Works (RAG Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. USER QUERY                                               │
│     "Show me urgent repairs"                                 │
│                                                              │
│  2. EMBEDDING GENERATION                                     │
│     → Query converted to vector using Gemini Embedding API   │
│                                                              │
│  3. SIMILARITY SEARCH                                        │
│     → Compare query embedding with customer data embeddings  │
│     → Retrieve top-K most relevant customer records          │
│                                                              │
│  4. CONTEXT BUILDING                                         │
│     → Combine relevant customer data as context              │
│                                                              │
│  5. LLM GENERATION                                           │
│     → Send context + query to Gemini Pro                     │
│     → Generate natural language response                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Configuration

Add your Google AI API key to `.env`:

```env
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

#### Key Functions (`ragService.js`)

| Function | Description |
|----------|-------------|
| `generateEmbedding(text)` | Generate vector embeddings using Gemini |
| `searchSimilarCustomers(query, uid, limit)` | Find customers matching a query |
| `askAboutCustomers(query, uid, includeAll)` | Main chatbot function - query + RAG + response |
| `generateCustomerSummary(uid)` | Generate overall customer data summary |

#### Component (`CustomerChatbot.jsx`)

A floating chat widget that provides:
- Chat interface with message history
- Suggested quick questions
- Loading states and error handling
- Auto-scroll to latest messages

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Email Already in Use" Error
**Problem:** Adding an employee with an existing CRM email fails.

**Solution:** The invitation system handles this automatically. If the email exists, the employee uses their existing password during signup.

#### 2. "Missing or Insufficient Permissions"
**Problem:** Firestore operations fail with permission errors.

**Solutions:**
- Ensure user is authenticated
- Check Firestore rules match your use case
- Verify the user has the correct role (master/member)
- For employees, verify they're accessing their assigned store's data

#### 3. Master Gets Logged Out After Creating Employee
**Problem:** This occurred in older versions.

**Solution:** Upgrade to the invitation-based system (current version) - masters never directly create auth accounts.

#### 4. Environment Variables Not Loading
**Problem:** Firebase initialization fails.

**Solutions:**
- Ensure `.env` file exists in project root
- Variables must start with `VITE_` prefix
- Restart the development server after changes

### Getting Help

1. Check this documentation
2. Review code comments in relevant files
3. Check Firestore rules for permission errors
4. Verify Firebase services are enabled in console

---

## 📄 Routes Reference

### Landing Page
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Platform selection page |

### CRM Routes
| Path | Component | Auth | Verified |
|------|-----------|------|----------|
| `/crm/login` | `LoginPage` | ❌ | - |
| `/crm/signup` | `SignupPage` | ❌ | - |
| `/crm/forgot-password` | `ForgotPasswordPage` | ❌ | - |
| `/crm/verify-email` | `VerifyEmailPage` | ✅ | ❌ |
| `/crm/dashboard` | `DashboardPage` | ✅ | ✅ |

### Inventory Routes
| Path | Component | Auth | Role |
|------|-----------|------|------|
| `/inventory/login` | `InventoryLoginPage` | ❌ | - |
| `/inventory/signup` | `InventorySignupPage` | ❌ | - |
| `/inventory/forgot-password` | `InventoryForgotPasswordPage` | ❌ | - |
| `/inventory/verify-email` | `InventoryVerifyEmailPage` | ✅ | - |
| `/inventory/dashboard` | `MasterDashboard` | ✅ | Master |
| `/inventory/stores` | `StoreManagement` | ✅ | Master |
| `/inventory/products` | `ProductManagement` | ✅ | Master |
| `/inventory/employees` | `EmployeeManagement` | ✅ | Master |
| `/inventory/sales` | `SalesReports` | ✅ | Master |
| `/inventory/pos` | `MemberPOS` | ✅ | Member |
| `/inventory/my-sales` | `MemberSales` | ✅ | Member |

---

## 🎨 Theming

### CSS Variables

The application uses CSS custom properties for theming:

```css
/* Dark Theme (Default) */
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;
  --border-color: #334155;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
}

/* Light Theme */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
}
```

### Style Files

| File | Purpose |
|------|---------|
| `theme.css` | CSS variables, base styles, form elements |
| `landing.css` | Landing page animations and layout |
| `inventory.css` | Inventory system specific styles |
| `App.css` | CRM-specific component styles |

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ using React and Firebase
</p>
