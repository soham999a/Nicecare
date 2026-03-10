/**
 * Row normalization, coercion, and validation for migration imports.
 * Uses migrationRegistry field metadata.
 */

import { getEntitySpec } from './migrationRegistry';

/**
 * Coerce a string value to the target type.
 * @param {string} raw - Raw CSV value
 * @param {Object} fieldMeta - Field metadata from registry
 * @returns {*}
 */
function coerceValue(raw, fieldMeta) {
  const trimmed = typeof raw === 'string' ? raw.trim() : raw;
  if (trimmed === '' || trimmed == null) {
    return fieldMeta.defaultValue ?? (fieldMeta.type === 'number' ? 0 : '');
  }

  switch (fieldMeta.coercion) {
    case 'parseFloat': {
      const n = parseFloat(trimmed);
      return Number.isNaN(n) ? (fieldMeta.defaultValue ?? 0) : n;
    }
    case 'parseInt': {
      const n = parseInt(trimmed, 10);
      return Number.isNaN(n) ? (fieldMeta.defaultValue ?? 0) : n;
    }
    default:
      break;
  }

  switch (fieldMeta.type) {
    case 'number':
      if (fieldMeta.coercion === 'parseFloat') {
        const n = parseFloat(trimmed);
        return Number.isNaN(n) ? (fieldMeta.defaultValue ?? 0) : n;
      }
      if (fieldMeta.coercion === 'parseInt') {
        const n = parseInt(trimmed, 10);
        return Number.isNaN(n) ? (fieldMeta.defaultValue ?? 0) : n;
      }
      return trimmed;
    case 'date':
      return trimmed;
    case 'boolean':
      return ['true', '1', 'yes'].includes(trimmed.toLowerCase());
    default:
      return trimmed;
  }
}

/**
 * Validate a single row for an entity.
 * @param {Record<string, string>} csvRow - Row keyed by Firestore field names (after mapping)
 * @param {string} entityId
 * @param {string} rowIndex - 1-based row number for error messages
 * @returns {{ valid: boolean; errors: string[]; doc: Record<string, unknown> }}
 */
export function processRow(csvRow, entityId, rowIndex) {
  const spec = getEntitySpec(entityId);
  const errors = [];
  const doc = {};

  if (!spec) {
    return { valid: false, errors: ['Unknown entity type'], doc: {} };
  }

  for (const fieldMeta of spec.fields) {
    const raw = csvRow[fieldMeta.firestoreField];
    const value = coerceValue(raw, fieldMeta);
    doc[fieldMeta.firestoreField] = value;

    if (fieldMeta.required) {
      const isEmpty = value === '' || value == null || (typeof value === 'string' && !value.trim());
      if (isEmpty) {
        errors.push(`Row ${rowIndex}: ${fieldMeta.label} is required`);
      }
    }
  }

  // Store reference: require storeId OR storeName (products, customers) or assignedStoreId OR assignedStoreName (employees)
  if (entityId === 'products') {
    const storeId = String(doc.storeId ?? '').trim();
    const storeName = String(doc.storeName ?? '').trim();
    if (!storeId && !storeName) {
      errors.push(`Row ${rowIndex}: Store ID or Store Name is required`);
    }
  }
  if (entityId === 'employees') {
    const assignedStoreId = String(doc.assignedStoreId ?? '').trim();
    const assignedStoreName = String(doc.assignedStoreName ?? '').trim();
    if (!assignedStoreId && !assignedStoreName) {
      errors.push(`Row ${rowIndex}: Assigned Store ID or Assigned Store Name is required`);
    }
  }
  if (entityId === 'customers') {
    const storeId = String(doc.storeId ?? '').trim();
    const storeName = String(doc.storeName ?? '').trim();
    if (!storeId && !storeName) {
      errors.push(`Row ${rowIndex}: Store ID or Store Name is required`);
    }
  }

  // Entity-specific validation
  if (entityId === 'customers') {
    const email = doc.email ?? '';
    const phone = doc.phone ?? '';
    if (!email && !phone) {
      errors.push(`Row ${rowIndex}: Either email or phone is required`);
    }
    if (doc.status === 'Select' || doc.status === '') {
      errors.push(`Row ${rowIndex}: Status must be a valid value (not "Select")`);
    }
    const submissionDate = doc.submissionDate ?? '';
    if (submissionDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (submissionDate > today) {
        errors.push(`Row ${rowIndex}: Submission date cannot be in the future`);
      }
    }
    const expectedDate = doc.expectedDate ?? '';
    if (expectedDate && submissionDate && expectedDate < submissionDate) {
      errors.push(`Row ${rowIndex}: Expected date cannot be earlier than submission date`);
    }
    const imei = doc.imei ?? '';
    if (imei && !/^\d{15}$/.test(imei)) {
      errors.push(`Row ${rowIndex}: IMEI must be exactly 15 digits when provided`);
    }
  }

  if (entityId === 'products') {
    const price = doc.price ?? 0;
    const cost = doc.cost ?? 0;
    if (price < 0) errors.push(`Row ${rowIndex}: Price cannot be negative`);
    if (cost < 0) errors.push(`Row ${rowIndex}: Cost cannot be negative`);
    const qty = doc.quantity ?? 0;
    if (qty < 0) errors.push(`Row ${rowIndex}: Quantity cannot be negative`);
  }

  return {
    valid: errors.length === 0,
    errors,
    doc,
  };
}

/**
 * Process all rows with a column-to-field mapping.
 * @param {Record<string, string>[]} rows - CSV rows (keyed by CSV column headers)
 * @param {Record<string, string>} columnToField - Map CSV column name -> Firestore field name
 * @param {string} entityId
 * @returns {{ valid: { rowIndex: number; doc: Record<string, unknown> }[]; invalid: { rowIndex: number; errors: string[]; raw: Record<string, string> }[] }}
 */
export function processAllRows(rows, columnToField, entityId) {
  const valid = [];
  const invalid = [];

  for (let i = 0; i < rows.length; i++) {
    const csvRow = rows[i];
    const rowIndex = i + 2; // 1-based, +1 for header
    const mapped = {};
    for (const [col, field] of Object.entries(columnToField)) {
      if (field && csvRow[col] !== undefined) {
        mapped[field] = csvRow[col];
      }
    }
    const result = processRow(mapped, entityId, rowIndex);
    if (result.valid) {
      valid.push({ rowIndex, doc: result.doc });
    } else {
      invalid.push({ rowIndex, errors: result.errors, raw: csvRow });
    }
  }

  return { valid, invalid };
}
