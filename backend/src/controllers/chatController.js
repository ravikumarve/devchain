const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const log = getLogger('chat');

// ────────────────────────────────────────
// LIST / SEARCH CONVERSATIONS
// ────────────────────────────────────────
const getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    include: {
      participant1: { select: { id: true, username: true, avatarUrl: true } },
      participant2: { select: { id: true, username: true, avatarUrl: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  const enriched = conversations.map((c) => {
    const otherUser =
      c.participant1.id === userId ? c.participant2 : c.participant1;
    const lastMsg = c.messages[0] || null;
    return {
      id: c.id,
      otherUser,
      relatedJobId: c.relatedJobId,
      lastMessage: lastMsg,
      unreadCount: 0, // simplified — no per-conversation read tracking yet
      createdAt: c.createdAt,
    };
  });

  res.json({ conversations: enriched });
});

// ────────────────────────────────────────
// CREATE or FIND EXISTING CONVERSATION
// ────────────────────────────────────────
const createOrGetConversation = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { participantId, relatedJobId } = req.body;

  if (!participantId) throw new BadRequestError('participantId is required');
  if (participantId === userId) throw new BadRequestError('Cannot chat with yourself');

  // Always store with consistent ordering to enforce unique constraint
  const [p1, p2] = [userId, participantId].sort();

  let conversation = await prisma.conversation.findUnique({
    where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
    include: {
      participant1: { select: { id: true, username: true, avatarUrl: true } },
      participant2: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participant1Id: p1, participant2Id: p2, relatedJobId: relatedJobId || null },
      include: {
        participant1: { select: { id: true, username: true, avatarUrl: true } },
        participant2: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    log.info({ conversationId: conversation.id }, 'Conversation created');
  }

  const otherUser = conversation.participant1.id === userId
    ? conversation.participant2
    : conversation.participant1;

  res.json({ conversation: { ...conversation, otherUser } });
});

// ────────────────────────────────────────
// GET MESSAGES IN A CONVERSATION
// ────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;
  const { before, limit = '50' } = req.query;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new NotFoundError('Conversation not found');
  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    throw new NotFoundError('Conversation not found');
  }

  const where = { conversationId };
  if (before) where.createdAt = { lt: new Date(before) };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(parseInt(limit, 10) || 50, 200),
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ messages: messages.reverse() });
});

// ────────────────────────────────────────
// SEND A MESSAGE
// ────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) throw new BadRequestError('Message content is required');
  if (content.trim().length > 5000) throw new BadRequestError('Message too long (max 5000 chars)');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new NotFoundError('Conversation not found');
  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    throw new NotFoundError('Conversation not found');
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, content: content.trim() },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  log.info({ conversationId, messageId: message.id }, 'Message sent');
  res.status(201).json({ message });
});

module.exports = { getMyConversations, createOrGetConversation, getMessages, sendMessage };
