/**
 * Migration history for tracking imports and supporting revoke-last functionality.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { COLLECTIONS } from '../collections';
import { deleteStore } from './storesRepository';
import { deleteProduct } from './productsRepository';
import { deleteEmployee } from './employeesRepository';

const COLLECTION = 'migrationHistory';

/**
 * @typedef {Object} MigrationSummary
 * @property {number} succeeded
 * @property {number} failed
 * @property {{ rowIndex: number; message: string }[]} [errors]
 */

/**
 * @typedef {Object} MigrationHistoryDoc
 * @property {string} id - Document ID
 * @property {string} ownerUid
 * @property {string} mode - 'single' | 'workbook'
 * @property {string} [entityId] - For single-entity mode
 * @property {string} [fileName] - Original file name if available
 * @property {Record<string, MigrationSummary>} summary - Per-entity summary
 * @property {Record<string, string[]>} createdDocIds - IDs of created documents per entity
 * @property {FirebaseFirestore.Timestamp} createdAt
 * @property {FirebaseFirestore.Timestamp} [revokedAt] - Set when migration was revoked
 */

/**
 * Save a migration run to history.
 * @param {string} ownerUid
 * @param {Object} params
 * @param {string} params.mode - 'single' | 'workbook'
 * @param {string} [params.entityId] - For single mode
 * @param {string} [params.fileName]
 * @param {Record<string, { succeeded: number; failed: number; errors?: Array<{ rowIndex: number; message: string }> }>} params.summary
 * @param {Record<string, string[]>} params.createdDocIds - { stores: [], products: [], employees: [], customers: [] }
 * @returns {Promise<string>} Document ID
 */
export async function saveMigrationHistory(ownerUid, { mode, entityId, fileName, summary, createdDocIds }) {
  const data = {
    ownerUid,
    mode,
    entityId: entityId ?? null,
    fileName: fileName ?? null,
    summary: summary ?? {},
    createdDocIds: createdDocIds ?? {},
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), data);
  return docRef.id;
}

/**
 * Get migration history for an owner, most recent first.
 * @param {string} ownerUid
 * @param {number} [maxResults=20]
 * @returns {Promise<MigrationHistoryDoc[]>}
 */
export async function getMigrationHistory(ownerUid, maxResults = 20) {
  const q = query(
    collection(db, COLLECTION),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt,
    revokedAt: d.data().revokedAt ?? null,
  }));
}

/**
 * Get the most recent migration that can be revoked (has createdDocIds and not yet revoked).
 * @param {string} ownerUid
 * @returns {Promise<MigrationHistoryDoc|null>}
 */
export async function getLastRevokableMigration(ownerUid) {
  const history = await getMigrationHistory(ownerUid, 50);
  const revokable = history.find(
    (m) => !m.revokedAt && Object.values(m.createdDocIds ?? {}).some((arr) => arr?.length > 0)
  );
  return revokable ?? null;
}

/**
 * Revoke a migration by deleting all created documents.
 * Deletion order: customers → employees → products → stores (reverse of import).
 * @param {string} migrationId
 * @param {string} ownerUid - Must match migration owner
 * @returns {Promise<{ revoked: boolean; deleted: Record<string, number> }>}
 */
export async function revokeMigration(migrationId, ownerUid) {
  const docRef = doc(db, COLLECTION, migrationId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Migration not found');
  }

  const data = snap.data();
  if (data.ownerUid !== ownerUid) {
    throw new Error('Not authorized to revoke this migration');
  }

  if (data.revokedAt) {
    return { revoked: false, deleted: {} };
  }

  const createdDocIds = data.createdDocIds ?? {};
  const deleted = { stores: 0, products: 0, employees: 0, customers: 0 };

  // Delete in reverse dependency order
  const customerIds = createdDocIds.customers ?? [];
  for (const id of customerIds) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS, id));
      deleted.customers++;
    } catch (e) {
      console.warn('Failed to delete customer', id, e);
    }
  }

  const employeeIds = createdDocIds.employees ?? [];
  for (const id of employeeIds) {
    try {
      await deleteEmployee(id);
      deleted.employees++;
    } catch (e) {
      console.warn('Failed to delete employee', id, e);
    }
  }

  const productIds = createdDocIds.products ?? [];
  for (const id of productIds) {
    try {
      await deleteProduct(id);
      deleted.products++;
    } catch (e) {
      console.warn('Failed to delete product', id, e);
    }
  }

  const storeIds = createdDocIds.stores ?? [];
  for (const id of storeIds) {
    try {
      await deleteStore(id);
      deleted.stores++;
    } catch (e) {
      console.warn('Failed to delete store', id, e);
    }
  }

  await updateDoc(docRef, {
    revokedAt: serverTimestamp(),
  });

  return { revoked: true, deleted };
}
