import nodemailer from 'nodemailer';
import config from 'config';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendResetPasswordEmail(to, username, resetLink) {
  const html = await renderTemplate('reset-password', { username, resetLink });

  await sendEmail({
    to,
    subject: 'Reset Your Password',
    html,
    text: `Hello ${username},\nYou can reset your password by clicking this link: ${resetLink}`,
  });
}

export async function sendVerifyEmail(to, username, verificationLink) {
  const html = await renderTemplate('verify-email', { username, verificationLink });

  await sendEmail({
    to,
    subject: 'Please verify your email',
    html,
    text: `Hello ${username},\nPlease verify your email by clicking this link: ${verificationLink}`,
  });
}

export async function sendWeeklyPromotionEmail(to, promotions, unsubscribeLink) {
  const html = await renderTemplate('weekly-promotions', { promotions, unsubscribeLink, frontendLink: config.get('frontendLink') });

  // const text = generatePlainTextFromPromotions(promotions, unsubscribeLink);

  await sendEmail({
    to,
    subject: 'Weekly Promotions Just for You',
    html,
  });
}

// helpers
handlebars.registerHelper('formatDate', (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

handlebars.registerHelper('isUpcoming', (startDate) => {
  return new Date(startDate) > new Date();
});

const templatesCache = {};

async function renderTemplate(templateName, data) {
  if (!templatesCache[templateName]) {
    const filePath = path.join(__dirname, '..', 'emails', `${templateName}.hbs`);
    const source = await fs.readFile(filePath, 'utf8');
    templatesCache[templateName] = handlebars.compile(source);
  }
  return templatesCache[templateName](data);
}

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

async function sendEmail({ to, subject, text, html, attachments }) {
  const mailOptions = {
    from: config.get('email.user'),
    to,
    subject,
    text,
    html,
    attachments,
  };

  await transporter.sendMail(mailOptions);
}
