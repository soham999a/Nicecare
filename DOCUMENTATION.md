# CRM & Inventory Management System - Complete Documentation

> **Last Updated:** January 23, 2026  
> **Project Type:** Full-stack React Application with Firebase Backend

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Firebase Configuration](#firebase-configuration)
5. [Authentication System](#authentication-system)
6. [Data Models](#data-models)
7. [Firestore Security Rules](#firestore-security-rules)
8. [Context Providers](#context-providers)
9. [Custom Hooks](#custom-hooks)
10. [Routing Structure](#routing-structure)
11. [Key Features](#key-features)
12. [Styling Architecture](#styling-architecture)
13. [Development Guide](#development-guide)
14. [Deployment](#deployment)
15. [Known Issues & Solutions](#known-issues--solutions)

---

## Project Overview

This project is a **dual-platform business application** that combines:

1. **CRM (Customer Relationship Management)** - For managing customer data, interactions, and relationships
2. **Inventory Management System** - For retail businesses with multi-store support, employee management, POS (Point of Sale), and sales tracking

Both platforms share the same Firebase project but maintain separate user collections and authentication flows.

### Key Architectural Decision

**Firebase Auth is shared** between CRM and Inventory Management. This means:
- A user can have both a CRM account and an Inventory account with the **same email**
- User profiles are stored in different Firestore collections (`users` for CRM, `inventoryUsers` for Inventory)
- The system uses an **invitation-based employee onboarding** to handle cases where an employee already has a CRM account

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Frontend | React | 19.2.0 |
| Routing | React Router DOM | 7.12.0 |
| Backend/BaaS | Firebase | 12.7.0 |
| Build Tool | Vite | 6.3.5 |
| Testing | Vitest | 3.2.4 |
| Linting | ESLint | 9.27.0 |
| Styling | CSS (Custom with CSS Variables) | - |

### Firebase Services Used

- **Firebase Authentication** - Email/password authentication with email verification
- **Cloud Firestore** - NoSQL document database
- **Firebase Hosting** - Web app hosting with CI/CD

---

## Project Structure

```
Firebase-CRUD-/
├── .github/
│   ├── copilot-instructions.md     # AI assistant context
│   └── workflows/                   # GitHub Actions for Firebase deployment
├── public/
│   └── images/                      # Static assets
├── src/
│   ├── App.jsx                      # Main app component with routing
│   ├── App.css                      # Global app styles
│   ├── main.jsx                     # React entry point
│   ├── index.css                    # Base styles
│   │
│   ├── components/                  # Shared and feature-specific components
│   │   ├── CustomerForm.jsx         # CRM: Add customer form
│   │   ├── CustomerTable.jsx        # CRM: Customer list table
│   │   ├── EditCustomerModal.jsx    # CRM: Edit customer modal
│   │   ├── Navbar.jsx               # CRM: Navigation bar
│   │   ├── ProtectedRoute.jsx       # CRM: Auth route wrapper
│   │   └── inventory/               # Inventory-specific components
│   │       ├── InventoryNavbar.jsx
│   │       ├── InventoryProtectedRoute.jsx
│   │       ├── DigitalReceipt.jsx
│   │       └── LowStockAlert.jsx
│   │
│   ├── config/
│   │   └── firebase.js              # Firebase initialization
│   │
│   ├── context/                     # React Context providers
│   │   ├── AuthContext.jsx          # CRM authentication
│   │   ├── InventoryAuthContext.jsx # Inventory authentication
│   │   └── ThemeContext.jsx         # Dark/Light theme toggle
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useCustomers.js          # CRM: Customer CRUD operations
│   │   ├── useEmployees.js          # Inventory: Employee management
│   │   ├── useProducts.js           # Inventory: Product CRUD
│   │   ├── useStores.js             # Inventory: Store management
│   │   ├── useSales.js              # Inventory: Sales tracking
│   │   └── usePOS.js                # Inventory: Point of Sale logic
│   │
│   ├── pages/                       # Page components
│   │   ├── LandingPage.jsx          # Home page with platform selection
│   │   ├── DashboardPage.jsx        # CRM dashboard
│   │   ├── LoginPage.jsx            # CRM login
│   │   ├── SignupPage.jsx           # CRM signup
│   │   ├── ForgotPasswordPage.jsx   # CRM password reset
│   │   ├── VerifyEmailPage.jsx      # CRM email verification
│   │   └── inventory/               # Inventory pages
│   │       ├── InventoryLoginPage.jsx
│   │       ├── InventorySignupPage.jsx  # Master & Employee signup
│   │       ├── MasterDashboard.jsx
│   │       ├── MemberPOS.jsx
│   │       ├── MemberSales.jsx
│   │       ├── StoreManagement.jsx
│   │       ├── ProductManagement.jsx
│   │       ├── EmployeeManagement.jsx
│   │       └── SalesReports.jsx
│   │
│   ├── styles/
│   │   ├── theme.css                # CSS variables and base theming
│   │   ├── landing.css              # Landing page animations
│   │   └── inventory.css            # Inventory system styles
│   │
│   └── test/                        # Test utilities and mocks
│       ├── setup.js
│       ├── mocks/
│       └── utils/
│
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore indexes
├── firebase.json                    # Firebase project configuration
├── vite.config.js                   # Vite build configuration
└── package.json                     # Dependencies and scripts
```

---

## Firebase Configuration

### Environment Variables (`.env`)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Initialization (`src/config/firebase.js`)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## Authentication System

### CRM Authentication (`AuthContext.jsx`)

Standard email/password authentication with:
- Signup with email verification
- Login
- Password reset
- Profile stored in `users` collection

### Inventory Authentication (`InventoryAuthContext.jsx`)

Role-based authentication with two user types:

#### 1. Master (Business Owner)
- Creates account via standard signup
- Full access to all features
- Can create stores, products, and invite employees
- Profile stored in `inventoryUsers` collection with `role: 'master'`

#### 2. Member (Employee)
- **Cannot self-register** - must be invited by a Master
- Uses invitation code to complete registration
- Limited access based on assigned store
- Profile stored in `inventoryUsers` with `role: 'member'`

### Invitation-Based Employee Onboarding

This system was implemented to solve the problem where **users with existing CRM accounts couldn't be added as employees** (Firebase Auth throws `auth/email-already-in-use`).

#### How It Works:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE ONBOARDING FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MASTER CREATES INVITATION                                    │
│     └─► createEmployee() in InventoryAuthContext                │
│         ├─► Generates 8-character invite code (e.g., "A3B7K9XM")│
│         ├─► Creates record in `employeeInvitations` collection  │
│         └─► Returns invite code + signup link for sharing       │
│                                                                  │
│  2. EMPLOYEE RECEIVES INVITATION                                 │
│     └─► Master shares code OR link:                             │
│         /inventory/signup?type=employee&code=A3B7K9XM           │
│                                                                  │
│  3. EMPLOYEE SIGNS UP                                            │
│     └─► signupEmployee() in InventoryAuthContext                │
│         ├─► Validates invitation code                           │
│         ├─► Checks if email matches invitation                  │
│         ├─► IF new user: Creates Firebase Auth account          │
│         │   ELSE (existing CRM user): Signs in with password    │
│         ├─► Creates `inventoryUsers` profile                    │
│         ├─► Creates `employees` record                          │
│         └─► Marks invitation as 'accepted'                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Functions in `InventoryAuthContext.jsx`:

| Function | Description |
|----------|-------------|
| `signupMaster(email, password, businessName)` | Create a new master account |
| `createEmployee(employeeData)` | Create an invitation for a new employee |
| `signupEmployee(email, password, inviteCode)` | Complete employee registration with invite code |
| `checkInvitation(inviteCode)` | Validate an invitation code before signup |
| `resendInvitation(oldInviteCode)` | Generate a new code for expired invitations |
| `login(email, password)` | Login for both master and member accounts |
| `isMaster()` | Check if current user is a master |
| `isMember()` | Check if current user is a member |
| `getAssignedStoreId()` | Get the store ID assigned to a member |

---

## Data Models

### Firestore Collections

#### `users` (CRM)
```javascript
{
  email: "user@example.com",
  displayName: "John Doe",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `customers` (CRM)
```javascript
{
  ownerUid: "user_uid",           // Owner's Firebase Auth UID
  name: "Customer Name",
  email: "customer@example.com",
  phone: "123-456-7890",
  company: "Company Inc.",
  notes: "Additional notes",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `inventoryUsers` (Inventory)
```javascript
{
  email: "user@example.com",
  displayName: "Business Name" | "Employee Name",
  role: "master" | "member",
  accountType: "inventory",
  
  // Master-specific fields:
  // (none additional)
  
  // Member-specific fields:
  assignedStoreId: "store_id",
  assignedStoreName: "Store Name",
  ownerUid: "master_uid",         // The master who invited them
  phone: "123-456-7890",
  isActive: true,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `stores` (Inventory)
```javascript
{
  ownerUid: "master_uid",
  name: "Main Store",
  address: "123 Main St",
  phone: "123-456-7890",
  email: "store@example.com",
  employeeCount: 5,
  productCount: 100,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `employees` (Inventory)
```javascript
{
  uid: "employee_firebase_uid",
  ownerUid: "master_uid",
  email: "employee@example.com",
  displayName: "Employee Name",
  phone: "123-456-7890",
  role: "member",
  accountType: "inventory",
  assignedStoreId: "store_id",
  assignedStoreName: "Store Name",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `employeeInvitations` (Inventory)
```javascript
// Document ID = inviteCode (e.g., "A3B7K9XM")
{
  email: "employee@example.com",
  name: "Employee Name",
  phone: "123-456-7890",
  assignedStoreId: "store_id",
  assignedStoreName: "Store Name",
  ownerUid: "master_uid",
  ownerBusinessName: "Business Name",
  inviteCode: "A3B7K9XM",
  status: "pending" | "accepted" | "expired",
  createdAt: Timestamp,
  expiresAt: Date,                // 7 days from creation
  
  // After acceptance:
  acceptedAt: Timestamp,
  acceptedByUid: "employee_uid"
}
```

#### `products` (Inventory)
```javascript
{
  ownerUid: "master_uid",
  storeId: "store_id",
  name: "Product Name",
  description: "Product description",
  sku: "SKU-001",
  barcode: "1234567890123",
  category: "Electronics",
  price: 99.99,
  cost: 50.00,
  stockQuantity: 100,
  lowStockThreshold: 10,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `sales` (Inventory)
```javascript
{
  ownerUid: "master_uid",
  storeId: "store_id",
  storeName: "Store Name",
  employeeId: "employee_uid",
  employeeName: "Employee Name",
  items: [
    {
      productId: "product_id",
      name: "Product Name",
      quantity: 2,
      price: 99.99,
      subtotal: 199.98
    }
  ],
  subtotal: 199.98,
  tax: 20.00,
  discount: 0,
  total: 219.98,
  paymentMethod: "cash" | "card" | "mobile",
  status: "completed" | "refunded",
  createdAt: Timestamp
}
```

#### `stockMovements` (Inventory)
```javascript
{
  ownerUid: "master_uid",
  storeId: "store_id",
  productId: "product_id",
  type: "sale" | "restock" | "adjustment" | "transfer",
  quantity: -2,                   // Negative for outgoing
  previousStock: 100,
  newStock: 98,
  reason: "Sale #sale_id",
  performedBy: "user_uid",
  createdAt: Timestamp
}
```

---

## Firestore Security Rules

The security rules enforce:
1. **User isolation** - Users can only access their own data
2. **Role-based access** - Masters have full CRUD, members have limited access
3. **Store-based access** - Members can only access data from their assigned store
4. **Invitation system** - Proper permissions for employee onboarding

### Key Rule Patterns:

```javascript
// Helper function to check if user is the owner
function isMasterOwner(resourceData) {
  return isSignedIn() && resourceData.ownerUid == request.auth.uid;
}

// Employee can access their assigned store's data
function isStoreEmployee(storeId) {
  return isSignedIn() && 
    exists(/databases/$(database)/documents/employees/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.storeId == storeId;
}

// Employees collection - allows self-registration during invite flow
match /employees/{employeeId} {
  allow create: if isSignedIn() && 
    (request.resource.data.ownerUid == request.auth.uid || 
     (employeeId == request.auth.uid && request.resource.data.uid == request.auth.uid));
  allow read: if (isSignedIn() && resource.data.ownerUid == request.auth.uid) || 
    request.auth.uid == employeeId;
  allow update, delete: if isSignedIn() && resource.data.ownerUid == request.auth.uid;
}

// Employee Invitations - allows employees to mark as accepted
match /employeeInvitations/{invitationId} {
  allow read: if true;  // Public read for invite validation
  allow update: if isSignedIn() && 
    (resource.data.ownerUid == request.auth.uid || 
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['status', 'acceptedAt', 'acceptedByUid']));
}
```

---

## Context Providers

### Provider Hierarchy (`App.jsx`)

```jsx
<ThemeProvider>
  <AuthProvider>           {/* CRM Auth */}
    <InventoryAuthProvider> {/* Inventory Auth */}
      <BrowserRouter>
        <Routes>...</Routes>
      </BrowserRouter>
    </InventoryAuthProvider>
  </AuthProvider>
</ThemeProvider>
```

### ThemeContext

```javascript
const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
// toggleTheme: () => void
```

### AuthContext (CRM)

```javascript
const { 
  currentUser,           // Firebase User object
  userProfile,           // Firestore user document
  signup,
  login,
  logout,
  resetPassword,
  resendVerificationEmail 
} = useAuth();
```

### InventoryAuthContext

```javascript
const {
  currentUser,           // Firebase User object
  userProfile,           // inventoryUsers document
  signupMaster,
  signupEmployee,
  createEmployee,        // Creates invitation
  checkInvitation,
  resendInvitation,
  login,
  logout,
  resetPassword,
  isMaster,
  isMember,
  getAssignedStoreId
} = useInventoryAuth();
```

---

## Custom Hooks

### `useCustomers()` - CRM

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

### `useStores()` - Inventory

```javascript
const {
  stores,                // Store[]
  loading,
  error,
  addStore,              // (data) => Promise<Store>
  updateStore,           // (id, data) => Promise
  deleteStore            // (id) => Promise
} = useStores();
```

### `useProducts()` - Inventory

```javascript
const {
  products,              // Product[]
  loading,
  error,
  addProduct,            // (data) => Promise<Product>
  updateProduct,         // (id, data) => Promise
  deleteProduct,         // (id) => Promise
  updateStock,           // (id, quantity, reason) => Promise
  getLowStockProducts    // () => Product[]
} = useProducts();
```

### `useEmployees()` - Inventory

```javascript
const {
  employees,             // Employee[]
  loading,
  error,
  creating,              // boolean - true during creation
  createEmployee,        // (data) => Promise<{inviteCode, ...}>
  updateEmployee,        // (id, data) => Promise
  toggleEmployeeActive,  // (id, isActive) => Promise
  deleteEmployee         // (id) => Promise
} = useEmployees();
```

### `useSales()` - Inventory

```javascript
const {
  sales,                 // Sale[]
  loading,
  error,
  getSalesByDateRange,   // (start, end) => Sale[]
  getSalesByStore,       // (storeId) => Sale[]
  getTotalRevenue,       // () => number
  recordSale             // (saleData) => Promise<Sale>
} = useSales();
```

### `usePOS()` - Inventory

```javascript
const {
  cart,                  // CartItem[]
  addToCart,             // (product) => void
  removeFromCart,        // (productId) => void
  updateQuantity,        // (productId, quantity) => void
  clearCart,             // () => void
  getCartTotal,          // () => number
  checkout               // (paymentMethod) => Promise<Sale>
} = usePOS();
```

---

## Routing Structure

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Home page with platform selection |

### CRM Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/verify-email` | `VerifyEmailPage` | Yes |
| `/dashboard` | `DashboardPage` | Yes (verified) |

### Inventory Routes

| Path | Component | Auth Required | Role |
|------|-----------|---------------|------|
| `/inventory/login` | `InventoryLoginPage` | No | - |
| `/inventory/signup` | `InventorySignupPage` | No | - |
| `/inventory/signup?type=employee&code=XXX` | `InventorySignupPage` | No | - |
| `/inventory/forgot-password` | `InventoryForgotPasswordPage` | No | - |
| `/inventory/verify-email` | `InventoryVerifyEmailPage` | Yes | - |
| `/inventory/dashboard` | `MasterDashboard` | Yes | Master |
| `/inventory/stores` | `StoreManagement` | Yes | Master |
| `/inventory/products` | `ProductManagement` | Yes | Master |
| `/inventory/employees` | `EmployeeManagement` | Yes | Master |
| `/inventory/reports` | `SalesReports` | Yes | Master |
| `/inventory/pos` | `MemberPOS` | Yes | Member |
| `/inventory/my-sales` | `MemberSales` | Yes | Member |

---

## Key Features

### CRM Features
- ✅ Customer CRUD operations
- ✅ Customer search and filtering
- ✅ Email verification
- ✅ Password reset
- ✅ Dark/Light theme

### Inventory Features
- ✅ Multi-store management
- ✅ Product catalog with categories
- ✅ Barcode/SKU support
- ✅ Stock tracking with low-stock alerts
- ✅ Employee management with invitations
- ✅ Point of Sale (POS) system
- ✅ Digital receipts
- ✅ Sales reports and analytics
- ✅ Stock movement history
- ✅ Role-based access control

---

## Styling Architecture

### CSS Variables (`theme.css`)

```css
:root {
  /* Colors */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;          /* Blue theme */
  --border-color: #334155;
  
  /* Status Colors */
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #0ea5e9;
}

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

## Development Guide

### Prerequisites

- Node.js 20+ (or 22/24)
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd Firebase-CRUD-

# Install dependencies
npm install

# Create .env file with Firebase config
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run lint` | Run ESLint |

### Adding New Features

1. **New Page**: Create component in `src/pages/`, add route in `App.jsx`
2. **New Hook**: Create in `src/hooks/`, follow existing patterns
3. **New Component**: Add to `src/components/` or subdirectory
4. **New Collection**: Update `firestore.rules`, create hook

---

## Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
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

### CI/CD with GitHub Actions

The project includes GitHub Actions workflows for:
- Automatic deployment on push to `main`
- Preview deployments for pull requests

---

## Known Issues & Solutions

### Issue 1: Email Already in Use

**Problem**: When adding an employee with an email that exists in CRM, Firebase throws `auth/email-already-in-use`.

**Solution**: Implemented invitation-based employee onboarding (see [Authentication System](#invitation-based-employee-onboarding)).

### Issue 2: Missing or Insufficient Permissions

**Problem**: Employee signup fails with Firestore permission errors.

**Solution**: Updated Firestore rules to allow:
- Employees to create their own `employees` document during signup
- Employees to update invitation status to 'accepted'

```javascript
// employees collection
allow create: if isSignedIn() && 
  (request.resource.data.ownerUid == request.auth.uid || 
   (employeeId == request.auth.uid && request.resource.data.uid == request.auth.uid));

// employeeInvitations collection
allow update: if isSignedIn() && 
  (resource.data.ownerUid == request.auth.uid || 
   request.resource.data.diff(resource.data).affectedKeys()
     .hasOnly(['status', 'acceptedAt', 'acceptedByUid']));
```

### Issue 3: Master Gets Logged Out After Creating Employee

**Problem**: Old implementation used `createUserWithEmailAndPassword` which auto-signs in the new user.

**Solution**: Switched to invitation system - master never creates the auth account directly.

---

## Quick Reference

### Creating a New Employee (Master)

```javascript
const { createEmployee } = useEmployees();

const result = await createEmployee({
  name: "John Doe",
  email: "john@example.com",
  phone: "123-456-7890",
  storeId: "store_123",
  storeName: "Main Store"
});

// result.inviteCode = "A3B7K9XM"
// Share this code or the signup link with the employee
```

### Employee Signup with Invite Code

```javascript
const { signupEmployee } = useInventoryAuth();

await signupEmployee(
  "john@example.com",
  "securePassword123",
  "A3B7K9XM"
);
// Employee is now registered and can access the POS system
```

### Checking User Role

```javascript
const { isMaster, isMember, userProfile } = useInventoryAuth();

if (isMaster()) {
  // Show master dashboard
} else if (isMember()) {
  // Show POS interface
  const storeId = userProfile.assignedStoreId;
}
```

---

## Support

For questions or issues:
1. Check this documentation first
2. Review the code comments in relevant files
3. Check Firestore rules if getting permission errors
4. Ensure Firebase services are properly enabled

---

*This documentation is maintained as part of the project. Update it when making significant changes to the architecture or adding new features.*
