import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = env.smtpUser?.trim();
  const pass = env.smtpPass?.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const recipientName = name || 'ผู้ใช้งาน';
  const mailer = getTransporter();

  // Always log to console in non-production for easy dev testing
  if (env.nodeEnv !== 'production') {
    console.log(`\n======================================================`);
    console.log(`🔗 [DEV PASSWORD RESET LINK]`);
    console.log(`To: ${to} (${recipientName})`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`======================================================\n`);
  }

  if (!mailer) {
    console.warn(`[MAILER] SMTP credentials not fully configured. Email was not sent via network.`);
    return false;
  }

  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รีเซ็ตรหัสผ่าน PawFeed</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand {
      display: inline-block;
      font-size: 26px;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: -0.5px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 16px 0 8px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .button-wrap {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
    }
    .footnote {
      font-size: 13px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      margin-top: 28px;
      line-height: 1.5;
    }
    .link-alt {
      word-break: break-all;
      color: #ea580c;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">🐾 PawFeed</div>
      <h1 class="title">คำขอตั้งรหัสผ่านใหม่</h1>
    </div>
    <p class="text">สวัสดีคุณ <strong>${recipientName}</strong>,</p>
    <p class="text">
      เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี PawFeed ของคุณ คลิกที่ปุ่มด้านล่างเพื่อกำหนดรหัสผ่านใหม่:
    </p>
    <div class="button-wrap">
      <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">ตั้งรหัสผ่านใหม่</a>
    </div>
    <p class="text" style="font-size: 13px; color: #64748b;">
      ⏱️ ลิงก์นี้จะหมดอายุภายใน <strong>30 นาที</strong> เพื่อความปลอดภัยของบัญชีคุณ
    </p>
    <p class="text" style="font-size: 13px; color: #64748b;">
      หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้อย่างปลอดภัย รหัสผ่านเดิมของคุณจะยังคงใช้งานได้ตามปกติ
    </p>
    <div class="footnote">
      หากปุ่มด้านบนใช้งานไม่ได้ คุณสามารถคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ได้โดยตรง:<br>
      <a href="${resetUrl}" class="link-alt">${resetUrl}</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject: '[PawFeed] คำขอรีเซ็ตรหัสผ่านของคุณ',
      text: `สวัสดีคุณ ${recipientName},\n\nคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่สำหรับ PawFeed:\n${resetUrl}\n\n(ลิงก์นี้หมดอายุภายใน 30 นาที)\nหากคุณไม่ได้ขอ สามารถเพิกเฉยอีเมลนี้ได้`,
      html,
    });
    return true;
  } catch (error) {
    console.error(`[MAILER] Failed to send email to ${to}:`, error.message);
    return false;
  }
}
