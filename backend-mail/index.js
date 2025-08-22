const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
app.use(express.json());

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error('EMAIL_USER and EMAIL_PASS must be set');
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendWelcomeEmail(employee) {
  const { name, email, password } = employee;
  const subject = 'Welcome to HR Portal';
  const text = `Dear ${name}, your HR portal account has been created. Username: ${email}, Password: ${password}. Please login and change your password immediately.`;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject, text });
    console.log('✅ Email sent to', email);
    return true;
  } catch (err) {
    console.error('❌ Error sending email', err && (err.stack || err.message));
    throw err;
  }
}

// Expose endpoint for direct POST (optional)
app.post('/send-welcome-email', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.name || !payload.email || !payload.password) return res.status(400).json({ error: 'name,email,password required' });
    await sendWelcomeEmail(payload);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Export function for direct require()
module.exports = { sendWelcomeEmail };

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('Mailer listening on', port));
