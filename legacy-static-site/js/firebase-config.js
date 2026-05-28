/* ============================================
   BIKERCLINIC — FIREBASE CONFIG
   Shared configuration for Frontend and Admin Panel
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// TODO: Replace these with your actual Firebase Project config keys
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Add a mock-mode flag so the site still works even if keys are invalid during demo
const IS_MOCK_MODE = firebaseConfig.apiKey === "YOUR_API_KEY";

export { app, db, auth, IS_MOCK_MODE };
