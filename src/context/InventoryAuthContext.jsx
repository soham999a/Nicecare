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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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

    await setDoc(doc(db, 'inventoryUsers', user.uid), profileData);

    // Send email verification
    await sendEmailVerification(user);

    setUserProfile(profileData);
    return user;
  }

  // Create employee (Member) account - called by Master
  // This now creates an INVITATION instead of creating an auth account directly
  async function createEmployee(employeeData) {
    if (!currentUser || userProfile?.role !== 'master') {
      throw new Error('Only master accounts can create employees');
    }

    // Generate a unique invitation code
    const inviteCode = generateInviteCode();
    
    // Create invitation record in Firestore
    const invitationData = {
      email: employeeData.email.toLowerCase().trim(),
      name: employeeData.name,
      phone: employeeData.phone || '',
      assignedStoreId: employeeData.storeId,
      assignedStoreName: employeeData.storeName || '',
      ownerUid: currentUser.uid,
      ownerBusinessName: userProfile?.displayName || '',
      inviteCode: inviteCode,
      status: 'pending', // pending, accepted, expired
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    // Store invitation by invite code for easy lookup
    await setDoc(doc(db, 'employeeInvitations', inviteCode), invitationData);
    
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
    const inviteDoc = await getDoc(doc(db, 'employeeInvitations', inviteCode));
    
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
        } catch (signInError) {
          throw new Error('This email is already registered. Please use your existing password or reset it.');
        }
      } else {
        throw error;
      }
    }

    // Create employee profile in Firestore
    const employeeProfile = {
      email: user.email,
      displayName: invitation.name,
      phone: invitation.phone || '',
      role: 'member',
      accountType: 'inventory',
      assignedStoreId: invitation.assignedStoreId,
      assignedStoreName: invitation.assignedStoreName || '',
      ownerUid: invitation.ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    await setDoc(doc(db, 'inventoryUsers', user.uid), employeeProfile);

    // Also add to employees collection for easier querying
    await setDoc(doc(db, 'employees', user.uid), {
      ...employeeProfile,
      uid: user.uid,
    });

    // Mark invitation as accepted
    await updateDoc(doc(db, 'employeeInvitations', inviteCode), {
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
    const inviteDoc = await getDoc(doc(db, 'employeeInvitations', inviteCode));
    
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
      }
    };
  }

  // Resend/Regenerate invitation
  async function resendInvitation(oldInviteCode) {
    if (!currentUser || userProfile?.role !== 'master') {
      throw new Error('Only master accounts can resend invitations');
    }
    
    const oldInviteDoc = await getDoc(doc(db, 'employeeInvitations', oldInviteCode));
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
    
    await setDoc(doc(db, 'employeeInvitations', newInviteCode), newInvitationData);
    
    // Mark old invitation as expired
    await updateDoc(doc(db, 'employeeInvitations', oldInviteCode), {
      status: 'expired',
    });
    
    return newInviteCode;
  }

  // Login for both Master and Member
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user profile to check account type
    const profileDoc = await getDoc(doc(db, 'inventoryUsers', user.uid));
    
    if (!profileDoc.exists()) {
      await signOut(auth);
      throw new Error('This account is not registered for Inventory Management. Please use the CRM login.');
    }

    const profile = profileDoc.data();
    
    if (profile.accountType !== 'inventory') {
      await signOut(auth);
      throw new Error('This account is not registered for Inventory Management. Please use the CRM login.');
    }

    // Check if employee account is active
    if (profile.role === 'member' && !profile.isActive) {
      await signOut(auth);
      throw new Error('Your account has been deactivated. Please contact your administrator.');
    }

    setUserProfile(profile);
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
    const profileDoc = await getDoc(doc(db, 'inventoryUsers', uid));
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
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
      collection(db, 'employees'),
      where('masterUid', '==', currentUser.uid)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Check if user is master
  function isMaster() {
    return userProfile?.role === 'master';
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
    logout,
    resetPassword,
    resendVerificationEmail,
    fetchUserProfile,
    getEmployees,
    isMaster,
    isMember,
    getAssignedStoreId,
  };

  return (
    <InventoryAuthContext.Provider value={value}>
      {!loading && children}
    </InventoryAuthContext.Provider>
  );
}
