/**
 * UI form field -> Firestore collection/field mappings.
 * Use for onboarding, docs, and keeping form submit logic aligned with backend.
 * See docs/form-field-mapping.md for full documentation.
 */

import { COLLECTIONS } from '../firestore/collections';

/**
 * EmployeeManagement form: form field names -> Firestore fields.
 * Create: employeeInvitations (email, inviteCode) + employees record created on signup.
 * Update: employees (and inventoryUsers when employee has uid).
 */
export const EMPLOYEE_FORM_TO_FIRESTORE = {
  formPage: 'EmployeeManagement',
  collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS,
  createVia: 'InventoryAuthContext.createEmployee (writes staffOnboardingInvitations then storeStaffAssignments)',
  mappings: [
    { formField: 'name', firestoreField: 'displayName', collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS, notes: 'UI uses "name"' },
    { formField: 'email', firestoreField: 'email', collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS, notes: 'Also used in staffOnboardingInvitations' },
    { formField: 'phone', firestoreField: 'phone', collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS },
    { formField: 'storeId', firestoreField: 'assignedStoreId', collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS, notes: 'UI uses "storeId"' },
    { formField: 'storeName', firestoreField: 'assignedStoreName', collection: COLLECTIONS.STORE_STAFF_ASSIGNMENTS, notes: 'UI uses "storeName"' },
  ],
};

/**
 * ProductManagement form -> products (and store productCount, stockMovements on stock update).
 */
export const PRODUCT_FORM_TO_FIRESTORE = {
  formPage: 'ProductManagement',
  collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG,
  mappings: [
    { formField: 'name', firestoreField: 'name', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
    { formField: 'sku', firestoreField: 'sku', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
    { formField: 'category', firestoreField: 'category', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
    { formField: 'description', firestoreField: 'description', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
    { formField: 'price', firestoreField: 'price', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG, notes: 'parseFloat' },
    { formField: 'cost', firestoreField: 'cost', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG, notes: 'parseFloat' },
    { formField: 'quantity', firestoreField: 'quantity', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG, notes: 'parseInt, default 0' },
    { formField: 'lowStockThreshold', firestoreField: 'lowStockThreshold', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG, notes: 'default 10' },
    { formField: 'storeId', firestoreField: 'storeId', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
    { formField: 'storeName', firestoreField: 'storeName', collection: COLLECTIONS.INVENTORY_PRODUCT_CATALOG },
  ],
};

/**
 * StoreManagement form -> stores.
 */
export const STORE_FORM_TO_FIRESTORE = {
  formPage: 'StoreManagement',
  collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS,
  mappings: [
    { formField: 'name', firestoreField: 'name', collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS },
    { formField: 'address', firestoreField: 'address', collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS },
    { formField: 'phone', firestoreField: 'phone', collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS },
    { formField: 'email', firestoreField: 'email', collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS },
    { formField: 'manager', firestoreField: 'manager', collection: COLLECTIONS.BUSINESS_STORE_LOCATIONS },
  ],
  computedFields: ['ownerUid', 'employeeCount', 'productCount', 'createdAt', 'updatedAt'],
};

/**
 * SalesReports filters -> query params (not a form that writes documents).
 */
export const SALES_REPORT_FILTERS = {
  formPage: 'SalesReports',
  collection: COLLECTIONS.SALES_TRANSACTION_RECORDS,
  filterMappings: [
    { formField: 'filterStore', queryField: 'storeId', collection: COLLECTIONS.SALES_TRANSACTION_RECORDS },
    { formField: 'dateRange.start', queryField: 'createdAt', comparison: '>=', collection: COLLECTIONS.SALES_TRANSACTION_RECORDS },
    { formField: 'dateRange.end', queryField: 'createdAt', comparison: '<=', collection: COLLECTIONS.SALES_TRANSACTION_RECORDS },
  ],
};

export const FORM_MAPPINGS = {
  employees: EMPLOYEE_FORM_TO_FIRESTORE,
  products: PRODUCT_FORM_TO_FIRESTORE,
  stores: STORE_FORM_TO_FIRESTORE,
  salesReport: SALES_REPORT_FILTERS,
};
