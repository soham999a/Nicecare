import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

import { COLLECTIONS } from './firestoreCollections.js';
import { verifyAuth, checkRateLimit, initSSE } from './utils.js';
import {
  getAllInventoryData,
  buildInventoryContext,
  buildAskPrompt as buildInventoryAskPrompt,
  buildSummaryPrompt as buildInventorySummaryPrompt,
  buildLowStockPrompt,
  streamGeminiResponse as streamInventoryGemini,
} from './inventoryRag.js';
import {
  getAllCustomers,
  buildContextFromCustomers,
  buildAskPrompt as buildCustomerAskPrompt,
  buildSummaryPrompt as buildCustomerSummaryPrompt,
  streamGeminiResponse as streamCustomerGemini,
} from './customerRag.js';
import { reconcileInventoryConsistency } from './reconcileConsistencyCore.js';

initializeApp();

// Define the secret so it's available at runtime
const googleAiApiKey = defineSecret('GOOGLE_AI_API_KEY');

// ─── Shared CORS + Options Config ────────────────────────────────────────────

const functionConfig = {
  cors: true,
  timeoutSeconds: 120,
  memory: '512MiB',
  secrets: [googleAiApiKey],
};

// ─── Inventory: Ask Question ─────────────────────────────────────────────────

export const askAboutInventory = onRequest(functionConfig, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyAuth(req, res);
  if (!decoded) return;

  try {
    checkRateLimit(decoded.uid);
  } catch (err) {
    res.status(429).json({ error: err.message });
    return;
  }

  const sse = initSSE(res);

  try {
    const { question, userRole, assignedStoreId, ownerUidForMember } = req.body;

    if (!question) {
      sse.sendError('Question is required', 400);
      return;
    }

    const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);
    const context = buildInventoryContext(data);
    const prompt = buildInventoryAskPrompt(question, context, userRole);
    const dataUsed = {
      products: data.products.length,
      stores: data.stores.length,
      employees: data.employees.length,
      sales: data.sales.length,
    };

    const answer = await streamInventoryGemini(prompt, sse);
    sse.sendDone({ dataUsed });
  } catch (err) {
    console.error('askAboutInventory error:', err);
    sse.sendError(err.message);
  }
});

// ─── Inventory: Summary ──────────────────────────────────────────────────────

export const inventorySummary = onRequest(functionConfig, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyAuth(req, res);
  if (!decoded) return;

  try {
    checkRateLimit(decoded.uid);
  } catch (err) {
    res.status(429).json({ error: err.message });
    return;
  }

  const sse = initSSE(res);

  try {
    const { userRole, assignedStoreId, ownerUidForMember } = req.body;
    const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);
    const dataUsed = {
      products: data.products.length,
      stores: data.stores.length,
      employees: data.employees.length,
      sales: data.sales.length,
    };

    if (data.products.length === 0 && data.stores.length === 0 && data.sales.length === 0) {
      sse.sendChunk({ chunk: 'No inventory data found. Start by adding stores, products, and making sales to get insights!' });
      sse.sendDone({ dataUsed });
      return;
    }

    const context = buildInventoryContext(data);
    const prompt = buildInventorySummaryPrompt(context, userRole);
    await streamInventoryGemini(prompt, sse);
    sse.sendDone({ dataUsed });
  } catch (err) {
    console.error('inventorySummary error:', err);
    sse.sendError(err.message);
  }
});

// ─── Inventory: Low Stock Analysis ───────────────────────────────────────────

export const inventoryLowStock = onRequest(functionConfig, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyAuth(req, res);
  if (!decoded) return;

  try {
    checkRateLimit(decoded.uid);
  } catch (err) {
    res.status(429).json({ error: err.message });
    return;
  }

  const sse = initSSE(res);

  try {
    const { userRole, assignedStoreId, ownerUidForMember } = req.body;
    const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);

    const lowStockProducts = data.products.filter(p => p.quantity <= (p.lowStockThreshold || 10));
    const outOfStockProducts = data.products.filter(p => p.quantity === 0);

    const dataUsed = {
      products: data.products.length,
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
    };

    if (lowStockProducts.length === 0) {
      sse.sendChunk({ chunk: '✅ Great news! All products are well-stocked. No items are below their low stock threshold.' });
      sse.sendDone({ dataUsed });
      return;
    }

    const prompt = buildLowStockPrompt(lowStockProducts, outOfStockProducts.length, data.storeMap);
    await streamInventoryGemini(prompt, sse);
    sse.sendDone({ dataUsed });
  } catch (err) {
    console.error('inventoryLowStock error:', err);
    sse.sendError(err.message);
  }
});

// ─── CRM: Ask about Customers ────────────────────────────────────────────────

export const askAboutCustomers = onRequest(functionConfig, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyAuth(req, res);
  if (!decoded) return;

  try {
    checkRateLimit(decoded.uid);
  } catch (err) {
    res.status(429).json({ error: err.message });
    return;
  }

  const sse = initSSE(res);

  try {
    const { question } = req.body;

    if (!question) {
      sse.sendError('Question is required', 400);
      return;
    }

    const customers = await getAllCustomers(decoded.uid);
    const context = buildContextFromCustomers(customers.slice(0, 20));
    const prompt = buildCustomerAskPrompt(question, context, customers.length);

    await streamCustomerGemini(prompt, sse);
    sse.sendDone({ customersUsed: customers.length });
  } catch (err) {
    console.error('askAboutCustomers error:', err);
    sse.sendError(err.message);
  }
});

// ─── CRM: Customer Summary ──────────────────────────────────────────────────

export const customerSummary = onRequest(functionConfig, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyAuth(req, res);
  if (!decoded) return;

  try {
    checkRateLimit(decoded.uid);
  } catch (err) {
    res.status(429).json({ error: err.message });
    return;
  }

  const sse = initSSE(res);

  try {
    const customers = await getAllCustomers(decoded.uid);

    if (customers.length === 0) {
      sse.sendChunk({ chunk: 'No customer records found. Start adding customers to get insights!' });
      sse.sendDone({ customersUsed: 0 });
      return;
    }

    const context = buildContextFromCustomers(customers.slice(0, 30));
    const prompt = buildCustomerSummaryPrompt(context);
    await streamCustomerGemini(prompt, sse);
    sse.sendDone({ customersUsed: customers.length });
  } catch (err) {
    console.error('customerSummary error:', err);
    sse.sendError(err.message);
  }
});

// ─── Feedback Endpoint ───────────────────────────────────────────────────────

export const submitFeedback = onRequest(
  { cors: true, timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const decoded = await verifyAuth(req, res);
    if (!decoded) return;

    try {
      const { messageId, question, answer, rating, comment, module } = req.body;

      if (!messageId || !rating) {
        res.status(400).json({ error: 'messageId and rating are required' });
        return;
      }

      if (!['up', 'down'].includes(rating)) {
        res.status(400).json({ error: 'rating must be "up" or "down"' });
        return;
      }

      if (!['crm', 'inventory'].includes(module)) {
        res.status(400).json({ error: 'module must be "crm" or "inventory"' });
        return;
      }

      const db = getFirestore();
      const feedbackRef = db.collection(COLLECTIONS.CHATBOT_FEEDBACK_SUBMISSIONS).doc(messageId);
      const existing = await feedbackRef.get();

      if (existing.exists) {
        // Update existing feedback (user changed their vote or added a comment)
        await feedbackRef.update({
          rating,
          comment: comment || null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Create new feedback
        await feedbackRef.set({
          userId: decoded.uid,
          messageId,
          question: question || '',
          answer: (answer || '').slice(0, 2000), // Truncate to save storage
          rating,
          comment: comment || null,
          module,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('submitFeedback error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── Inventory: Consistency Reconciliation (master only) ─────────────────────

export const inventoryConsistencyReconcile = onRequest(
  { cors: true, timeoutSeconds: 120, memory: '512MiB' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const decoded = await verifyAuth(req, res);
    if (!decoded) return;

    try {
      checkRateLimit(decoded.uid);
    } catch (err) {
      res.status(429).json({ error: err.message });
      return;
    }

    try {
      const db = getFirestore();
      const profileRef = db.collection(COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES).doc(decoded.uid);
      const profileDoc = await profileRef.get();
      if (!profileDoc.exists || profileDoc.data()?.role !== 'master') {
        res.status(403).json({ error: 'Only master accounts can run consistency reconciliation.' });
        return;
      }

      const { apply = false } = req.body || {};
      const result = await reconcileInventoryConsistency(db, {
        ownerUid: decoded.uid,
        apply: Boolean(apply),
      });
      res.status(200).json(result);
    } catch (err) {
      console.error('inventoryConsistencyReconcile error:', err);
      res.status(500).json({ error: err.message || 'Failed to reconcile consistency' });
    }
  }
);
