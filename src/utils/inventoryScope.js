export function isStoreScopedRole(role) {
  return role === 'manager' || role === 'member';
}

export function resolveOwnerUid(currentUser, userProfile) {
  if (!currentUser || !userProfile) return null;

  if (userProfile.role === 'master') {
    return userProfile.ownerUid || userProfile.masterUid || currentUser.uid || null;
  }

  if (isStoreScopedRole(userProfile.role)) {
    return userProfile.ownerUid || userProfile.masterUid || null;
  }

  return null;
}

export function resolveScopedStoreId(userProfile, requestedStoreId = null) {
  if (!userProfile) return requestedStoreId;
  return isStoreScopedRole(userProfile.role)
    ? (userProfile.assignedStoreId || null)
    : (requestedStoreId || null);
}
