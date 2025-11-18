import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Configuration for Frontend
 * 
 * CRITICAL: ต้องใช้โปรเจกต์เดียวกับ Backend (waste-cycle-a6c6e)
 * 
 * วิธีหา Firebase Web App Config:
 * 1. ไปที่: https://console.firebase.google.com/project/waste-cycle-a6c6e/settings/general
 * 2. เลื่อนลงไปหา "Your apps" section
 * 3. คลิกที่ Web app (</>) icon หรือ "Add app" ถ้ายังไม่มี
 * 4. Copy config values จากที่นั่น
 * 
 * หรือสร้างไฟล์ .env ใน client/ directory:
 * VITE_FIREBASE_API_KEY=your_api_key_here
 * VITE_FIREBASE_AUTH_DOMAIN=waste-cycle-a6c6e.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=waste-cycle-a6c6e
 * VITE_FIREBASE_STORAGE_BUCKET=waste-cycle-a6c6e.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * VITE_FIREBASE_APP_ID=your_app_id
 */

// ✅ CRITICAL FIX: ใช้โปรเจกต์เดียวกับ Backend (waste-cycle-a6c6e)
// สำหรับ Vite: ใช้ import.meta.env แทน process.env
// Environment variables ต้องขึ้นต้นด้วย VITE_ เพื่อให้ Vite expose ให้ frontend

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "waste-cycle-a6c6e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "waste-cycle-a6c6e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "waste-cycle-a6c6e.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Validate that required config values are set
const missingConfig: string[] = [];

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
  missingConfig.push('VITE_FIREBASE_API_KEY');
}

if (!firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId === "") {
  missingConfig.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
}

if (!firebaseConfig.appId || firebaseConfig.appId === "") {
  missingConfig.push('VITE_FIREBASE_APP_ID');
}

// Initialize Firebase app
let app;
let db;
let auth;

if (missingConfig.length > 0) {
  // Config is missing - show error but don't crash
  const errorMessage = `
❌ CRITICAL: Firebase configuration is missing!

Missing: ${missingConfig.join(', ')}

Solution:
1. Create a .env file in client/ directory:
   cd waste-cycle/client
   cp .env.example .env

2. Open .env file and fill in the values from Firebase Console:
   https://console.firebase.google.com/project/waste-cycle-a6c6e/settings/general
   → Scroll to "Your apps" → Click Web app (</>) icon
   → Copy the config values

3. Restart the development server:
   npm run dev

Required variables:
   VITE_FIREBASE_API_KEY=AIzaSy...your_api_key
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=1:xxxxx:web:xxxxx
`;
  console.error(errorMessage);
  
  // Use dummy config to prevent crash, but Firebase won't work
  const dummyConfig = {
    apiKey: "MISSING_API_KEY",
    authDomain: "waste-cycle-a6c6e.firebaseapp.com",
    projectId: "waste-cycle-a6c6e",
    storageBucket: "waste-cycle-a6c6e.appspot.com",
    messagingSenderId: "MISSING_SENDER_ID",
    appId: "MISSING_APP_ID"
  };
  
  app = initializeApp(dummyConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Validate that projectId matches backend
  if (firebaseConfig.projectId !== 'waste-cycle-a6c6e') {
    console.error('❌ CRITICAL: Frontend projectId does not match Backend!');
    console.error(`   Frontend: ${firebaseConfig.projectId}`);
    console.error(`   Backend: waste-cycle-a6c6e`);
    console.error('   This will cause verifyIdToken() to fail with "incorrect aud" error');
  } else {
    // All config is valid
    console.log('✅ Firebase configuration loaded successfully');
    console.log(`📁 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

// MULTI-USER: Export Firestore instance for real-time chat
export { db, auth };
export default app;
