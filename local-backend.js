/**
 * local-backend.js  –  Local dev server that mirrors all Cloud Function endpoints.
 *
 * Run with:   node local-backend.js
 * Or via npm: npm run backend
 *
 * Requires in .env:
 *   GOOGLE_AI_API_KEY=...
 *   VITE_FIREBASE_PROJECT_ID=...
 *   (Firebase Admin picks up credentials automatically via Application Default
 *    Credentials, OR you can set GOOGLE_APPLICATION_CREDENTIALS to a service
 *    account JSON.  For read-only Firestore during local dev you can also use
 *    the Firebase emulator, but this file targets the real Firestore.)
 *
 * NOTE: Auth verification is relaxed for local dev – the Bearer token is
 * decoded (without signature verification) just to extract the uid so the
 * Firestore queries work correctly.  Never do this in production.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Firebase Admin init ───────────────────────────────────────────────────────
// We explicitly load the service account JSON (if a path is set) so that
// dotenv has already populated process.env before firebase-admin tries to
// authenticate.  Falling back to ADC if no path is provided.
if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
        // Read the JSON file synchronously and pass it straight to cert()
        // This works even with ESM because we have fs available
        const { readFileSync } = await import('fs');
        const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
        initializeApp({ credential: cert(serviceAccount) });
        console.log(`🔑 Firebase Admin: using service account (${serviceAccount.client_email})`);
    } else {
        // ADC / gcloud default credentials
        initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
        console.log('🔑 Firebase Admin: using Application Default Credentials (ADC)');
    }
}

const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Decode a Firebase ID token WITHOUT verifying the signature.
 * Safe only for local development.
 */
function decodeTokenInsecure(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    try {
        const payloadB64 = token.split('.')[1];
        const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
        return JSON.parse(json); // { uid, sub, email, ... }
    } catch {
        return null;
    }
}

function initSSE(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // flushHeaders() commits the 200 + headers immediately so that
    // res.headersSent === true before any async work begins.
    // This ensures errors are always delivered as SSE events, never as
    // a 500 JSON response that the client can't parse as a stream.
    res.flushHeaders();
    return {
        sendChunk(data) { res.write(`data: ${JSON.stringify(data)}\n\n`); },
        sendDone(data = {}) {
            res.write(`data: ${JSON.stringify({ ...data, done: true })}\n\n`);
            res.end();
        },
        sendError(message, _statusCode = 500) {
            // Headers already sent (SSE stream open) – send error as an event
            res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
            res.end();
        },
    };
}

async function streamGemini(prompt, sse) {
    // Prefer the non-VITE prefixed key (readable by Node) but fall back to
    // VITE_GOOGLE_AI_API_KEY if that's all that's set.
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set in .env – add your Gemini API key from https://aistudio.google.com/apikey');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContentStream(prompt);
    let full = '';
    for await (const chunk of result.stream) {
        const text = chunk.text();
        full += text;
        sse.sendChunk({ chunk: text });
    }
    return full;
}

// ── Inventory helpers (ported from functions/inventoryRag.js) ─────────────────

function productToText(p, storeName = '') {
    const parts = [];
    if (p.name) parts.push(`Product: ${p.name}`);
    if (p.sku) parts.push(`SKU: ${p.sku}`);
    if (p.category) parts.push(`Category: ${p.category}`);
    if (p.brand) parts.push(`Brand: ${p.brand}`);
    if (p.quantity !== undefined) parts.push(`Quantity in stock: ${p.quantity}`);
    if (p.price !== undefined) parts.push(`Price: $${p.price}`);
    if (p.cost !== undefined) parts.push(`Cost: $${p.cost}`);
    if (p.lowStockThreshold) parts.push(`Low stock threshold: ${p.lowStockThreshold}`);
    if (storeName) parts.push(`Store: ${storeName}`);
    if (p.description) parts.push(`Description: ${p.description}`);
    return parts.join(', ');
}

function storeToText(s) {
    const parts = [];
    if (s.name) parts.push(`Store: ${s.name}`);
    if (s.address) parts.push(`Address: ${s.address}`);
    if (s.phone) parts.push(`Phone: ${s.phone}`);
    if (s.email) parts.push(`Email: ${s.email}`);
    if (s.employeeCount !== undefined) parts.push(`Employees: ${s.employeeCount}`);
    if (s.productCount !== undefined) parts.push(`Products: ${s.productCount}`);
    return parts.join(', ');
}

function employeeToText(e, storeName = '') {
    const parts = [];
    if (e.name) parts.push(`Employee: ${e.name}`);
    if (e.email) parts.push(`Email: ${e.email}`);
    if (e.phone) parts.push(`Phone: ${e.phone}`);
    if (e.role) parts.push(`Role: ${e.role}`);
    if (e.status) parts.push(`Status: ${e.status}`);
    if (storeName) parts.push(`Assigned Store: ${storeName}`);
    return parts.join(', ');
}

function saleToText(s, storeName = '') {
    const parts = [];
    if (s.id) parts.push(`Sale ID: ${s.id.slice(-6)}`);
    if (s.total !== undefined) parts.push(`Total: $${s.total.toFixed(2)}`);
    if (s.items) parts.push(`Items: ${s.items.length}`);
    if (s.paymentMethod) parts.push(`Payment: ${s.paymentMethod}`);
    if (storeName) parts.push(`Store: ${storeName}`);
    if (s.createdAt?.toDate) parts.push(`Date: ${s.createdAt.toDate().toLocaleDateString()}`);
    if (s.cashierName) parts.push(`Cashier: ${s.cashierName}`);
    return parts.join(', ');
}

async function getAllInventoryData(ownerUid, userRole, assignedStoreId, ownerUidForMember) {
    const data = { products: [], stores: [], employees: [], sales: [], storeMap: {} };
    const isStoreScopedRole = userRole === 'member' || userRole === 'manager';
    const effectiveOwnerUid = isStoreScopedRole ? ownerUidForMember : ownerUid;
    if (!effectiveOwnerUid) return data;

    try {
        if (userRole === 'master') {
            const storesSnap = await db.collection('stores')
                .where('ownerUid', '==', effectiveOwnerUid)
                .orderBy('createdAt', 'desc').get();
            data.stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.stores.forEach(s => { data.storeMap[s.id] = s.name; });
        }

        let productsRef = db.collection('products').where('ownerUid', '==', effectiveOwnerUid);
        if (isStoreScopedRole && assignedStoreId)
            productsRef = productsRef.where('storeId', '==', assignedStoreId);
        const productsSnap = await productsRef.orderBy('createdAt', 'desc').get();
        data.products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (userRole === 'master') {
            const empSnap = await db.collection('inventoryUsers')
                .where('ownerUid', '==', effectiveOwnerUid)
                .where('role', '==', 'member').get();
            data.employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        let salesRef;
        if (userRole === 'master')
            salesRef = db.collection('sales').where('ownerUid', '==', effectiveOwnerUid);
        else if (assignedStoreId)
            salesRef = db.collection('sales').where('storeId', '==', assignedStoreId);
        if (salesRef) {
            const salesSnap = await salesRef.orderBy('createdAt', 'desc').get();
            data.sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (err) {
        console.error('Error fetching inventory data:', err);
    }
    return data;
}

function buildInventoryContext(data) {
    const parts = [];
    if (data.products.length > 0) {
        const lowStock = data.products.filter(p => p.quantity <= (p.lowStockThreshold || 10));
        const outOfStock = data.products.filter(p => p.quantity === 0);
        const totalValue = data.products.reduce((s, p) => s + (p.price * p.quantity || 0), 0);
        const totalItems = data.products.reduce((s, p) => s + (p.quantity || 0), 0);
        parts.push('=== PRODUCTS ===',
            `Total products: ${data.products.length}`,
            `Total inventory items: ${totalItems}`,
            `Total inventory value: $${totalValue.toFixed(2)}`,
            `Low stock items: ${lowStock.length}`,
            `Out of stock items: ${outOfStock.length}`,
            '\nProduct details:');
        data.products.slice(0, 30).forEach((p, i) =>
            parts.push(`${i + 1}. ${productToText(p, data.storeMap[p.storeId] || '')}`));
    }
    if (data.stores.length > 0) {
        parts.push('\n=== STORES ===', `Total stores: ${data.stores.length}`, '\nStore details:');
        data.stores.forEach((s, i) => parts.push(`${i + 1}. ${storeToText(s)}`));
    }
    if (data.employees.length > 0) {
        parts.push('\n=== EMPLOYEES ===', `Total employees: ${data.employees.length}`, '\nEmployee details:');
        data.employees.slice(0, 20).forEach((e, i) =>
            parts.push(`${i + 1}. ${employeeToText(e, data.storeMap[e.assignedStoreId] || '')}`));
    }
    if (data.sales.length > 0) {
        const totalRevenue = data.sales.reduce((s, x) => s + (x.total || 0), 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todaySales = data.sales.filter(s => { const d = s.createdAt?.toDate?.(); return d && d >= today; });
        const todayRevenue = todaySales.reduce((s, x) => s + (x.total || 0), 0);
        parts.push('\n=== SALES ===',
            `Total sales transactions: ${data.sales.length}`,
            `Total revenue: $${totalRevenue.toFixed(2)}`,
            `Today's sales: ${todaySales.length}`,
            `Today's revenue: $${todayRevenue.toFixed(2)}`,
            `Average order value: $${(data.sales.length > 0 ? totalRevenue / data.sales.length : 0).toFixed(2)}`,
            '\nRecent sales:');
        data.sales.slice(0, 20).forEach((s, i) =>
            parts.push(`${i + 1}. ${saleToText(s, data.storeMap[s.storeId] || '')}`));
    }
    return parts.length === 0 ? 'No inventory data found.' : parts.join('\n');
}

function buildInventoryAskPrompt(question, context, userRole) {
    const roleCtx = userRole === 'master'
        ? 'You are helping a business owner manage their inventory across multiple stores.'
        : userRole === 'manager'
            ? "You are helping a store manager manage inventory, team operations, and sales for their assigned store."
            : "You are helping a store employee manage their store's inventory.";
    return `You are a helpful assistant for an inventory management system. ${roleCtx}

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

function buildInventorySummaryPrompt(context, userRole) {
    const rolePrompt = userRole === 'master'
        ? `Analyze the following inventory data for a business owner and provide a comprehensive summary including:
1. Overall business health
2. Total inventory value and stock levels
3. Store performance comparison (if multiple stores)
4. Low stock alerts and recommendations
5. Sales trends and top-performing products
6. Employee distribution
7. Actionable recommendations`
        : userRole === 'manager'
            ? `Analyze the following store inventory data for a store manager and provide a summary including:
1. Current stock levels
2. Low stock alerts
3. Store sales performance
4. Team performance signals from sales and activity
5. Items that need restocking
6. Actionable recommendations for the assigned store`
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

function buildLowStockPrompt(lowStockProducts, outOfStockCount, storeMap) {
    const ctx = lowStockProducts.map((p, i) => {
        const sn = storeMap[p.storeId] || '';
        return `${i + 1}. ${p.name} - Current: ${p.quantity}, Threshold: ${p.lowStockThreshold || 10}${sn ? `, Store: ${sn}` : ''}`;
    }).join('\n');
    return `You are an inventory management assistant. Analyze these low stock items and provide prioritized recommendations.

LOW STOCK ITEMS (${lowStockProducts.length} total):
${ctx}

OUT OF STOCK: ${outOfStockCount} items

Provide:
1. Priority ranking (most urgent first)
2. Estimated reorder quantities based on thresholds
3. Any patterns you notice (categories, stores)
4. Actionable next steps

Be concise and practical.`;
}

// ── Customer helpers (ported from functions/customerRag.js) ───────────────────

function customerToText(c) {
    const parts = [];
    if (c.name) parts.push(`Customer: ${c.name}`);
    if (c.email) parts.push(`Email: ${c.email}`);
    if (c.phone) parts.push(`Phone: ${c.phone}`);
    if (c.address) parts.push(`Address: ${c.address}`);
    if (c.status) parts.push(`Status: ${c.status}`);
    if (c.deviceType) parts.push(`Device: ${c.deviceType}`);
    if (c.brand) parts.push(`Brand: ${c.brand}`);
    if (c.model) parts.push(`Model: ${c.model}`);
    if (c.issueCategory) parts.push(`Issue: ${c.issueCategory}`);
    if (c.issueDescription) parts.push(`Description: ${c.issueDescription}`);
    if (c.repairType) parts.push(`Repair Type: ${c.repairType}`);
    if (c.priority) parts.push(`Priority: ${c.priority}`);
    if (c.estimatedCost) parts.push(`Estimated Cost: $${c.estimatedCost}`);
    if (c.notes) parts.push(`Notes: ${c.notes}`);
    if (c.technicalStaffName) parts.push(`Technician: ${c.technicalStaffName}`);
    if (c.submissionDate) parts.push(`Submitted: ${c.submissionDate}`);
    if (c.expectedDate) parts.push(`Expected: ${c.expectedDate}`);
    return parts.join(', ');
}

async function getAllCustomers(ownerUid) {
    const snapshot = await db.collection('customers')
        .where('ownerUid', '==', ownerUid)
        .orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

function buildCustomerContext(customers) {
    if (customers.length === 0) return 'No customer records found.';
    return customers.map((c, i) => `${i + 1}. ${customerToText(c)}`).join('\n');
}

function buildCustomerAskPrompt(question, context, customerCount) {
    return `You are a helpful assistant for a device repair shop management system. Your role is to help the shop owner understand and analyze their customer data.

Based on the following customer records, answer the user's question accurately and helpfully.

CUSTOMER DATA:
${context}

TOTAL CUSTOMERS IN CONTEXT: ${customerCount}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based only on the customer data provided above
- If the information isn't available in the data, say so politely
- Be concise but helpful
- For questions about counts or statistics, calculate from the data
- Format lists and numbers clearly
- If asked about a specific customer, provide all relevant details you have
- For status-related questions, summarize the current state of repairs`;
}

function buildCustomerSummaryPrompt(context) {
    return `You are a business analytics assistant for a device repair shop.

Analyze the following customer records and provide a brief summary including:
1. Total number of customers
2. Status breakdown (how many in each status)
3. Most common device types
4. Any urgent or priority repairs
5. Recent trends or observations

CUSTOMER DATA:
${context}

Provide a concise, actionable summary in 4-6 bullet points.`;
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

function requireAuth(req, res) {
    // ── Dev-only bypass ───────────────────────────────────────────────────────
    // In local dev, send:  X-Dev-UID: <your-firebase-uid>
    // This skips token verification entirely.  Cloud Functions use real
    // verifyIdToken() so this bypass never works in production.
    if (req.headers['x-dev-uid']) {
        const uid = req.headers['x-dev-uid'];
        console.log(`[DEV BYPASS] uid=${uid}`);
        return { uid };
    }
    // ── Normal path: decode the Firebase ID token (no signature check) ────────
    const decoded = decodeTokenInsecure(req.headers.authorization);
    if (!decoded || !(decoded.uid || decoded.sub)) {
        res.status(401).json({ error: 'Missing or invalid Authorization header. In local dev you can pass X-Dev-UID header instead.' });
        return null;
    }
    decoded.uid = decoded.uid || decoded.sub;
    return decoded;
}

// ── POST /askAboutInventory ───────────────────────────────────────────────────
app.post('/askAboutInventory', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    const sse = initSSE(res);
    try {
        const { question, userRole, assignedStoreId, ownerUidForMember } = req.body;
        if (!question) { sse.sendError('Question is required', 400); return; }
        const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);
        const context = buildInventoryContext(data);
        const prompt = buildInventoryAskPrompt(question, context, userRole);
        await streamGemini(prompt, sse);
        sse.sendDone({ dataUsed: { products: data.products.length, stores: data.stores.length, employees: data.employees.length, sales: data.sales.length } });
    } catch (err) {
        console.error('askAboutInventory error:', err);
        sse.sendError(err.message);
    }
});

// ── POST /inventorySummary ────────────────────────────────────────────────────
app.post('/inventorySummary', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    const sse = initSSE(res);
    try {
        const { userRole, assignedStoreId, ownerUidForMember } = req.body;
        const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);
        const dataUsed = { products: data.products.length, stores: data.stores.length, employees: data.employees.length, sales: data.sales.length };
        if (data.products.length === 0 && data.stores.length === 0 && data.sales.length === 0) {
            sse.sendChunk({ chunk: 'No inventory data found. Start by adding stores, products, and making sales to get insights!' });
            sse.sendDone({ dataUsed }); return;
        }
        const context = buildInventoryContext(data);
        const prompt = buildInventorySummaryPrompt(context, userRole);
        await streamGemini(prompt, sse);
        sse.sendDone({ dataUsed });
    } catch (err) {
        console.error('inventorySummary error:', err);
        sse.sendError(err.message);
    }
});

// ── POST /inventoryLowStock ───────────────────────────────────────────────────
app.post('/inventoryLowStock', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    const sse = initSSE(res);
    try {
        const { userRole, assignedStoreId, ownerUidForMember } = req.body;
        const data = await getAllInventoryData(decoded.uid, userRole, assignedStoreId, ownerUidForMember);
        const lowStockProducts = data.products.filter(p => p.quantity <= (p.lowStockThreshold || 10));
        const outOfStockProducts = data.products.filter(p => p.quantity === 0);
        const dataUsed = { products: data.products.length, lowStock: lowStockProducts.length, outOfStock: outOfStockProducts.length };
        if (lowStockProducts.length === 0) {
            sse.sendChunk({ chunk: '✅ Great news! All products are well-stocked. No items are below their low stock threshold.' });
            sse.sendDone({ dataUsed }); return;
        }
        const prompt = buildLowStockPrompt(lowStockProducts, outOfStockProducts.length, data.storeMap);
        await streamGemini(prompt, sse);
        sse.sendDone({ dataUsed });
    } catch (err) {
        console.error('inventoryLowStock error:', err);
        sse.sendError(err.message);
    }
});

// ── POST /askAboutCustomers ───────────────────────────────────────────────────
app.post('/askAboutCustomers', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    const sse = initSSE(res);
    try {
        const { question } = req.body;
        if (!question) { sse.sendError('Question is required', 400); return; }
        const customers = await getAllCustomers(decoded.uid);
        const context = buildCustomerContext(customers.slice(0, 20));
        const prompt = buildCustomerAskPrompt(question, context, customers.length);
        await streamGemini(prompt, sse);
        sse.sendDone({ customersUsed: customers.length });
    } catch (err) {
        console.error('askAboutCustomers error:', err);
        sse.sendError(err.message);
    }
});

// ── POST /customerSummary ─────────────────────────────────────────────────────
app.post('/customerSummary', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    const sse = initSSE(res);
    try {
        const customers = await getAllCustomers(decoded.uid);
        if (customers.length === 0) {
            sse.sendChunk({ chunk: 'No customer records found. Start adding customers to get insights!' });
            sse.sendDone({ customersUsed: 0 }); return;
        }
        const context = buildCustomerContext(customers.slice(0, 30));
        const prompt = buildCustomerSummaryPrompt(context);
        await streamGemini(prompt, sse);
        sse.sendDone({ customersUsed: customers.length });
    } catch (err) {
        console.error('customerSummary error:', err);
        sse.sendError(err.message);
    }
});

// ── POST /submitFeedback ──────────────────────────────────────────────────────
app.post('/submitFeedback', async (req, res) => {
    const decoded = requireAuth(req, res); if (!decoded) return;
    try {
        const { messageId, question, answer, rating, comment, module } = req.body;
        if (!messageId || !rating) { res.status(400).json({ error: 'messageId and rating are required' }); return; }
        if (!['up', 'down'].includes(rating)) { res.status(400).json({ error: 'rating must be "up" or "down"' }); return; }
        if (!['crm', 'inventory'].includes(module)) { res.status(400).json({ error: 'module must be "crm" or "inventory"' }); return; }

        const feedbackRef = db.collection('chatFeedback').doc(messageId);
        const existing = await feedbackRef.get();
        if (existing.exists) {
            await feedbackRef.update({ rating, comment: comment || null, updatedAt: FieldValue.serverTimestamp() });
        } else {
            await feedbackRef.set({
                userId: decoded.uid, messageId, question: question || '',
                answer: (answer || '').slice(0, 2000), rating, comment: comment || null,
                module, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
            });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('submitFeedback error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.BACKEND_PORT || 3001;
const geminiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || '';

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Local backend running at http://localhost:${PORT}`);
    console.log(`   Endpoints: askAboutInventory | inventorySummary | inventoryLowStock`);
    console.log(`             askAboutCustomers | customerSummary | submitFeedback`);
    console.log(`   Health:   http://localhost:${PORT}/health`);
    console.log(`   Gemini key: ${geminiKey ? geminiKey.slice(0, 8) + '...' + geminiKey.slice(-4) : '❌ NOT SET – add GOOGLE_AI_API_KEY to .env'}`);
    if (geminiKey.startsWith('AIzaSyC2')) {
        console.warn('   ⚠️  WARNING: This looks like your Firebase Web API key, NOT a Gemini key.');
        console.warn('   ⚠️  Get a real Gemini key at https://aistudio.google.com/apikey');
    }
    console.log();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Kill the existing process first:  lsof -ti:${PORT} | xargs kill -9`);
        console.error(`   Then retry: npm run dev:full\n`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
