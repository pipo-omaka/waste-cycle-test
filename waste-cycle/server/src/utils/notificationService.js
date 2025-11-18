import { db } from '../config/firebaseConfig.js';

const createNotification = async (userId, type, message, link) => {
  try {
    await db.collection('notifications').add({
      userId,
      type,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    });
    // console.log('Notification created for user:', userId);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export {
  createNotification
};