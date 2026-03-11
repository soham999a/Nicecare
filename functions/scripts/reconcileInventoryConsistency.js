import 'dotenv/config';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';

const COLLECTIONS = {
  INVENTORY_INTERNAL_USER_PROFILES: 'inventoryInternalUserProfiles',
  STORE_STAFF_ASSIGNMENTS: 'storeStaffAssignments',
  BUSINESS_STORE_LOCATIONS: 'businessStoreLocations',
  INVENTORY_PRODUCT_CATALOG: 'inventoryProductCatalog',
};

function parseArgs(argv) {
  const options = {
    write: false,
    ownerUid: null,
  };

  for (const arg of argv) {
    if (arg === '--write') {
      options.write = true;
    } else if (arg.startsWith('--ownerUid=')) {
      options.ownerUid = arg.slice('--ownerUid='.length).trim() || null;
    }
  }

  return options;
}

function initAdmin() {
  if (getApps().length > 0) return;

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialPath && existsSync(credentialPath)) {
    const serviceAccount = JSON.parse(readFileSync(credentialPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
}

function byOwner(data, ownerUid) {
  if (!ownerUid) return data;
  return data.filter((item) => item.ownerUid === ownerUid);
}

async function readCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  initAdmin();
  const db = getFirestore();

  const [storesAll, employeesAll, productsAll, inventoryUsersAll] = await Promise.all([
    readCollection(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS),
    readCollection(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS),
    readCollection(db, COLLECTIONS.INVENTORY_PRODUCT_CATALOG),
    readCollection(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES),
  ]);

  const stores = byOwner(storesAll, options.ownerUid);
  const employees = byOwner(employeesAll, options.ownerUid);
  const products = byOwner(productsAll, options.ownerUid);
  const inventoryUsers = byOwner(inventoryUsersAll, options.ownerUid);

  const storesById = new Map(stores.map((store) => [store.id, store]));
  const employeeCountByStore = {};
  const productCountByStore = {};
  const managerByStore = {};
  const managerTimestampByStore = {};

  for (const employee of employees) {
    const storeId = employee.assignedStoreId;
    if (!storeId) continue;

    employeeCountByStore[storeId] = (employeeCountByStore[storeId] || 0) + 1;

    if (employee.role === 'manager') {
      const candidateName = employee.displayName || employee.name || '';
      if (!candidateName) continue;
      const candidateTs = Math.max(toMillis(employee.updatedAt), toMillis(employee.createdAt));
      const currentTs = managerTimestampByStore[storeId] || 0;
      if (candidateTs >= currentTs) {
        managerByStore[storeId] = candidateName;
        managerTimestampByStore[storeId] = candidateTs;
      }
    }
  }

  for (const product of products) {
    if (!product.storeId) continue;
    productCountByStore[product.storeId] = (productCountByStore[product.storeId] || 0) + 1;
  }

  const plannedStoreUpdates = [];
  const plannedEmployeeUpdates = [];
  const plannedProductUpdates = [];
  const plannedInventoryUserUpdates = [];

  for (const store of stores) {
    const expectedEmployeeCount = employeeCountByStore[store.id] || 0;
    const expectedProductCount = productCountByStore[store.id] || 0;
    const expectedManager = managerByStore[store.id] || '';

    const updates = {};
    if ((store.employeeCount || 0) !== expectedEmployeeCount) updates.employeeCount = expectedEmployeeCount;
    if ((store.productCount || 0) !== expectedProductCount) updates.productCount = expectedProductCount;
    if ((store.manager || '') !== expectedManager) updates.manager = expectedManager;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      plannedStoreUpdates.push({ id: store.id, updates });
    }
  }

  for (const employee of employees) {
    if (!employee.assignedStoreId) continue;
    const store = storesById.get(employee.assignedStoreId);
    if (!store?.name) continue;
    if ((employee.assignedStoreName || '') !== store.name) {
      plannedEmployeeUpdates.push({
        id: employee.id,
        updates: { assignedStoreName: store.name, updatedAt: new Date() },
      });
    }
  }

  for (const product of products) {
    if (!product.storeId) continue;
    const store = storesById.get(product.storeId);
    if (!store?.name) continue;
    if ((product.storeName || '') !== store.name) {
      plannedProductUpdates.push({
        id: product.id,
        updates: { storeName: store.name, updatedAt: new Date() },
      });
    }
  }

  for (const user of inventoryUsers) {
    if (!['manager', 'member'].includes(user.role)) continue;
    if (!user.assignedStoreId) continue;
    const store = storesById.get(user.assignedStoreId);
    if (!store?.name) continue;
    if ((user.assignedStoreName || '') !== store.name) {
      plannedInventoryUserUpdates.push({
        id: user.id,
        updates: { assignedStoreName: store.name, updatedAt: new Date() },
      });
    }
  }

  const summary = {
    mode: options.write ? 'write' : 'dry-run',
    ownerUid: options.ownerUid || 'all',
    scanned: {
      stores: stores.length,
      employees: employees.length,
      products: products.length,
      inventoryUsers: inventoryUsers.length,
    },
    changesDetected: {
      stores: plannedStoreUpdates.length,
      employees: plannedEmployeeUpdates.length,
      products: plannedProductUpdates.length,
      inventoryUsers: plannedInventoryUserUpdates.length,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!options.write) {
    console.log('\nDry run complete. Re-run with --write to apply fixes.');
    return;
  }

  const writer = db.bulkWriter();

  for (const item of plannedStoreUpdates) {
    writer.set(db.collection(COLLECTIONS.BUSINESS_STORE_LOCATIONS).doc(item.id), item.updates, { merge: true });
  }
  for (const item of plannedEmployeeUpdates) {
    writer.set(db.collection(COLLECTIONS.STORE_STAFF_ASSIGNMENTS).doc(item.id), item.updates, { merge: true });
  }
  for (const item of plannedProductUpdates) {
    writer.set(db.collection(COLLECTIONS.INVENTORY_PRODUCT_CATALOG).doc(item.id), item.updates, { merge: true });
  }
  for (const item of plannedInventoryUserUpdates) {
    writer.set(db.collection(COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES).doc(item.id), item.updates, { merge: true });
  }

  await writer.close();
  console.log('\nConsistency reconciliation complete.');
}

main().catch((error) => {
  console.error('\nConsistency reconciliation failed.');
  console.error(error);
  process.exit(1);
});
