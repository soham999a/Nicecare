import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseWirelessConfig = {
  apiKey: "AIzaSyCKYgFJtaHaj9FbRB942m-tCCUdBBMGcSk",
  authDomain: "nicecare-b564f.firebaseapp.com",
  projectId: "nicecare-b564f",
  storageBucket: "nicecare-b564f.firebasestorage.app",
  messagingSenderId: "176132508080",
  appId: "1:176132508080:web:5164e5e4c31606c3fa6e75"
};

const wirelessApp = initializeApp(firebaseWirelessConfig, 'wireless');
export const wirelessDb = getFirestore(wirelessApp);
export const wirelessAuth = getAuth(wirelessApp);
export const googleProvider = new GoogleAuthProvider();
export default wirelessApp;
