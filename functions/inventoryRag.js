import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Text Representation Helpers ─────────────────────────────────────────────

function productToText(product, storeName = '') {
  const parts = [];
  if (product.name) parts.push(`Product: ${product.name}`);
  if (product.sku) parts.push(`SKU: ${product.sku}`);
  if (product.category) parts.push(`Category: ${product.category}`);
  if (product.brand) parts.push(`Brand: ${product.brand}`);
  if (product.quantity !== undefined) parts.push(`Quantity in stock: ${product.quantity}`);
  if (product.price !== undefined) parts.push(`Price: $${product.price}`);
  if (product.cost !== undefined) parts.push(`Cost: $${product.cost}`);
  if (product.lowStockThreshold) parts.push(`Low stock threshold: ${product.lowStockThreshold}`);
  if (storeName) parts.push(`Store: ${storeName}`);
  if (product.description) parts.push(`Description: ${product.description}`);
  return parts.join(', ');
}

function storeToText(store) {
  const parts = [];
  if (store.name) parts.push(`Store: ${store.name}`);
  if (store.address) parts.push(`Address: ${store.address}`);
  if (store.phone) parts.push(`Phone: ${store.phone}`);
  if (store.email) parts.push(`Email: ${store.email}`);
  if (store.employeeCount !== undefined) parts.push(`Employees: ${store.employeeCount}`);
  if (store.productCount !== undefined) parts.push(`Products: ${store.productCount}`);
  return parts.join(', ');
}

function employeeToText(employee, storeName = '') {
  const parts = [];
  if (employee.name) parts.push(`Employee: ${employee.name}`);
  if (employee.email) parts.push(`Email: ${employee.email}`);
  if (employee.phone) parts.push(`Phone: ${employee.phone}`);
  if (employee.role) parts.push(`Role: ${employee.role}`);
  if (employee.status) parts.push(`Status: ${employee.status}`);
  if (storeName) parts.push(`Assigned Store: ${storeName}`);
  return parts.join(', ');
}

function saleToText(sale, storeName = '') {
  const parts = [];
  if (sale.id) parts.push(`Sale ID: ${sale.id.slice(-6)}`);
  if (sale.total !== undefined) parts.push(`Total: $${sale.total.toFixed(2)}`);
  if (sale.items) parts.push(`Items: ${sale.items.length}`);
  if (sale.paymentMethod) parts.push(`Payment: ${sale.paymentMethod}`);
  if (storeName) parts.push(`Store: ${storeName}`);
  if (sale.createdAt?.toDate) {
    parts.push(`Date: ${sale.createdAt.toDate().toLocaleDateString()}`);
  }
  if (sale.cashierName) parts.push(`Cashier: ${sale.cashierName}`);
  return parts.join(', ');
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

export async function getAllInventoryData(ownerUid, userRole, assignedStoreId = null, ownerUidForMember = null) {
  const db = getFirestore();
  const data = { products: [], stores: [], employees: [], sales: [], storeMap: {} };
  const effectiveOwnerUid = userRole === 'member' ? ownerUidForMember : ownerUid;

  if (!effectiveOwnerUid) return data;

  try {
    // Fetch stores (master only)
    if (userRole === 'master') {
      const storesSnap = await db.collection('stores')
        .where('ownerUid', '==', effectiveOwnerUid)
        .orderBy('createdAt', 'desc')
        .get();
      data.stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.stores.forEach(s => { data.storeMap[s.id] = s.name; });
    }

    // Fetch products
    let productsRef = db.collection('products').where('ownerUid', '==', effectiveOwnerUid);
    if (userRole === 'member' && assignedStoreId) {
      productsRef = productsRef.where('storeId', '==', assignedStoreId);
    }
    const productsSnap = await productsRef.orderBy('createdAt', 'desc').get();
    data.products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch employees (master only)
    if (userRole === 'master') {
      const employeesSnap = await db.collection('inventoryUsers')
        .where('ownerUid', '==', effectiveOwnerUid)
        .where('role', '==', 'member')
        .get();
      data.employees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Fetch sales
    let salesRef;
    if (userRole === 'master') {
      salesRef = db.collection('sales').where('ownerUid', '==', effectiveOwnerUid);
    } else if (assignedStoreId) {
      salesRef = db.collection('sales').where('storeId', '==', assignedStoreId);
    }
    if (salesRef) {
      const salesSnap = await salesRef.orderBy('createdAt', 'desc').get();
      data.sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error('Error fetching inventory data:', err);
  }

  return data;
}

// ─── Context Building ────────────────────────────────────────────────────────

export function buildInventoryContext(data) {
  const parts = [];

  if (data.products.length > 0) {
    parts.push('=== PRODUCTS ===');
    const lowStock = data.products.filter(p => p.quantity <= (p.lowStockThreshold || 10));
    const outOfStock = data.products.filter(p => p.quantity === 0);
    const totalValue = data.products.reduce((sum, p) => sum + (p.price * p.quantity || 0), 0);
    const totalItems = data.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    parts.push(`Total products: ${data.products.length}`);
    parts.push(`Total inventory items: ${totalItems}`);
    parts.push(`Total inventory value: $${totalValue.toFixed(2)}`);
    parts.push(`Low stock items: ${lowStock.length}`);
    parts.push(`Out of stock items: ${outOfStock.length}`);
    parts.push('\nProduct details:');
    data.products.slice(0, 30).forEach((p, i) => {
      parts.push(`${i + 1}. ${productToText(p, data.storeMap[p.storeId] || '')}`);
    });
  }

  if (data.stores.length > 0) {
    parts.push('\n=== STORES ===');
    parts.push(`Total stores: ${data.stores.length}`);
    parts.push('\nStore details:');
    data.stores.forEach((s, i) => { parts.push(`${i + 1}. ${storeToText(s)}`); });
  }

  if (data.employees.length > 0) {
    parts.push('\n=== EMPLOYEES ===');
    parts.push(`Total employees: ${data.employees.length}`);
    parts.push('\nEmployee details:');
    data.employees.slice(0, 20).forEach((e, i) => {
      parts.push(`${i + 1}. ${employeeToText(e, data.storeMap[e.assignedStoreId] || '')}`);
    });
  }

  if (data.sales.length > 0) {
    parts.push('\n=== SALES ===');
    const totalRevenue = data.sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySales = data.sales.filter(s => {
      const d = s.createdAt?.toDate?.();
      return d && d >= today;
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    parts.push(`Total sales transactions: ${data.sales.length}`);
    parts.push(`Total revenue: $${totalRevenue.toFixed(2)}`);
    parts.push(`Today's sales: ${todaySales.length}`);
    parts.push(`Today's revenue: $${todayRevenue.toFixed(2)}`);
    parts.push(`Average order value: $${(data.sales.length > 0 ? totalRevenue / data.sales.length : 0).toFixed(2)}`);
    parts.push('\nRecent sales:');
    data.sales.slice(0, 20).forEach((s, i) => {
      parts.push(`${i + 1}. ${saleToText(s, data.storeMap[s.storeId] || '')}`);
    });
  }

  return parts.length === 0 ? 'No inventory data found.' : parts.join('\n');
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

export function buildAskPrompt(question, context, userRole) {
  const roleContext = userRole === 'master'
    ? 'You are helping a business owner manage their inventory across multiple stores.'
    : "You are helping a store employee manage their store's inventory.";

  return `You are a helpful assistant for an inventory management system. ${roleContext}

Based on the following inventory data, answer the user's question accurately and helpfully.

INVENTORY DATA:
${context}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based only on the inventory data provided above
- If the information isn't available in the data, say so politely
- Be concise but helpful
- For questions about counts or statistics, calculate from the data
- Format lists and numbers clearly
- Use currency formatting for monetary values
- Highlight any critical issues like low stock or out-of-stock items when relevant
- Provide actionable insights when possible`;
}

export function buildSummaryPrompt(context, userRole) {
  const rolePrompt = userRole === 'master'
    ? `Analyze the following inventory data for a business owner and provide a comprehensive summary including:
1. Overall business health
2. Total inventory value and stock levels
3. Store performance comparison (if multiple stores)
4. Low stock alerts and recommendations
5. Sales trends and top-performing products
6. Employee distribution
7. Actionable recommendations`
    : `Analyze the following store inventory data and provide a summary including:
1. Current stock levels
2. Low stock alerts
3. Recent sales performance
4. Items that need restocking
5. Actionable recommendations`;

  return `You are a business analytics assistant for an inventory management system.

${rolePrompt}

INVENTORY DATA:
${context}

Provide a concise, actionable summary in 5-8 bullet points.`;
}

export function buildLowStockPrompt(lowStockProducts, outOfStockCount, storeMap) {
  const lowStockContext = lowStockProducts.map((p, i) => {
    const storeName = storeMap[p.storeId] || '';
    return `${i + 1}. ${p.name} - Current: ${p.quantity}, Threshold: ${p.lowStockThreshold || 10}${storeName ? `, Store: ${storeName}` : ''}`;
  }).join('\n');

  return `You are an inventory management assistant. Analyze these low stock items and provide prioritized recommendations.

LOW STOCK ITEMS (${lowStockProducts.length} total):
${lowStockContext}

OUT OF STOCK: ${outOfStockCount} items

Provide:
1. Priority ranking (most urgent first)
2. Estimated reorder quantities based on thresholds
3. Any patterns you notice (categories, stores)
4. Actionable next steps

Be concise and practical.`;
}

// ─── Streaming Helper ────────────────────────────────────────────────────────

export async function streamGeminiResponse(prompt, sse) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured on server.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContentStream(prompt);
  let fullResponse = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;
    sse.sendChunk({ chunk: text });
  }

  return fullResponse;
}
