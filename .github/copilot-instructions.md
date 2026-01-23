# Copilot Instructions for CRM & Inventory Management System

## Project Overview

This is a **dual-platform business application** combining:
1. **CRM** - Customer relationship management for phone repair shops
2. **Inventory Management** - Multi-store retail system with POS, employee management, and sales tracking

Both platforms share the same Firebase project but use **separate Firestore collections** and **different authentication flows**.

## Critical Architecture Notes

### Shared Firebase Auth
Firebase Auth is **shared** between CRM and Inventory. A user with `john@example.com` in CRM can also be an employee in Inventory. User profiles are stored in different collections:
- CRM: `users/{uid}`
- Inventory: `inventoryUsers/{uid}`

### Invitation-Based Employee Onboarding
**IMPORTANT**: Employees cannot self-register. They must be invited by a Master (business owner).

**Why?** `createUserWithEmailAndPassword` fails if email exists anywhere in Firebase Auth (including CRM accounts). The invitation system solves this.

**Flow:**
1. Master calls `createEmployee()` → Creates invitation in `employeeInvitations` collection with unique 8-char code
2. Employee receives code/link → Visits `/inventory/signup?type=employee&code=XXXXXXXX`
3. Employee calls `signupEmployee()` → Creates new auth OR signs in existing, then creates `inventoryUsers` profile

### Role-Based Access
Inventory has two roles:
- `master` - Full access, manages stores/products/employees
- `member` - Limited to assigned store's POS

## Data Flow Patterns

### CRM
```
AuthContext → useCustomers hook → DashboardPage → CustomerForm/CustomerTable
```

### Inventory
```
InventoryAuthContext → useStores/useProducts/useEmployees hooks → Management Pages
                    → usePOS hook → MemberPOS (for employees)
```

## Key Patterns

### Multi-tenant Isolation
All documents include `ownerUid` field. Queries filter by `currentUser.uid`. Firestore rules enforce ownership.

### Real-time Sync
Hooks use Firestore `onSnapshot` for live updates.

### Protected Routes
- CRM: `ProtectedRoute` checks `currentUser` AND `emailVerified`
- Inventory: `InventoryProtectedRoute` checks user AND role

## Directory Structure

```
src/
├── context/
│   ├── AuthContext.jsx          # CRM auth
│   ├── InventoryAuthContext.jsx # Inventory auth + invitation system
│   └── ThemeContext.jsx
├── hooks/
│   ├── useCustomers.js          # CRM CRUD
│   ├── useStores.js             # Inventory stores
│   ├── useProducts.js           # Inventory products
│   ├── useEmployees.js          # Uses createEmployee from context
│   ├── useSales.js              # Sales tracking
│   └── usePOS.js                # Point of Sale logic
├── pages/
│   ├── inventory/               # All inventory pages
│   └── ...                      # CRM pages
├── components/
│   ├── inventory/               # Inventory-specific components
│   └── ...                      # CRM components
└── styles/
    ├── theme.css                # CSS variables (bluish theme)
    ├── landing.css              # Landing page animations
    └── inventory.css            # Inventory system styles
```

## Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | CRM user profiles | email, displayName |
| `customers` | CRM customer records | ownerUid, name, email, phone |
| `inventoryUsers` | Inventory user profiles | role (master/member), ownerUid (for members) |
| `employees` | Employee records (easy querying) | ownerUid, assignedStoreId, uid |
| `employeeInvitations` | Pending invitations | inviteCode, email, status |
| `stores` | Store locations | ownerUid, name, address |
| `products` | Product catalog | ownerUid, storeId, price, stockQuantity |
| `sales` | Sales transactions | ownerUid, storeId, items[], total |
| `stockMovements` | Stock change history | type, quantity, reason |

## Common Tasks

### Adding a New Employee (from Master dashboard)
```javascript
// In EmployeeManagement.jsx
const { createEmployee } = useEmployees();
const result = await createEmployee({ name, email, phone, storeId, storeName });
// result.inviteCode contains the 8-char code to share
```

### Employee Completing Signup
```javascript
// In InventorySignupPage.jsx
const { signupEmployee, checkInvitation } = useInventoryAuth();

// First validate the code
const { valid, invitation } = await checkInvitation(inviteCode);

// Then complete signup
await signupEmployee(email, password, inviteCode);
```

### Checking User Role
```javascript
const { isMaster, isMember, userProfile } = useInventoryAuth();
if (isMaster()) { /* show admin features */ }
if (isMember()) { /* show POS only */ }
```

## Firestore Rules Key Points

1. **employees collection**: Allows BOTH master creation AND self-creation (for invite flow where `employeeId == request.auth.uid`)
2. **employeeInvitations**: Public read (for validation), update restricted to status fields
3. **products/sales**: Members can only access their assigned store's data

## Development Commands

```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run test          # Run Vitest
firebase deploy       # Deploy everything
firebase deploy --only firestore:rules  # Deploy rules only
```

## Troubleshooting

### "Missing or insufficient permissions"
- Check Firestore rules match the operation
- For employee signup: ensure rules allow self-creation in `employees` collection
- For invitation update: ensure rules allow status field updates

### "Email already in use" during employee creation
- This is expected if using the OLD direct creation method
- Use the invitation system instead (`createEmployee` creates invitation, not auth account)

### Employee can't access POS
- Check `inventoryUsers` document has correct `assignedStoreId`
- Verify `employees` document exists with matching `uid`
- Ensure `isActive` is true

## Full Documentation
See [DOCUMENTATION.md](../DOCUMENTATION.md) for complete reference.
All Firebase config uses `VITE_` prefix (Vite requirement). See `.env` for required keys:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.

### Firestore Security Rules
Rules in [firestore.rules](firestore.rules) enforce:
- Users can only CRUD their own `/customers` documents (via `ownerUid` match)
- User profiles stored at `/users/{uid}` - only owner access

### Adding New Collections
1. Add Firestore rules in `firestore.rules` with `isOwner()` helper
2. Create hook in `src/hooks/` following `useCustomers` pattern
3. Include `ownerUid: currentUser.uid` on all writes

## Component Patterns

### CustomerForm
Large form (~600 lines) with two modes: minimal and detailed. Uses localStorage autosave. Dropdown constants defined at top of file - extend these arrays for new options.

### Status Workflow
Customer status progresses through: `Device Received → Under Diagnosis → Waiting for Parts → Repair in Progress → Quality Check → Ready for Pickup → Delivered`

## CI/CD
GitHub Actions deploys to Firebase Hosting on `main` merge. Tests must pass before deploy. Firebase secrets stored in GitHub repo secrets.
