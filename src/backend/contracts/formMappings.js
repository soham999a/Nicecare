/**
 * UI form field -> Firestore collection/field mappings.
 * Use for onboarding, docs, and keeping form submit logic aligned with backend.
 * See docs/form-field-mapping.md for full documentation.
 */

/**
 * EmployeeManagement form: form field names -> Firestore fields.
 * Create: employeeInvitations (email, inviteCode) + employees record created on signup.
 * Update: employees (and inventoryUsers when employee has uid).
 */
export const EMPLOYEE_FORM_TO_FIRESTORE = {
  formPage: 'EmployeeManagement',
  collection: 'employees',
  createVia: 'InventoryAuthContext.createEmployee (writes employeeInvitations then employees)',
  mappings: [
    { formField: 'name', firestoreField: 'displayName', collection: 'employees', notes: 'UI uses "name"' },
    { formField: 'email', firestoreField: 'email', collection: 'employees', notes: 'Also used in employeeInvitations' },
    { formField: 'phone', firestoreField: 'phone', collection: 'employees' },
    { formField: 'storeId', firestoreField: 'assignedStoreId', collection: 'employees', notes: 'UI uses "storeId"' },
    { formField: 'storeName', firestoreField: 'assignedStoreName', collection: 'employees', notes: 'UI uses "storeName"' },
  ],
};

/**
 * ProductManagement form -> products (and store productCount, stockMovements on stock update).
 */
export const PRODUCT_FORM_TO_FIRESTORE = {
  formPage: 'ProductManagement',
  collection: 'products',
  mappings: [
    { formField: 'name', firestoreField: 'name', collection: 'products' },
    { formField: 'sku', firestoreField: 'sku', collection: 'products' },
    { formField: 'barcode', firestoreField: 'barcode', collection: 'products' },
    { formField: 'category', firestoreField: 'category', collection: 'products' },
    { formField: 'description', firestoreField: 'description', collection: 'products' },
    { formField: 'price', firestoreField: 'price', collection: 'products', notes: 'parseFloat' },
    { formField: 'cost', firestoreField: 'cost', collection: 'products', notes: 'parseFloat' },
    { formField: 'quantity', firestoreField: 'quantity', collection: 'products', notes: 'parseInt, default 0' },
    { formField: 'lowStockThreshold', firestoreField: 'lowStockThreshold', collection: 'products', notes: 'default 10' },
    { formField: 'storeId', firestoreField: 'storeId', collection: 'products' },
    { formField: 'storeName', firestoreField: 'storeName', collection: 'products' },
  ],
};

/**
 * StoreManagement form -> stores.
 */
export const STORE_FORM_TO_FIRESTORE = {
  formPage: 'StoreManagement',
  collection: 'stores',
  mappings: [
    { formField: 'name', firestoreField: 'name', collection: 'stores' },
    { formField: 'address', firestoreField: 'address', collection: 'stores' },
    { formField: 'phone', firestoreField: 'phone', collection: 'stores' },
    { formField: 'email', firestoreField: 'email', collection: 'stores' },
    { formField: 'manager', firestoreField: 'manager', collection: 'stores' },
  ],
  computedFields: ['ownerUid', 'employeeCount', 'productCount', 'createdAt', 'updatedAt'],
};

/**
 * SalesReports filters -> query params (not a form that writes documents).
 */
export const SALES_REPORT_FILTERS = {
  formPage: 'SalesReports',
  collection: 'sales',
  filterMappings: [
    { formField: 'filterStore', queryField: 'storeId', collection: 'sales' },
    { formField: 'dateRange.start', queryField: 'createdAt', comparison: '>=', collection: 'sales' },
    { formField: 'dateRange.end', queryField: 'createdAt', comparison: '<=', collection: 'sales' },
  ],
};

export const FORM_MAPPINGS = {
  employees: EMPLOYEE_FORM_TO_FIRESTORE,
  products: PRODUCT_FORM_TO_FIRESTORE,
  stores: STORE_FORM_TO_FIRESTORE,
  salesReport: SALES_REPORT_FILTERS,
};
