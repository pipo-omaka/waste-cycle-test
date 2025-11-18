/**
 * Cleanup Script: Remove chat rooms with token strings in participants
 * 
 * PROBLEM: Some chat rooms may have been created with token strings (~884 chars) 
 * instead of Firebase UIDs (~28 chars) in the participants array.
 * 
 * SOLUTION: This script identifies and deletes chat rooms where participants 
 * contain token strings (length > 100).
 * 
 * USAGE:
 *   node scripts/cleanup-chat-rooms.js
 * 
 * WARNING: This will DELETE chat rooms with invalid participants.
 * Make sure to backup your Firestore database before running.
 */

import { db } from '../src/config/firebaseConfig.js';

const cleanupChatRooms = async () => {
  try {
    console.log('🔍 Starting cleanup of chat rooms with token strings...');
    
    // Get all chat rooms
    const chatRoomsSnapshot = await db.collection('chatRooms').get();
    
    let deletedCount = 0;
    let validCount = 0;
    const invalidRooms = [];
    
    for (const doc of chatRoomsSnapshot.docs) {
      const data = doc.data();
      const participants = Array.isArray(data.participants) ? data.participants : [];
      
      // Check if any participant is a token string (length > 100)
      const hasTokenString = participants.some(p => {
        const participantStr = String(p);
        return participantStr.length > 100;
      });
      
      if (hasTokenString) {
        console.log(`❌ Found invalid chat room: ${doc.id}`);
        console.log(`   Participants: ${JSON.stringify(participants.map(p => `${String(p).substring(0, 50)}... (${String(p).length} chars)`))}`);
        
        invalidRooms.push({
          id: doc.id,
          participants: participants,
          createdAt: data.createdAt || 'unknown'
        });
        
        // Delete the chat room
        await db.collection('chatRooms').doc(doc.id).delete();
        console.log(`   ✅ Deleted chat room ${doc.id}`);
        deletedCount++;
      } else {
        validCount++;
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   ✅ Valid chat rooms: ${validCount}`);
    console.log(`   ❌ Deleted invalid chat rooms: ${deletedCount}`);
    
    if (invalidRooms.length > 0) {
      console.log('\n📋 Deleted Rooms:');
      invalidRooms.forEach(room => {
        console.log(`   - ${room.id} (created: ${room.createdAt})`);
      });
    }
    
    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupChatRooms();

