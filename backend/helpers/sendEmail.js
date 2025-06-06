const nodemailer = require('nodemailer');
const config = require('config');

module.exports = async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.get('email.user'),
      pass: config.get('email.pass'),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: config.get('email.user'),
    to,
    subject,
    text,
  });
};
