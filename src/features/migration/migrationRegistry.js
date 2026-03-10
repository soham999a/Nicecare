/**
 * Shared migration registry for CSV-to-Firestore import.
 * Defines per-entity field metadata, required fields, coercion rules, and computed fields.
 * Uses existing schema contracts from backend/firestore/schemas.js and backend/contracts/formMappings.js.
 */

export const ENTITY_TYPES = ['stores', 'products', 'employees', 'customers'];

/**
 * @typedef {Object} FieldMeta
 * @property {string} firestoreField - Target Firestore field name
 * @property {string} label - UI label for mapping
 * @property {'string'|'number'|'boolean'|'date'} type - Expected type for coercion
 * @property {boolean} [required] - Whether this field is required
 * @property {string} [coercion] - 'parseFloat', 'parseInt', 'date', etc.
 * @property {*} [defaultValue] - Default when missing
 */

/**
 * @typedef {Object} EntitySpec
 * @property {string} id - Entity type id
 * @property {string} collection - Firestore collection name
 * @property {string} label - Display label
 * @property {FieldMeta[]} fields - Mappable fields
 * @property {string[]} requiredFields - Firestore field names that must be present
 * @property {string[]} computedFields - Fields set by the importer, not from CSV
 */

/** @type {Record<string, EntitySpec>} */
export const MIGRATION_ENTITY_SPECS = {
  stores: {
    id: 'stores',
    collection: 'stores',
    label: 'Stores',
    fields: [
      { firestoreField: 'name', label: 'Store Name', type: 'string', required: true },
      { firestoreField: 'address', label: 'Address', type: 'string' },
      { firestoreField: 'phone', label: 'Phone', type: 'string' },
      { firestoreField: 'email', label: 'Email', type: 'string' },
      { firestoreField: 'manager', label: 'Manager', type: 'string' },
    ],
    requiredFields: ['name'],
    computedFields: ['ownerUid', 'employeeCount', 'productCount', 'createdAt', 'updatedAt'],
  },

  products: {
    id: 'products',
    collection: 'products',
    label: 'Products',
    fields: [
      { firestoreField: 'name', label: 'Product Name', type: 'string', required: true },
      { firestoreField: 'sku', label: 'SKU', type: 'string' },
      { firestoreField: 'barcode', label: 'Barcode', type: 'string' },
      { firestoreField: 'category', label: 'Category', type: 'string' },
      { firestoreField: 'description', label: 'Description', type: 'string' },
      { firestoreField: 'price', label: 'Price', type: 'number', coercion: 'parseFloat', defaultValue: 0 },
      { firestoreField: 'cost', label: 'Cost', type: 'number', coercion: 'parseFloat', defaultValue: 0 },
      { firestoreField: 'quantity', label: 'Quantity', type: 'number', coercion: 'parseInt', defaultValue: 0 },
      { firestoreField: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number', coercion: 'parseInt', defaultValue: 10 },
      { firestoreField: 'storeId', label: 'Store ID', type: 'string' },
      { firestoreField: 'storeName', label: 'Store Name', type: 'string' },
    ],
    requiredFields: ['name', 'storeId'],
    computedFields: ['ownerUid', 'createdAt', 'updatedAt'],
  },

  employees: {
    id: 'employees',
    collection: 'employees',
    label: 'Employees',
    fields: [
      { firestoreField: 'displayName', label: 'Name (displayName)', type: 'string', required: true },
      { firestoreField: 'email', label: 'Email', type: 'string', required: true },
      { firestoreField: 'phone', label: 'Phone', type: 'string' },
      { firestoreField: 'assignedStoreId', label: 'Assigned Store ID', type: 'string' },
      { firestoreField: 'assignedStoreName', label: 'Assigned Store Name', type: 'string' },
    ],
    requiredFields: ['displayName', 'email', 'assignedStoreId'],
    computedFields: ['ownerUid', 'uid', 'isActive', 'createdAt', 'updatedAt'],
  },

  customers: {
    id: 'customers',
    collection: 'customers',
    label: 'CRM Customers',
    fields: [
      { firestoreField: 'name', label: 'Customer Name', type: 'string', required: true },
      { firestoreField: 'email', label: 'Email', type: 'string' },
      { firestoreField: 'phone', label: 'Phone', type: 'string' },
      { firestoreField: 'address', label: 'Address', type: 'string' },
      { firestoreField: 'alternatePhone', label: 'Alternate Phone', type: 'string' },
      { firestoreField: 'customerType', label: 'Customer Type', type: 'string' },
      { firestoreField: 'preferredContact', label: 'Preferred Contact', type: 'string' },
      { firestoreField: 'deviceType', label: 'Device Type', type: 'string' },
      { firestoreField: 'brand', label: 'Brand', type: 'string' },
      { firestoreField: 'model', label: 'Model', type: 'string' },
      { firestoreField: 'imei', label: 'IMEI / Serial', type: 'string' },
      { firestoreField: 'carrier', label: 'Carrier', type: 'string' },
      { firestoreField: 'issueCategory', label: 'Issue Category', type: 'string' },
      { firestoreField: 'issueDescription', label: 'Issue Description', type: 'string' },
      { firestoreField: 'repairType', label: 'Repair Type', type: 'string' },
      { firestoreField: 'priority', label: 'Priority', type: 'string' },
      { firestoreField: 'estimatedCost', label: 'Estimated Cost', type: 'number', coercion: 'parseFloat' },
      { firestoreField: 'advancePaid', label: 'Advance Paid', type: 'number', coercion: 'parseFloat' },
      { firestoreField: 'partsType', label: 'Parts Type', type: 'string' },
      { firestoreField: 'submissionDate', label: 'Submission Date', type: 'date', required: true },
      { firestoreField: 'expectedDate', label: 'Expected Date', type: 'date' },
      { firestoreField: 'deviceReceivedDate', label: 'Device Received Date', type: 'date' },
      { firestoreField: 'repairStartDate', label: 'Repair Start Date', type: 'date' },
      { firestoreField: 'technicalStaffName', label: 'Technical Staff Name', type: 'string' },
      { firestoreField: 'status', label: 'Status', type: 'string', required: true },
      { firestoreField: 'notes', label: 'Notes', type: 'string' },
      { firestoreField: 'storeId', label: 'Store ID', type: 'string' },
      { firestoreField: 'storeName', label: 'Store Name', type: 'string' },
    ],
    requiredFields: ['name', 'storeId', 'submissionDate', 'status'],
    computedFields: ['ownerUid', 'createdAt', 'updatedAt'],
  },
};

/**
 * Get entity spec by id
 * @param {string} entityId
 * @returns {EntitySpec|undefined}
 */
export function getEntitySpec(entityId) {
  return MIGRATION_ENTITY_SPECS[entityId];
}

/**
 * Get all mappable fields for an entity
 * @param {string} entityId
 * @returns {FieldMeta[]}
 */
export function getMappableFields(entityId) {
  const spec = MIGRATION_ENTITY_SPECS[entityId];
  return spec ? spec.fields : [];
}

const SHEET_NAME_PATTERNS = [
  { pattern: /^stores?$/i, entityId: 'stores' },
  { pattern: /^products?$/i, entityId: 'products' },
  { pattern: /^employees?$/i, entityId: 'employees' },
  { pattern: /^customers?$/i, entityId: 'customers' },
  { pattern: /^crm$/i, entityId: 'customers' },
];

/**
 * Infer entity type from sheet name (for multi-sheet Excel auto-suggest).
 * @param {string} sheetName
 * @returns {string} entityId or empty string
 */
export function inferEntityFromSheetName(sheetName) {
  const trimmed = String(sheetName || '').trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, '');
  for (const { pattern, entityId } of SHEET_NAME_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(normalized)) {
      return entityId;
    }
  }
  return '';
}
