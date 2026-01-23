import { Navigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';

export default function InventoryProtectedRoute({ children, requireMaster = false }) {
  const { currentUser, userProfile } = useInventoryAuth();

  if (!currentUser) {
    return <Navigate to="/inventory/login" replace />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/inventory/verify-email" replace />;
  }

  // Check if account is an inventory account
  if (userProfile?.accountType !== 'inventory') {
    return <Navigate to="/inventory/login" replace />;
  }

  // Check for master role if required
  if (requireMaster && userProfile?.role !== 'master') {
    return <Navigate to="/inventory/pos" replace />;
  }

  // Check if member account is active
  if (userProfile?.role === 'member' && !userProfile?.isActive) {
    return <Navigate to="/inventory/login" replace />;
  }

  return children;
}
