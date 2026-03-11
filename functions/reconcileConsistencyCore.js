import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from './firestoreCollections.js';

const STORE_SCOPED_ROLES = new Set(['manager', 'member']);

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
};

const mapSnapshot = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const PREVIEW_LIMIT = 25;

const summarizePreviewItems = (items) =>
  items.slice(0, PREVIEW_LIMIT).map(({ id, updates }) => {
    const sanitizedUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'updatedAt') sanitizedUpdates[key] = value;
    });
    return {
      id,
      fields: Object.keys(sanitizedUpdates),
      updates: sanitizedUpdates,
    };
  });

export async function reconcileInventoryConsistency(db, { ownerUid, apply = false } = {}) {
  if (!ownerUid) throw new Error('ownerUid is required');

  const [storesSnap, employeesSnap, productsSnap, usersSnap] = await Promise.all([
    db.collection(COLLECTIONS.BUSINESS_STORE_LOCATIONS).where('ownerUid', '==', ownerUid).get(),
    db.collection(COLLECTIONS.STORE_STAFF_ASSIGNMENTS).where('ownerUid', '==', ownerUid).get(),
    db.collection(COLLECTIONS.INVENTORY_PRODUCT_CATALOG).where('ownerUid', '==', ownerUid).get(),
    db.collection(COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES).where('ownerUid', '==', ownerUid).get(),
  ]);

  const stores = mapSnapshot(storesSnap);
  const employees = mapSnapshot(employeesSnap);
  const products = mapSnapshot(productsSnap);
  const inventoryUsers = mapSnapshot(usersSnap);

  const storesById = new Map(stores.map((store) => [store.id, store]));
  const employeeCountByStore = {};
  const productCountByStore = {};
  const managerByStore = {};
  const managerTsByStore = {};

  for (const employee of employees) {
    if (!employee.assignedStoreId) continue;
    employeeCountByStore[employee.assignedStoreId] = (employeeCountByStore[employee.assignedStoreId] || 0) + 1;

    if (employee.role === 'manager') {
      const managerName = employee.displayName || employee.name || '';
      if (!managerName) continue;
      const ts = Math.max(toMillis(employee.updatedAt), toMillis(employee.createdAt));
      const currentTs = managerTsByStore[employee.assignedStoreId] || 0;
      if (ts >= currentTs) {
        managerByStore[employee.assignedStoreId] = managerName;
        managerTsByStore[employee.assignedStoreId] = ts;
      }
    }
  }

  for (const product of products) {
    if (!product.storeId) continue;
    productCountByStore[product.storeId] = (productCountByStore[product.storeId] || 0) + 1;
  }

  const planned = {
    stores: [],
    employees: [],
    products: [],
    inventoryUsers: [],
  };

  for (const store of stores) {
    const expectedEmployeeCount = employeeCountByStore[store.id] || 0;
    const expectedProductCount = productCountByStore[store.id] || 0;
    const expectedManager = managerByStore[store.id] || '';
    const updates = {};

    if ((store.employeeCount || 0) !== expectedEmployeeCount) updates.employeeCount = expectedEmployeeCount;
    if ((store.productCount || 0) !== expectedProductCount) updates.productCount = expectedProductCount;
    if ((store.manager || '') !== expectedManager) updates.manager = expectedManager;

    if (Object.keys(updates).length) {
      updates.updatedAt = FieldValue.serverTimestamp();
      planned.stores.push({ id: store.id, updates });
    }
  }

  for (const employee of employees) {
    if (!employee.assignedStoreId) continue;
    const store = storesById.get(employee.assignedStoreId);
    if (!store?.name) continue;
    if ((employee.assignedStoreName || '') !== store.name) {
      planned.employees.push({
        id: employee.id,
        updates: {
          assignedStoreName: store.name,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }
  }

  for (const product of products) {
    if (!product.storeId) continue;
    const store = storesById.get(product.storeId);
    if (!store?.name) continue;
    if ((product.storeName || '') !== store.name) {
      planned.products.push({
        id: product.id,
        updates: {
          storeName: store.name,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }
  }

  for (const user of inventoryUsers) {
    if (!STORE_SCOPED_ROLES.has(user.role)) continue;
    if (!user.assignedStoreId) continue;
    const store = storesById.get(user.assignedStoreId);
    if (!store?.name) continue;
    if ((user.assignedStoreName || '') !== store.name) {
      planned.inventoryUsers.push({
        id: user.id,
        updates: {
          assignedStoreName: store.name,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }
  }

  const summary = {
    mode: apply ? 'write' : 'dry-run',
    ownerUid,
    scanned: {
      stores: stores.length,
      employees: employees.length,
      products: products.length,
      inventoryUsers: inventoryUsers.length,
    },
    changesDetected: {
      stores: planned.stores.length,
      employees: planned.employees.length,
      products: planned.products.length,
      inventoryUsers: planned.inventoryUsers.length,
    },
    totalChangesDetected:
      planned.stores.length +
      planned.employees.length +
      planned.products.length +
      planned.inventoryUsers.length,
  };

  const details = {
    previewLimit: PREVIEW_LIMIT,
    stores: summarizePreviewItems(planned.stores),
    employees: summarizePreviewItems(planned.employees),
    products: summarizePreviewItems(planned.products),
    inventoryUsers: summarizePreviewItems(planned.inventoryUsers),
    truncated: {
      stores: planned.stores.length > PREVIEW_LIMIT,
      employees: planned.employees.length > PREVIEW_LIMIT,
      products: planned.products.length > PREVIEW_LIMIT,
      inventoryUsers: planned.inventoryUsers.length > PREVIEW_LIMIT,
    },
  };

  if (!apply) {
    return { applied: false, summary, details };
  }

  const writer = db.bulkWriter();
  planned.stores.forEach(({ id, updates }) => {
    writer.set(db.collection(COLLECTIONS.BUSINESS_STORE_LOCATIONS).doc(id), updates, { merge: true });
  });
  planned.employees.forEach(({ id, updates }) => {
    writer.set(db.collection(COLLECTIONS.STORE_STAFF_ASSIGNMENTS).doc(id), updates, { merge: true });
  });
  planned.products.forEach(({ id, updates }) => {
    writer.set(db.collection(COLLECTIONS.INVENTORY_PRODUCT_CATALOG).doc(id), updates, { merge: true });
  });
  planned.inventoryUsers.forEach(({ id, updates }) => {
    writer.set(db.collection(COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES).doc(id), updates, { merge: true });
  });
  await writer.close();

  return {
    applied: true,
    summary,
    details,
    appliedCounts: { ...summary.changesDetected },
  };
}
