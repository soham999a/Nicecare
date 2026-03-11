import { postJson } from '../backend/client/httpClient';

export async function reconcileInventoryConsistency({ apply = false } = {}) {
  return postJson('inventoryConsistencyReconcile', { apply: Boolean(apply) });
}
