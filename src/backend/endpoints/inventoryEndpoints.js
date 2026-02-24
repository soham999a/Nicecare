import { postSSE } from '../client/sseClient';

export async function askAboutInventory(
  question,
  _ownerUid,
  userRole,
  assignedStoreId = null,
  ownerUidForMember = null,
  onStream = null
) {
  return postSSE(
    'askAboutInventory',
    {
      question,
      userRole,
      assignedStoreId,
      ownerUidForMember,
    },
    onStream
  );
}

export async function generateInventorySummary(
  _ownerUid,
  userRole,
  assignedStoreId = null,
  ownerUidForMember = null,
  onStream = null
) {
  return postSSE(
    'inventorySummary',
    {
      userRole,
      assignedStoreId,
      ownerUidForMember,
    },
    onStream
  );
}

export async function analyzeLowStock(
  _ownerUid,
  userRole,
  assignedStoreId = null,
  ownerUidForMember = null,
  onStream = null
) {
  return postSSE(
    'inventoryLowStock',
    {
      userRole,
      assignedStoreId,
      ownerUidForMember,
    },
    onStream
  );
}
