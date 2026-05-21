const nodemailer = require('nodemailer');
require('dotenv').config();

// Khởi tạo transporter cho nodemailer
const getTransporter = () => {
  // Kiểm tra nếu chưa cấu hình email trong .env
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Chưa cấu hình EMAIL_USER hoặc EMAIL_PASS trong file .env');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true cho port 465, false cho các port khác
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Gửi email chung
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `BusGo <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email qua SMTP:', error.message);
    throw new Error(error.message || 'Lỗi gửi email qua SMTP');
  }
};

/**
 * Gửi mã OTP xác nhận tài khoản
 */
const sendOTPEmail = async (email, otp) => {
  const subject = `[BusGo] Mã xác thực đăng ký tài khoản của bạn: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px;">
        <span style="font-size: 40px;">🚌</span>
        <h1 style="color: #333333; margin: 10px 0 0 0; font-size: 24px; font-weight: bold; font-family: 'Outfit', sans-serif;">BusGo</h1>
        <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Hệ thống đặt vé xe buýt thông minh</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px 20px; color: #444444; line-height: 1.6;">
        <h2 style="color: #333333; font-size: 18px; margin-top: 0;">Xin chào,</h2>
        <p>Cảm ơn bạn đã lựa chọn đăng ký tài khoản trên hệ thống <strong>BusGo</strong>. Để hoàn tất quá trình xác thực email, vui lòng sử dụng mã OTP dưới đây:</p>
        
        <!-- OTP Box -->
        <div style="text-align: center; margin: 30px 0; padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px; letter-spacing: 5px;">
          <span style="font-size: 32px; font-weight: bold; color: #764ba2; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="color: #e53e3e; font-size: 13px; font-weight: bold;">⚠️ Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; color: #999999; font-size: 12px; line-height: 1.5;">
        <p>Đây là email tự động từ hệ thống BusGo, vui lòng không phản hồi email này.</p>
        <p>&copy; 2024-2026 BusGo. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
};
