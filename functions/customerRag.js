import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Text Representation ─────────────────────────────────────────────────────

function customerToText(customer) {
  const parts = [];
  if (customer.name) parts.push(`Customer: ${customer.name}`);
  if (customer.email) parts.push(`Email: ${customer.email}`);
  if (customer.phone) parts.push(`Phone: ${customer.phone}`);
  if (customer.address) parts.push(`Address: ${customer.address}`);
  if (customer.status) parts.push(`Status: ${customer.status}`);
  if (customer.deviceType) parts.push(`Device: ${customer.deviceType}`);
  if (customer.brand) parts.push(`Brand: ${customer.brand}`);
  if (customer.model) parts.push(`Model: ${customer.model}`);
  if (customer.issueCategory) parts.push(`Issue: ${customer.issueCategory}`);
  if (customer.issueDescription) parts.push(`Description: ${customer.issueDescription}`);
  if (customer.repairType) parts.push(`Repair Type: ${customer.repairType}`);
  if (customer.priority) parts.push(`Priority: ${customer.priority}`);
  if (customer.estimatedCost) parts.push(`Estimated Cost: $${customer.estimatedCost}`);
  if (customer.notes) parts.push(`Notes: ${customer.notes}`);
  if (customer.technicalStaffName) parts.push(`Technician: ${customer.technicalStaffName}`);
  if (customer.submissionDate) parts.push(`Submitted: ${customer.submissionDate}`);
  if (customer.expectedDate) parts.push(`Expected: ${customer.expectedDate}`);
  return parts.join(', ');
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

export async function getAllCustomers(ownerUid) {
  const db = getFirestore();
  const snapshot = await db.collection('customers')
    .where('ownerUid', '==', ownerUid)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

function buildContextFromCustomers(customers) {
  if (customers.length === 0) return 'No customer records found.';
  return customers.map((c, i) => `${i + 1}. ${customerToText(c)}`).join('\n');
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

export function buildAskPrompt(question, context, customerCount) {
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

export function buildSummaryPrompt(context) {
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

export { buildContextFromCustomers };
