const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from:    `"Water AMC System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(' Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error(' Email error:', err.message);
    throw err;
  }
}

module.exports = sendEmail;