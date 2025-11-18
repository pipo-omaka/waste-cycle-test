/**
 * Script สำหรับสร้าง user ใน Firebase Authentication
 * 
 * วิธีใช้:
 * 1. เปิด terminal ในโฟลเดอร์ server
 * 2. รันคำสั่ง: node scripts/create-users.js
 * 
 * หรือแก้ไข email และ password ด้านล่างแล้วรัน
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let auth;

try {
  // Try to load service account from environment or file
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '../serviceAccountKey.json');
  
  // Read service account file
  const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  initializeApp({
    credential: cert(serviceAccount),
  });
  
  auth = getAuth();
  console.log('✅ Firebase Admin initialized successfully');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.error('\n📝 Please ensure:');
  console.error('   1. serviceAccountKey.json exists in server/ directory');
  console.error('   2. Or set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
  console.error(`   3. Error details: ${error.stack}`);
  process.exit(1);
}

/**
 * สร้าง user ใน Firebase Authentication
 * @param {string} email - Email ของ user
 * @param {string} password - Password ของ user
 * @param {string} displayName - ชื่อที่แสดง (optional)
 */
async function createUser(email, password, displayName = null) {
  try {
    // ตรวจสอบว่า user มีอยู่แล้วหรือไม่
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`⚠️  User ${email} already exists (UID: ${userRecord.uid})`);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User ไม่มีอยู่ → สร้างใหม่
        console.log(`📝 Creating new user: ${email}`);
      } else {
        throw error;
      }
    }
    
    // สร้าง user ใหม่
    userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false,
    });
    
    console.log(`✅ User created successfully:`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
    
    return userRecord;
  } catch (error) {
    console.error(`❌ Failed to create user ${email}:`, error.code, error.message);
    throw error;
  }
}

/**
 * เปลี่ยน password ของ user
 * @param {string} email - Email ของ user
 * @param {string} newPassword - Password ใหม่
 */
async function updateUserPassword(email, newPassword) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, {
      password: newPassword,
    });
    console.log(`✅ Password updated for ${email}`);
  } catch (error) {
    console.error(`❌ Failed to update password for ${email}:`, error.code, error.message);
    throw error;
  }
}

/**
 * ลบ user
 * @param {string} email - Email ของ user
 */
async function deleteUser(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.deleteUser(userRecord.uid);
    console.log(`✅ User ${email} deleted successfully`);
  } catch (error) {
    console.error(`❌ Failed to delete user ${email}:`, error.code, error.message);
    throw error;
  }
}

/**
 * แสดงรายการ users ทั้งหมด
 */
async function listUsers() {
  try {
    const listUsersResult = await auth.listUsers();
    console.log(`\n📋 Total users: ${listUsersResult.users.length}`);
    listUsersResult.users.forEach((user) => {
      console.log(`   - ${user.email} (UID: ${user.uid})`);
    });
  } catch (error) {
    console.error('❌ Failed to list users:', error.message);
    throw error;
  }
}

// ============================================
// ตัวอย่างการใช้งาน
// ============================================

async function main() {
  console.log('🚀 Firebase User Management Script\n');
  
  try {
    // ============================================
    // แก้ไข email และ password ตรงนี้
    // ============================================
    
    const usersToCreate = [
      {
        email: 'A@gmail.com',
        password: 'password123', // ⚠️ เปลี่ยนเป็น password ที่ต้องการ
        displayName: 'User A',
      },
      {
        email: 'B@gmail.com',
        password: 'password123', // ⚠️ เปลี่ยนเป็น password ที่ต้องการ
        displayName: 'User B',
      },
      // เพิ่ม user อื่นๆ ได้ที่นี่
    ];
    
    // สร้าง users
    console.log('📝 Creating users...\n');
    for (const userData of usersToCreate) {
      await createUser(userData.email, userData.password, userData.displayName);
      console.log(''); // Empty line for readability
    }
    
    // แสดงรายการ users ทั้งหมด
    console.log('\n📋 Listing all users:');
    await listUsers();
    
    console.log('\n✅ Script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Users can now login with their email and password');
    console.log('   2. After first login, user profile will be auto-created in Firestore');
    console.log('   3. Users can change their password in the app');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

