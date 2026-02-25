const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendStatusEmail = async ({ to, name, issueId, issueTitle, status, message }) => {
  const statusColors = {
    Reported: '#3498db',
    Verified: '#9b59b6',
    'In Progress': '#f39c12',
    Resolved: '#27ae60',
    Rejected: '#e74c3c'
  };

  const color = statusColors[status] || '#333';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background: #1a73e8; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🏙️ Urban Issue Reporter</h1>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your complaint <strong>#${issueId}</strong> — "<em>${issueTitle}</em>" has been updated.</p>
        <div style="background: #f8f9fa; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0; color: ${color};">Status: ${status}</h3>
          ${message ? `<p style="margin: 10px 0 0;">${message}</p>` : ''}
        </div>
        <p>You can track your complaint at: <a href="${process.env.APP_URL || 'http://localhost:3000'}/issues/${issueId}">View Issue</a></p>
        <hr>
        <p style="color: #888; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Urban Issues <noreply@urban.com>',
      to,
      subject: `Issue #${issueId} Status Updated: ${status}`,
      html
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendStatusEmail };
