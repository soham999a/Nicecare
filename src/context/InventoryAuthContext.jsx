import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
/* eslint-disable react-refresh/only-export-components */
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../backend/firestore/collections';

const InventoryAuthContext = createContext();

export function useInventoryAuth() {
  return useContext(InventoryAuthContext);
}

export function InventoryAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup for Master (Business Owner) account
  async function signupMaster(email, password, businessName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    if (businessName) {
      await updateProfile(user, { displayName: businessName });
    }

    await user.reload();

    // Create master user profile in Firestore
    const profileData = {
      email: user.email,
      displayName: businessName || '',
      role: 'master',
      accountType: 'inventory',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, user.uid), profileData);

    // Send email verification
    await sendEmailVerification(user);

    setUserProfile(profileData);
    return user;
  }

  // Create employee (Member) account - called by Master
  // This now creates an INVITATION instead of creating an auth account directly
  async function createEmployee(employeeData) {
    if (!currentUser || !userProfile || (userProfile.role !== 'master' && userProfile.role !== 'manager')) {
      throw new Error('Only master and manager accounts can create employees');
    }

    const isMaster = userProfile.role === 'master';
    const masterUid = isMaster ? currentUser.uid : (userProfile.ownerUid || userProfile.masterUid);

    // Only masters can invite managers; managers can only invite members into their own store
    const requestedRole = employeeData.role === 'manager' && isMaster ? 'manager' : 'member';

    let assignedStoreId = employeeData.storeId;
    let assignedStoreName = employeeData.storeName || '';

    if (!isMaster) {
      assignedStoreId = userProfile.assignedStoreId;
      assignedStoreName = userProfile.assignedStoreName || assignedStoreName;
    }

    // Generate a unique invitation code
    const inviteCode = generateInviteCode();
    
    // Create invitation record in Firestore
    const invitationData = {
      email: employeeData.email.toLowerCase().trim(),
      name: employeeData.name,
      phone: employeeData.phone || '',
      assignedStoreId,
      assignedStoreName,
      ownerUid: masterUid || currentUser.uid,
      ownerBusinessName: userProfile?.displayName || '',
      inviteCode: inviteCode,
      role: requestedRole,
      status: 'pending', // pending, accepted, expired
      createdAt: serverTimestamp(),
      // eslint-disable-next-line react-hooks/purity -- called from event handler, not render
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    // Store invitation by invite code for easy lookup
    await setDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, inviteCode), invitationData);
    
    // Return the invitation data with invite code for master to share
    return {
      email: employeeData.email,
      inviteCode: inviteCode,
      ...invitationData,
    };
  }

  // Signup for Employee using invitation code
  async function signupEmployee(email, password, inviteCode) {
    // First, verify the invitation
    const inviteDoc = await getDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, inviteCode));
    
    if (!inviteDoc.exists()) {
      throw new Error('Invalid invitation code. Please check and try again.');
    }
    
    const invitation = inviteDoc.data();
    
    // Check if invitation email matches
    if (invitation.email.toLowerCase() !== email.toLowerCase().trim()) {
      throw new Error('This invitation was sent to a different email address.');
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('This invitation has already been used or expired.');
    }
    
    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      throw new Error('This invitation has expired. Please ask your employer for a new invitation.');
    }

    // Check if user already exists with this email (they may have a CRM account)
    let user;
    let isExistingUser = false;
    
    try {
      // Try to create a new account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName: invitation.name });
      
      // Send email verification for new users
      await sendEmailVerification(user);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // Email exists - try to sign in with provided password
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          isExistingUser = true;
        } catch (_signInError) {
          throw new Error('This email is already registered. Please use your existing password or reset it.');
        }
      } else {
        throw error;
      }
    }

    // Determine role from invitation (manager or member)
    const role = invitation.role === 'manager' ? 'manager' : 'member';

    // Create employee/manager profile in Firestore
    const employeeProfile = {
      email: user.email,
      displayName: invitation.name,
      phone: invitation.phone || '',
      role,
      accountType: 'inventory',
      assignedStoreId: invitation.assignedStoreId,
      assignedStoreName: invitation.assignedStoreName || '',
      ownerUid: invitation.ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    await setDoc(doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, user.uid), employeeProfile);

    // Also add to employees collection for easier querying
    await setDoc(doc(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS, user.uid), {
      ...employeeProfile,
      uid: user.uid,
    });

    // Increment the assigned store's employeeCount
    if (invitation.assignedStoreId) {
      const storeRef = doc(db, COLLECTIONS.BUSINESS_STORE_LOCATIONS, invitation.assignedStoreId);
      const storeDoc = await getDoc(storeRef);
      if (storeDoc.exists()) {
        const currentCount = storeDoc.data().employeeCount || 0;
        await updateDoc(storeRef, {
          employeeCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Mark invitation as accepted
    await updateDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, inviteCode), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedByUid: user.uid,
    });

    setUserProfile(employeeProfile);
    
    return {
      user,
      isExistingUser,
      needsVerification: !user.emailVerified && !isExistingUser,
    };
  }

  // Generate unique invitation code
  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Check invitation validity (for pre-signup validation)
  async function checkInvitation(inviteCode) {
    const inviteDoc = await getDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, inviteCode));
    
    if (!inviteDoc.exists()) {
      return { valid: false, error: 'Invalid invitation code' };
    }
    
    const invitation = inviteDoc.data();
    
    if (invitation.status !== 'pending') {
      return { valid: false, error: 'This invitation has already been used' };
    }
    
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }
    
    return { 
      valid: true, 
      invitation: {
        email: invitation.email,
        name: invitation.name,
        storeName: invitation.assignedStoreName,
        businessName: invitation.ownerBusinessName,
        role: invitation.role || 'member',
      }
    };
  }

  // Resend/Regenerate invitation
  async function resendInvitation(oldInviteCode) {
    if (!currentUser || userProfile?.role !== 'master') {
      throw new Error('Only master accounts can resend invitations');
    }
    
    const oldInviteDoc = await getDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, oldInviteCode));
    if (!oldInviteDoc.exists()) {
      throw new Error('Original invitation not found');
    }
    
    const oldInvitation = oldInviteDoc.data();
    
    // Generate new invite code
    const newInviteCode = generateInviteCode();
    
    // Create new invitation
    const newInvitationData = {
      ...oldInvitation,
      inviteCode: newInviteCode,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    
    await setDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, newInviteCode), newInvitationData);
    
    // Mark old invitation as expired
    await updateDoc(doc(db, COLLECTIONS.STAFF_ONBOARDING_INVITATIONS, oldInviteCode), {
      status: 'expired',
    });
    
    return newInviteCode;
  }

  // Login for both Master and Member. Existing accounts without an inventory profile
  // get needsInventoryRegistration and can complete setup at /inventory/complete-registration.
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const profileDoc = await getDoc(doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, user.uid));

    if (!profileDoc.exists()) {
      setUserProfile(null);
      return { user, needsInventoryRegistration: true };
    }

    const profile = profileDoc.data();

    if (profile.accountType !== 'inventory') {
      setUserProfile(null);
      return { user, needsInventoryRegistration: true };
    }

    // Block non-master users that have been deactivated
    if (profile.role !== 'master' && !profile.isActive) {
      await signOut(auth);
      throw new Error('Your account has been deactivated. Please contact your administrator.');
    }

    setUserProfile(profile);
    return user;
  }

  // Register an existing Firebase account (e.g. from old CRM signup) as a master inventory account.
  async function registerExistingAccountAsMaster(businessName) {
    if (!auth.currentUser) {
      throw new Error('You must be signed in to complete registration.');
    }
    const user = auth.currentUser;

    const profileData = {
      email: user.email,
      displayName: (businessName || '').trim() || user.displayName || '',
      role: 'master',
      accountType: 'inventory',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, user.uid), profileData);
    setUserProfile(profileData);
    return user;
  }

  // Logout
  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Resend verification email
  function resendVerificationEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error('No user logged in');
  }

  // Fetch user profile
  async function fetchUserProfile(uid) {
    const profileDoc = await getDoc(doc(db, COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES, uid));
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
      // #region agent log
      fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H6',location:'src/context/InventoryAuthContext.jsx',message:'Inventory profile fetched',data:{role:profile?.role||null,accountType:profile?.accountType||null,hasOwnerUid:!!(profile?.ownerUid||profile?.masterUid),assignedStoreId:profile?.assignedStoreId||null,isActive:profile?.isActive??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setUserProfile(profile);
      return profile;
    }
    return null;
  }

  // Get employees for a master account
  async function getEmployees() {
    if (!currentUser || userProfile?.role !== 'master') {
      return [];
    }

    const q = query(
      collection(db, COLLECTIONS.STORE_STAFF_ASSIGNMENTS),
      where('ownerUid', '==', currentUser.uid)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Check if user is master
  function isMaster() {
    return userProfile?.role === 'master';
  }

  // Check if user is manager
  function isManager() {
    return userProfile?.role === 'manager';
  }

  // Check if user is member
  function isMember() {
    return userProfile?.role === 'member';
  }

  // Get assigned store ID for members
  function getAssignedStoreId() {
    return userProfile?.assignedStoreId || null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch profile for inventory users
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signupMaster,
    signupEmployee,
    createEmployee,
    checkInvitation,
    resendInvitation,
    login,
    registerExistingAccountAsMaster,
    logout,
    resetPassword,
    resendVerificationEmail,
    fetchUserProfile,
    getEmployees,
    isMaster,
    isManager,
    isMember,
    getAssignedStoreId,
  };

  return (
    <InventoryAuthContext.Provider value={value}>
      {!loading && children}
    </InventoryAuthContext.Provider>
  );
}
