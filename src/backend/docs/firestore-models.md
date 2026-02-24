# Firestore Collections & Field Glossary

This document describes the Firestore collections and document fields used by the Inventory Management POS app. Use it for onboarding, debugging, and keeping frontend/backend in sync.

---

## stores

Stores represent physical locations (e.g. retail branches).

| Field | Type | Description |
|-------|------|-------------|
| `ownerUid` | string | Firebase UID of the business owner (master). Set on create. |
| `name` | string | Store name (required). |
| `address` | string | Optional address. |
| `phone` | string | Optional phone. |
| `email` | string | Optional email. |
| `manager` | string | Optional manager name (free text). |
| `employeeCount` | number | Number of employees assigned. Maintained by employee create/update/delete. |
| `productCount` | number | Number of products assigned. Maintained by product create/update/delete. |
| `createdAt` | timestamp | Server timestamp on create. |
| `updatedAt` | timestamp | Server timestamp on every update. |

**Queries:** `where('ownerUid', '==', currentUser.uid)`, `orderBy('createdAt', 'desc')`.

**Written by:** `useStores` → `storesRepository` (add/update/delete). Counts updated by products and employees repositories.

---

## products

Products are SKU-level items that can be assigned to a store and have stock.

| Field | Type | Description |
|-------|------|-------------|
| `ownerUid` | string | Owner UID (master). For members, set to master's UID. |
| `name` | string | Product name (required). |
| `sku` | string | Optional SKU. |
| `barcode` | string | Optional barcode. |
| `category` | string | Optional category (e.g. Electronics, Parts). |
| `description` | string | Optional description. |
| `price` | number | Selling price. |
| `cost` | number | Cost price. |
| `quantity` | number | Current stock. |
| `lowStockThreshold` | number | Alert when quantity ≤ this (default 10). |
| `storeId` | string | Document ID of the assigned store. |
| `storeName` | string | Denormalized store name. |
| `createdAt` | timestamp | Server timestamp on create. |
| `updatedAt` | timestamp | Server timestamp on update. |

**Queries:** By `ownerUid`; optionally `where('storeId', '==', storeId)`; `orderBy('createdAt', 'desc')`. Members see only their assigned store's products.

**Written by:** `useProducts` → `productsRepository`. Creating/updating/deleting a product updates the store's `productCount`.

---

## employees

Employees are store staff. Creation is invitation-based (see `employeeInvitations` and `InventoryAuthContext.createEmployee`).

| Field | Type | Description |
|-------|------|-------------|
| `ownerUid` | string | Master UID. |
| `uid` | string | Set after employee signs up; links to Firebase Auth and `inventoryUsers`. |
| `displayName` | string | Full name. **Form field in UI is `name`.** |
| `email` | string | Email (used in invitation). |
| `phone` | string | Optional phone. |
| `assignedStoreId` | string | Store document ID. **Form field in UI is `storeId`.** |
| `assignedStoreName` | string | Denormalized store name. **Form field in UI is `storeName`.** |
| `isActive` | boolean | Whether the employee is active. |
| `createdAt` | timestamp | Server timestamp. |
| `updatedAt` | timestamp | Server timestamp. |

**Queries:** `where('ownerUid', '==', currentUser.uid)`, `orderBy('createdAt', 'desc')`. Master only.

**Written by:** Invitation flow writes `employeeInvitations`; employee record created on signup. Updates via `useEmployees` → `employeesRepository`. When `uid` exists, `inventoryUsers/{uid}` is also updated for profile sync. Store `employeeCount` is updated on create/update/delete.

---

## sales

Each sale is a completed transaction (e.g. from POS).

| Field | Type | Description |
|-------|------|-------------|
| `ownerUid` | string | Master UID (for members, the hiring master). |
| `employeeId` | string | UID of the employee who made the sale. |
| `employeeName` | string | Denormalized employee name. |
| `storeId` | string | Store where the sale occurred. |
| `customerName` | string | Optional customer name. |
| `customerPhone` | string | Optional customer phone. |
| `items` | array | Array of `{ productId, name, quantity, price }`. |
| `itemCount` | number | Total item count. |
| `total` | number | Total amount. |
| `paymentMethod` | string | e.g. Cash, Card. |
| `status` | string | e.g. `'completed'`. |
| `createdAt` | timestamp | Server timestamp. |

**Queries:** By `ownerUid`; optionally `storeId` and date range on `createdAt`; `orderBy('createdAt', 'desc')`.

**Written by:** `useSales` → `salesRepository.createSale`. POS uses `createSale` then `bulkUpdateStock` to decrement product quantities.

---

## stockMovements

Audit log for product quantity changes (manual adjustments or after a sale).

| Field | Type | Description |
|-------|------|-------------|
| `productId` | string | Product document ID. |
| `productName` | string | Denormalized name. |
| `storeId` | string | Store ID. |
| `ownerUid` | string | Master UID. |
| `previousQuantity` | number | Quantity before change. |
| `newQuantity` | number | Quantity after change. |
| `change` | number | Delta (positive or negative). |
| `reason` | string | Optional reason (e.g. Restock, Damaged). |
| `performedBy` | string | UID of user who made the change. |
| `performedByName` | string | Display name. |
| `createdAt` | timestamp | Server timestamp. |

**Written by:** `productsRepository.updateStock` (and optionally bulk operations if logged).

---

## employeeInvitations

Invitation records for new employees. When master "creates" an employee, an invitation is written with a code; the employee signs up with that code and then an `employees` (and `inventoryUsers`) document is created.

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Invitee email. |
| `inviteCode` | string | Unique code for signup. |
| `ownerUid` | string | Master UID. |
| `createdAt` | timestamp | Server timestamp. |

**Written by:** `InventoryAuthContext.createEmployee` (and related auth flow).

---

## inventoryUsers

Per-user profile for inventory app (role, assigned store, etc.). Synced when an employee signs up or when profile is updated.

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | string | Full name. |
| `role` | string | `'master'` or `'member'`. |
| `assignedStoreId` | string | For members, their store. |
| `assignedStoreName` | string | Denormalized store name. |
| `ownerUid` / `masterUid` | string | For members, the master UID. |
| `updatedAt` | timestamp | Server timestamp. |

**Written by:** Auth/signup flow and `employeesRepository.updateEmployee` when syncing from `employees`.

---

## chatFeedback

Stores thumbs up/down and optional comments for chatbot responses (Cloud Function `submitFeedback`).

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase UID. |
| `messageId` | string | Unique message ID from frontend. |
| `question` | string | User question. |
| `answer` | string | Truncated AI response. |
| `rating` | string | `'up'` or `'down'`. |
| `comment` | string | Optional. |
| `module` | string | `'crm'` or `'inventory'`. |
| `createdAt` / `updatedAt` | timestamp | Server timestamps. |

**Written by:** Cloud Function `submitFeedback` (writes to `chatFeedback` collection).
