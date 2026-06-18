const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

// Validation schemas
const createConversationSchema = Joi.object({
  participantId: Joi.string().uuid().required(),
  relatedJobId: Joi.string().uuid().optional(),
});

const sendMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
});

// Routes — order matters: static before parameterized
router.get('/', protect, getMyConversations);
router.post('/', protect, validate(createConversationSchema), createOrGetConversation);
router.get('/:conversationId/messages', protect, getMessages);
router.post('/:conversationId/messages', protect, validate(sendMessageSchema), sendMessage);

module.exports = router;
