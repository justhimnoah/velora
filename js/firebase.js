import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA711M-_v2nF5RKr0qajfVMJYfKvLRItug",
  authDomain: "orbit-console-29397.firebaseapp.com",
  projectId: "orbit-console-29397",
  storageBucket: "orbit-console-29397.firebasestorage.app",
  messagingSenderId: "335108121258",
  appId: "1:335108121258:web:e7317be74a18254a5be6d3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);