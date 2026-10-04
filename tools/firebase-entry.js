export { initializeApp, getApps, getApp } from 'firebase/app';
export { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, GoogleAuthProvider, connectAuthEmulator,
  signInWithCredential } from 'firebase/auth';
export { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, deleteField, onSnapshot, serverTimestamp,
  connectFirestoreEmulator, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
