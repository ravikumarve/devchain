const express = require('express');
const Joi = require('joi');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const notificationIdParam = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, validate(notificationIdParam), markAsRead);
router.delete('/:id', protect, validate(notificationIdParam), deleteNotification);

module.exports = router;
