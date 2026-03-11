/**
 * Document field contracts for Firestore collections.
 * These describe the shape of documents as written by the app (not exhaustive for reads).
 * See docs/firestore-models.md for full documentation.
 */

import { COLLECTIONS } from './collections';

/** @typedef {Object} StoreDocument
 * @property {string} [id] - Document ID (only when read)
 * @property {string} ownerUid
 * @property {string} name
 * @property {string} [address]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [manager]
 * @property {number} employeeCount
 * @property {number} productCount
 * @property {import('firebase/firestore').FieldValue} createdAt
 * @property {import('firebase/firestore').FieldValue} updatedAt
 */

/** @typedef {Object} ProductDocument
 * @property {string} [id]
 * @property {string} ownerUid
 * @property {string} name
 * @property {string} [sku]
 * @property {string} [category]
 * @property {string} [description]
 * @property {number} price
 * @property {number} cost
 * @property {number} quantity
 * @property {number} lowStockThreshold
 * @property {string} storeId
 * @property {string} storeName
 * @property {import('firebase/firestore').FieldValue} createdAt
 * @property {import('firebase/firestore').FieldValue} updatedAt
 */

/** @typedef {Object} EmployeeDocument
 * @property {string} [id]
 * @property {string} ownerUid
 * @property {string} [uid] - Set after employee signs up (links to inventoryInternalUserProfiles)
 * @property {string} displayName - (Form field: name)
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [role] - 'manager' | 'member'
 * @property {string} [assignedStoreId] - (Form field: storeId)
 * @property {string} [assignedStoreName] - (Form field: storeName)
 * @property {boolean} [isActive]
 * @property {import('firebase/firestore').FieldValue} [createdAt]
 * @property {import('firebase/firestore').FieldValue} [updatedAt]
 */

/** @typedef {Object} SaleDocument
 * @property {string} [id]
 * @property {string} ownerUid
 * @property {string} employeeId
 * @property {string} employeeName
 * @property {string} storeId
 * @property {string} [customerName]
 * @property {string} [customerPhone]
 * @property {Array<{productId:string,name:string,quantity:number,price:number}>} items
 * @property {number} itemCount
 * @property {number} total
 * @property {string} [paymentMethod]
 * @property {string} status
 * @property {import('firebase/firestore').FieldValue} createdAt
 */

/** @typedef {Object} StockMovementDocument
 * @property {string} productId
 * @property {string} productName
 * @property {string} storeId
 * @property {string} ownerUid
 * @property {number} previousQuantity
 * @property {number} newQuantity
 * @property {number} change
 * @property {string} [reason]
 * @property {string} performedBy
 * @property {string} performedByName
 * @property {import('firebase/firestore').FieldValue} createdAt
 */

/** @typedef {Object} EmployeeInvitationDocument
 * @property {string} email
 * @property {string} [name]
 * @property {string} [phone]
 * @property {string} [role] - 'manager' | 'member'
 * @property {string} [assignedStoreId]
 * @property {string} [assignedStoreName]
 * @property {string} inviteCode
 * @property {string} [ownerUid]
 * @property {string} [ownerBusinessName]
 * @property {string} [status] - 'pending' | 'accepted' | 'expired'
 * @property {import('firebase/firestore').FieldValue} [createdAt]
 * @property {Date|import('firebase/firestore').FieldValue} [expiresAt]
 * @property {import('firebase/firestore').FieldValue} [acceptedAt]
 * @property {string} [acceptedByUid]
 */

export const SCHEMAS = {
  [COLLECTIONS.BUSINESS_STORE_LOCATIONS]: /** @type {StoreDocument} */ ({}),
  [COLLECTIONS.INVENTORY_PRODUCT_CATALOG]: /** @type {ProductDocument} */ ({}),
  [COLLECTIONS.STORE_STAFF_ASSIGNMENTS]: /** @type {EmployeeDocument} */ ({}),
  [COLLECTIONS.SALES_TRANSACTION_RECORDS]: /** @type {SaleDocument} */ ({}),
  [COLLECTIONS.INVENTORY_STOCK_MOVEMENT_LOGS]: /** @type {StockMovementDocument} */ ({}),
  [COLLECTIONS.STAFF_ONBOARDING_INVITATIONS]: /** @type {EmployeeInvitationDocument} */ ({}),
};
