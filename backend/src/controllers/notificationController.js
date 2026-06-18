const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

// ────────────────────────────────────────────────
// GET MY NOTIFICATIONS
// ────────────────────────────────────────────────
const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  res.json({ notifications, unreadCount });
});

// ────────────────────────────────────────────────
// MARK NOTIFICATION AS READ
// ────────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError('Notification not found.');
  if (notification.userId !== userId) {
    throw new NotFoundError('Notification not found.');
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({ message: 'Marked as read.' });
});

// ────────────────────────────────────────────────
// MARK ALL AS READ
// ────────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ message: 'All notifications marked as read.' });
});

// ────────────────────────────────────────────────
// DELETE NOTIFICATION
// ────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('Notification not found.');
  }

  await prisma.notification.delete({ where: { id } });

  res.json({ message: 'Notification deleted.' });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
