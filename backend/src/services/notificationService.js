/**
 * Notification service — auto-creates in-app notifications for key events.
 * Called by controllers after state-changing operations.
 */
const prisma = require('../config/database');

/**
 * Create a notification for a user.
 */
async function createNotification({ userId, type, title, message, data }) {
  return prisma.notification.create({
    data: { userId, type, title, message, data: data || {} },
  });
}

// ── Proposal Events ──

async function notifyProposalReceived(job, proposal) {
  await createNotification({
    userId: job.clientId,
    type: 'proposal_received',
    title: 'New Proposal Received',
    message: `${proposal.freelancer?.username || 'A freelancer'} submitted a proposal for "${job.title}" — $${proposal.proposedRate}`,
    data: { jobId: job.id, proposalId: proposal.id },
  });
}

async function notifyProposalAccepted(proposal, job) {
  await createNotification({
    userId: proposal.freelancerId,
    type: 'proposal_accepted',
    title: 'Proposal Accepted! 🎉',
    message: `Your proposal for "${job.title}" was accepted. The client will deposit funds to start the project.`,
    data: { jobId: job.id, proposalId: proposal.id },
  });
}

async function notifyProposalRejected(proposal, job) {
  await createNotification({
    userId: proposal.freelancerId,
    type: 'proposal_rejected',
    title: 'Proposal Not Selected',
    message: `Your proposal for "${job.title}" was not selected. Keep applying to other jobs!`,
    data: { jobId: job.id, proposalId: proposal.id },
  });
}

// ── Order Events ──

async function notifyNewSale(order) {
  await createNotification({
    userId: order.product.sellerId,
    type: 'new_sale',
    title: 'New Sale! 💰',
    message: `Someone purchased "${order.product.title}" for $${(order.amount / 100).toFixed(2)}`,
    data: { orderId: order.id, productId: order.product.id },
  });
}

// ── Review Events ──

async function notifyNewReview(review) {
  await createNotification({
    userId: review.revieweeId,
    type: 'new_review',
    title: 'New Review Received',
    message: `You received a ${review.rating}-star review${review.product?.title ? ` on "${review.product.title}"` : ''}`,
    data: { reviewId: review.id, productId: review.productId },
  });
}

module.exports = {
  createNotification,
  notifyProposalReceived,
  notifyProposalAccepted,
  notifyProposalRejected,
  notifyNewSale,
  notifyNewReview,
};
