/**
 * Request/response payload shapes for Cloud Functions (HTTP API).
 * Aligns with functions/index.js. Used for documentation and optional validation.
 */

/**
 * askAboutInventory / inventorySummary / inventoryLowStock
 * @typedef {Object} InventoryRagRequest
 * @property {string} [question] - Required for askAboutInventory
 * @property {string} userRole - 'master' | 'manager' | 'member'
 * @property {string|null} [assignedStoreId]
 * @property {string|null} [ownerUidForMember]
 */

/**
 * askAboutCustomers
 * @typedef {Object} CrmAskRequest
 * @property {string} question
 */

/**
 * customerSummary - no body
 * @typedef {Object} CrmSummaryRequest
 */

/**
 * submitFeedback
 * @typedef {Object} FeedbackRequest
 * @property {string} messageId - Required
 * @property {string} [question]
 * @property {string} [answer]
 * @property {'up'|'down'} rating - Required
 * @property {string} [comment]
 * @property {'crm'|'inventory'} module - Required
 */

/**
 * SSE stream response: chunks have { chunk?: string }, final event has { done: true, ...meta }
 * @typedef {Object} SSEDoneMeta
 * @property {Object} [dataUsed] - askAboutInventory, inventorySummary, inventoryLowStock
 * @property {number} [dataUsed.products]
 * @property {number} [dataUsed.stores]
 * @property {number} [dataUsed.employees]
 * @property {number} [dataUsed.sales]
 * @property {number} [customersUsed] - askAboutCustomers, customerSummary
 * @property {number} [dataUsed.lowStock]
 * @property {number} [dataUsed.outOfStock]
 */

/**
 * submitFeedback success
 * @typedef {Object} FeedbackResponse
 * @property {boolean} success
 */

/**
 * inventoryConsistencyReconcile
 * @typedef {Object} InventoryConsistencyRequest
 * @property {boolean} [apply] - false=dry-run, true=apply reconciliation
 */

export const API_CONTRACTS = {
  askAboutInventory: { method: 'POST', body: ['question', 'userRole', 'assignedStoreId', 'ownerUidForMember'] },
  inventorySummary: { method: 'POST', body: ['userRole', 'assignedStoreId', 'ownerUidForMember'] },
  inventoryLowStock: { method: 'POST', body: ['userRole', 'assignedStoreId', 'ownerUidForMember'] },
  askAboutCustomers: { method: 'POST', body: ['question'] },
  customerSummary: { method: 'POST', body: [] },
  submitFeedback: { method: 'POST', body: ['messageId', 'question', 'answer', 'rating', 'comment', 'module'] },
  inventoryConsistencyReconcile: { method: 'POST', body: ['apply'] },
};
