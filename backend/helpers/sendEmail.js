const nodemailer = require('nodemailer');
const config = require('config');

module.exports = async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: config.get('email.user'),
      pass: config.get('email.pass')
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};
