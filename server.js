'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Only needed when the frontend is hosted on a different domain than this server.
// Example: CORS_ORIGIN=https://anshuman-portfolio.vercel.app
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (allowedOrigins.length) {
  app.use('/api', cors({ origin: allowedOrigins, methods: ['GET', 'POST'] }));
}

// --- Helpers ---------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Single-line fields: strip line breaks so they can never inject mail headers
const oneLine = (value, max) =>
  String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

const multiLine = (value, max) =>
  String(value == null ? '' : value).replace(/\r\n/g, '\n').trim().slice(0, max);

const escapeHtml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

let transporter = null;
function getTransporter() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

// --- API -------------------------------------------------------------------
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many messages from this connection. Try again in 15 minutes.' },
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mailConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS) });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const body = req.body || {};

  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (body.website) return res.json({ ok: true });

  const name = oneLine(body.name, 100);
  const email = oneLine(body.email, 200);
  const subject = oneLine(body.subject, 150);
  const message = multiLine(body.message, 2000);

  if (name.length < 2) return res.status(400).json({ ok: false, error: 'Enter your name (at least 2 characters).' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  if (subject.length < 3) return res.status(400).json({ ok: false, error: 'Enter a subject (at least 3 characters).' });
  if (message.length < 10) return res.status(400).json({ ok: false, error: 'Write a message of at least 10 characters.' });

  const mailer = getTransporter();
  if (!mailer) {
    console.error('Contact form used but SMTP_USER / SMTP_PASS are not set in .env');
    return res.status(503).json({ ok: false, error: 'The contact form is not set up on the server yet.' });
  }

  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  try {
    await mailer.sendMail({
      from: { name: 'Portfolio Contact Form', address: process.env.SMTP_USER },
      to,
      replyTo: { name, address: email },
      subject: `Portfolio: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Subject:</strong> ${escapeHtml(subject)}</p>` +
            `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to send contact email:', err.message);
    return res.status(500).json({ ok: false, error: 'Your message could not be sent. Please try again later.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Not found.' }));

// --- Static frontend (for running everything locally with one command) -----
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Note: SMTP_USER / SMTP_PASS not set, so the contact form will return an error until you add them to .env');
  }
});
