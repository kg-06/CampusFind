const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

async function sendMail(to, subject, text, html) {
  const mailOptions = {
    from: 'CampusFind keshav0795.be23@chitkara.edu.in', 
    to,
    subject,
    text,
    html
  };
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
}

module.exports = { sendMail };
