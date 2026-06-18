/**
 * Email service for DevChain
 * Uses nodemailer for SMTP-based transactional emails
 */
const nodemailer = require('nodemailer');
const { getLogger } = require('../utils/logger');

const log = getLogger('email');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Email templates ──
const templates = {
  purchaseReceipt: (buyerName, productName, price, downloadUrl) => ({
    subject: 'Your DevChain Purchase Receipt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Thank you for your purchase!</h2>
        <p>Hello ${buyerName},</p>
        <p>Your purchase of <strong>${productName}</strong> has been completed successfully.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Details</h3>
          <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${price}</p>
          <p style="margin: 5px 0;"><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>You can download your files anytime from your DevChain account:</p>
        <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background: #7C3AED; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Files</a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
      </div>
    `,
  }),

  saleNotification: (sellerName, productName, buyerName, price) => ({
    subject: 'New Sale on DevChain!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Congratulations on your sale!</h2>
        <p>Hello ${sellerName},</p>
        <p>Your product <strong>${productName}</strong> has been purchased by ${buyerName}.</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">Sale Details</h3>
          <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
          <p style="margin: 5px 0;"><strong>Buyer:</strong> ${buyerName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> $${price}</p>
          <p style="margin: 5px 0;"><strong>Sale Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>This sale has been added to your seller dashboard analytics.</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">Keep up the great work!</p>
      </div>
    `,
  }),
};

// ── Send email ──
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    log.warn('SMTP not configured — email not sent');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"DevChain" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    log.info({ messageId: info.messageId, to }, 'Email sent');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    log.error({ err: error, to }, 'Failed to send email');
    return { success: false, error: error.message };
  }
}

// ── Public API ──
const emailService = {
  sendPurchaseReceipt: (buyerEmail, buyerName, productName, price, downloadUrl) => {
    const tpl = templates.purchaseReceipt(buyerName, productName, price, downloadUrl);
    return sendEmail(buyerEmail, tpl.subject, tpl.html);
  },

  sendSaleNotification: (sellerEmail, sellerName, productName, buyerName, price) => {
    const tpl = templates.saleNotification(sellerName, productName, buyerName, price);
    return sendEmail(sellerEmail, tpl.subject, tpl.html);
  },

  testEmailConfig: async () => {
    if (!process.env.SMTP_USER) {
      return { success: false, error: 'SMTP_USER not configured' };
    }
    return sendEmail(
      process.env.SMTP_USER,
      'DevChain Email Test',
      `<h2>Email Configuration Works!</h2><p>Server Time: ${new Date().toLocaleString()}</p>`
    );
  },
};

module.exports = emailService;
