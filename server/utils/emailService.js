const nodemailer = require('nodemailer');
const fs = require('fs');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendResumeEmail = async (toAddress, pdfPath, pdfName = 'Resume.pdf') => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured in the environment variables.');
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error('PDF file not found for email attachment.');
  }

  const mailOptions = {
    from: `"RB - Resume Builder" <${process.env.SMTP_USER}>`,
    to: toAddress,
    subject: 'Here is your RB-built Resume!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6d28d9;">Your Professional Resume is Ready</h2>
        <p>Hi there,</p>
        <p>Thank you for using RB - Resume Builder & Career Networking Platform.</p>
        <p>We've attached your newly generated, ATS-optimized PDF resume to this email.</p>
        <p>Best of luck with your career journey!</p>
        <br/>
        <p><em>- The RB Team</em></p>
      </div>
    `,
    attachments: [
      {
        filename: pdfName,
        path: pdfPath,
        contentType: 'application/pdf',
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};

const sendEmail = async (toAddress, subject, text, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured in the environment variables.');
  }

  const mailOptions = {
    from: `"RB - Resume Builder" <${process.env.SMTP_USER}>`,
    to: toAddress,
    subject,
    text,
    html: html || undefined
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendResumeEmail,
  sendEmail,
};
