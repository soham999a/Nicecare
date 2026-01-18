import { vi } from 'vitest';

// Mock Firebase Auth
export const mockUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
};

export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockUser);
    return vi.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
};

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
};

// Mock the firebase config module
vi.mock('../../config/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
}));
