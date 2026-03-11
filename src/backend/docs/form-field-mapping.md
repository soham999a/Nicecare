# Form Field to Firestore Mapping

This document maps each inventory UI form to the Firestore collections and fields that are read or written. Use it for onboarding, debugging, and to keep forms and backend in sync.

---

## Employee Management (`EmployeeManagement.jsx`)

**Route:** `/inventory/employees` (master only)

**Form state keys:** `name`, `email`, `phone`, `storeId`, `storeName`

| Form field | Firestore collection | Firestore field | Notes |
|------------|----------------------|-----------------|-------|
| `name` | `employees` | `displayName` | UI label "Name" |
| `email` | `employees` / `employeeInvitations` | `email` | Required for new employees; used in invitation |
| `phone` | `employees` | `phone` | |
| `storeId` | `employees` | `assignedStoreId` | UI label "Store"; required |
| `storeName` | `employees` | `assignedStoreName` | Set from selected store |

**Create flow:** Submitting a new employee calls `InventoryAuthContext.createEmployee`, which writes to `employeeInvitations` and returns an invite code. The actual `employees` document is created when the employee completes signup. Store `employeeCount` is updated when the employee is created/updated/deleted.

**Update flow:** `updateEmployee(employeeId, { displayName, phone, assignedStoreId, assignedStoreName })`. If the employee has a `uid`, `inventoryUsers/{uid}` is also updated. Store counts are adjusted when `assignedStoreId` changes.

**Delete:** Removes `employees` document and decrements the store’s `employeeCount`.

---

## Product Management (`ProductManagement.jsx`)

**Route:** `/inventory/products` (master only)

**Form state keys:** `name`, `sku`, `category`, `description`, `price`, `cost`, `quantity`, `lowStockThreshold`, `storeId`, `storeName`

| Form field | Firestore collection | Firestore field | Notes |
|------------|----------------------|-----------------|-------|
| `name` | `products` | `name` | Required |
| `sku` | `products` | `sku` | |
| `category` | `products` | `category` | Dropdown (e.g. Electronics, Parts) |
| `description` | `products` | `description` | |
| `price` | `products` | `price` | `parseFloat`; required, min 0 |
| `cost` | `products` | `cost` | `parseFloat` |
| `quantity` | `products` | `quantity` | `parseInt`; default 0 |
| `lowStockThreshold` | `products` | `lowStockThreshold` | Default 10 |
| `storeId` | `products` | `storeId` | Required; from store dropdown |
| `storeName` | `products` | `storeName` | Set when store is selected |

**Create:** `addProduct(productData)` → `products` + increment store `productCount`.

**Update:** `updateProduct(id, updates)`. If `storeId` changes, old store’s `productCount` is decremented and new store’s incremented.

**Stock update (modal):** `updateStock(productId, quantityChange, reason)` → updates `products.quantity` and appends a document to `stockMovements`.

**Delete:** Removes product and decrements store `productCount`.

---

## Store Management (`StoreManagement.jsx`)

**Route:** `/inventory/stores` (master only)

**Form state keys:** `name`, `address`, `phone`, `email`, `manager`

| Form field | Firestore collection | Firestore field | Notes |
|------------|----------------------|-----------------|-------|
| `name` | `stores` | `name` | Required |
| `address` | `stores` | `address` | |
| `phone` | `stores` | `phone` | |
| `email` | `stores` | `email` | |
| `manager` | `stores` | `manager` | Free text |

**Computed on create:** `ownerUid` (current user), `employeeCount: 0`, `productCount: 0`, `createdAt`, `updatedAt`.

**Update:** All form fields map directly; `updatedAt` set on save.

**Delete:** Deletes store document. No cascade; ensure no employees/products are assigned first (or add guards in app).

---

## Sales Reports (`SalesReports.jsx`)

**Route:** `/inventory/sales` (master only)

This page does not create documents; it filters and reads `sales` for reporting.

| UI control | Used in query | Firestore field | Notes |
|------------|----------------|-----------------|-------|
| `filterStore` | `getSalesReport(..., filterStoreId)` | `storeId` | Optional store filter |
| `dateRange.start` | `getSalesReport(startDate, ...)` | `createdAt` | `>= startDate` |
| `dateRange.end` | `getSalesReport(..., endDate)` | `createdAt` | `<= endDate` |

**Data source:** `useSales(filterStore, dateRange)` subscribes to `sales` with `ownerUid`, optional `storeId`, and date range on `createdAt`. `getSalesReport(startDate, endDate, filterStoreId)` runs a one-time query and returns aggregated stats (`totalRevenue`, `paymentMethodBreakdown`, `dailyRevenue`).

---

## POS / Create Sale

Sales are created from the POS flow (e.g. `MemberPOS.jsx` or equivalent). The payload to `createSale` includes `storeId`, `customerName`, `customerPhone`, `items`, `itemCount`, `total`, `paymentMethod`. The hook/repository adds `ownerUid`, `employeeId`, `employeeName`, `status: 'completed'`, and `createdAt`. After creating the sale, the app calls `bulkUpdateStock` to decrement product quantities.

---

## Summary table (form → Firestore)

| Page | Form field | Collection | Firestore field |
|------|------------|------------|-----------------|
| EmployeeManagement | name | employees | displayName |
| EmployeeManagement | storeId | employees | assignedStoreId |
| EmployeeManagement | storeName | employees | assignedStoreName |
| ProductManagement | (all listed above) | products | (same names) |
| StoreManagement | (all listed above) | stores | (same names) |
| SalesReports | filterStore | sales (query) | storeId |
| SalesReports | dateRange | sales (query) | createdAt |

For full collection and field descriptions, see [firestore-models.md](./firestore-models.md).
