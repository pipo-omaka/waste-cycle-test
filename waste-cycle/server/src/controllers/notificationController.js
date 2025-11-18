// server/src/controllers/notificationController.js
import { db } from '../config/firebaseConfig.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Helper function to safely get notifications collection
const getNotificationsCollection = () => {
  if (!db) {
    throw new Error('Firestore is not initialized. Please check Firebase configuration.');
  }
  return db.collection('notifications');
};

/**
 * @desc    ดึงการแจ้งเตือนทั้งหมดของผู้ใช้
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user.uid;
  const notificationsCollection = getNotificationsCollection();

  const snapshot = await notificationsCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50) // จำกัด 50 อันล่าสุด
    .get();

  const notifications = [];
  snapshot.forEach(doc => {
    notifications.push({ id: doc.id, ...doc.data() });
  });

  res.json({ success: true, count: notifications.length, data: notifications });
});

/**
 * @desc    ทำเครื่องหมายว่า "อ่านแล้ว"
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user.uid;
  const { id } = req.params;
  const notificationsCollection = getNotificationsCollection();

  const notifRef = notificationsCollection.doc(id);
  const doc = await notifRef.get();

  if (!doc.exists) {
    const error = new Error('Notification not found');
    error.status = 404;
    return next(error);
  }

  // ตรวจสอบว่าเป็นเจ้าของ
  if (doc.data().userId !== userId) {
    const error = new Error('Unauthorized');
    error.status = 403;
    return next(error);
  }

  await notifRef.update({ read: true });

  res.json({ success: true, message: 'ทำเครื่องหมายว่าอ่านแล้ว' });
});