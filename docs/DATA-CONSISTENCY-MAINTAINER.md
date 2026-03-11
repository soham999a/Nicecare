# Data Consistency Maintainer Algorithm

This document explains how the inventory consistency maintainer works, what it checks, and how maintainers should operate it safely.

## Purpose

Inventory data is partially denormalized across collections for performance and UX. Over time, write failures, manual edits, or migration side effects can create drift between:

- source-of-truth relations (assignments, products per store)
- denormalized snapshots (counts, names, manager text fields)

The maintainer algorithm detects and optionally fixes these drifts.

## Scope

The reconciler currently works for one tenant at a time (`ownerUid` = master account UID) and checks:

1. `stores.employeeCount` vs actual number of employee docs assigned to that store
2. `stores.productCount` vs actual number of product docs assigned to that store
3. `stores.manager` vs resolved manager name from `employees` assignment
4. `employees.assignedStoreName` vs canonical `stores.name`
5. `products.storeName` vs canonical `stores.name`
6. `inventoryUsers.assignedStoreName` (manager/member) vs canonical `stores.name`

## Collections involved

- `businessStoreLocations`
- `storeStaffAssignments`
- `inventoryProductCatalog`
- `inventoryInternalUserProfiles`

## Algorithm overview

Implementation lives in:

- `functions/reconcileConsistencyCore.js`

High-level flow:

1. Load all tenant documents (`ownerUid` scoped) from relevant collections.
2. Build in-memory maps:
   - `storesById`
   - `employeeCountByStore`
   - `productCountByStore`
   - `managerByStore`
3. Resolve manager per store from employee assignments:
   - include only employees with `role === 'manager'`
   - require `assignedStoreId`
   - choose latest candidate by `max(updatedAt, createdAt)` timestamp
4. Build `planned` mutations (no writes yet):
   - per store: `employeeCount`, `productCount`, `manager`
   - per employee: `assignedStoreName`
   - per product: `storeName`
   - per inventory user: `assignedStoreName`
5. Return summary always, and details preview for inspection.
6. If `apply=true`, write all planned updates using Firestore `bulkWriter`.

## Dry-run vs apply

`apply=false` (dry-run):

- no writes
- returns:
  - `summary` (counts)
  - `details` (preview of exact docs/fields to be updated)

`apply=true`:

- writes all planned changes with merge semantics
- sets `updatedAt` with `serverTimestamp()` on updated documents
- returns:
  - `summary`
  - `details`
  - `appliedCounts`

## API endpoint

Cloud Function:

- `inventoryConsistencyReconcile` in `functions/index.js`

Behavior:

- method: `POST`
- auth required
- master-only guard (`inventoryInternalUserProfiles/{uid}.role === 'master'`)
- request body:
  - `{ "apply": false }` for dry-run
  - `{ "apply": true }` for apply

Local backend parity:

- `POST /inventoryConsistencyReconcile` in `local-backend.js`

## UI integration

Dashboard integration:

- `src/pages/inventory/MasterDashboard.jsx`
- `src/hooks/useEnhancedDashboard.js`

The Data Consistency card shows:

- mismatch counts from live data
- actions:
  - **Dry Run**
  - **Apply Fix** (with confirmation modal)
- dry-run details:
  - section-wise preview (`stores`, `employees`, `products`, `inventoryUsers`)
  - doc IDs and changed fields
  - truncation indicator when preview exceeds limit

## Safety and invariants

1. Master-only execution.
2. Tenant isolation by `ownerUid`.
3. Merge updates only (no deletes).
4. Canonical source choices:
   - Store name source: `businessStoreLocations.name`
   - Manager source: `storeStaffAssignments` role-based assignment
   - Counts source: actual cardinality of related docs
5. Dry-run must remain read-only.

## Operational runbook

1. Open master dashboard for target tenant.
2. Click **Dry Run**.
3. Review:
   - total detected changes
   - per-section preview details
4. If expected, click **Apply Fix** and confirm.
5. Re-run **Dry Run** to verify drift is gone (or reduced to expected residuals).

## Troubleshooting

### 404 on dry-run/apply

- Endpoint not deployed or wrong `VITE_FUNCTIONS_URL`.
- Fix:
  - set `VITE_FUNCTIONS_URL` to the correct base URL
  - deploy function: `firebase deploy --only functions:inventoryConsistencyReconcile`

### "Backend URL is not configured"

- `VITE_FUNCTIONS_URL` missing in env.
- Add and restart Vite dev server.

### 403 from endpoint

- Current user is not a master profile in `inventoryInternalUserProfiles`.

## Extending checks safely

When adding new consistency rules:

1. Add deterministic check logic in `reconcileConsistencyCore.js`.
2. Put all candidate writes into `planned` first.
3. Include new check in `summary.changesDetected` and `details`.
4. Ensure dry-run returns complete preview.
5. Keep apply path idempotent and merge-only.
6. Update dashboard card labels if user-visible.

