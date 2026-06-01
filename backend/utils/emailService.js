const nodemailer = require('nodemailer');
const moment = require('moment');

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an E-Ticket email to the customer.
 * @param {Object} bookingData - The booking information.
 * @param {string} bookingData.email - Customer email.
 * @param {string} bookingData.passengerName - Passenger full name.
 * @param {string} bookingData.bookingId - Booking/Ticket ID.
 * @param {string} bookingData.from - Departure city.
 * @param {string} bookingData.to - Arrival city.
 * @param {string} bookingData.departureTime - Departure time.
 * @param {string} bookingData.date - Departure date.
 * @param {string} bookingData.seats - Selected seats (comma separated string).
 * @param {number} bookingData.totalPrice - Total price.
 * @param {string} bookingData.paymentMethod - Payment method (e.g., VNPay, Tiền mặt).
 */
const sendTicketEmail = async (bookingData) => {
  if (!bookingData.email) {
    console.log('No email provided for booking:', bookingData.bookingId);
    return;
  }

  const {
    email,
    passengerName,
    bookingId,
    from,
    to,
    departureTime,
    arrivalTime,
    date,
    seats,
    totalPrice,
    paymentMethod
  } = bookingData;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(totalPrice);

  const qrPayload = JSON.stringify({
    bookingId,
    from,
    to,
    departureTime,
    arrivalTime: arrivalTime || '--:--',
    date,
    seats,
    passengerName
  });
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=300&margin=2`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Xác Nhận Đặt Vé Thành Công</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Cảm ơn bạn đã lựa chọn BusGo!</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">Xin chào <strong>${passengerName}</strong>,</p>
          <p style="font-size: 16px; color: #334155; margin-bottom: 32px;">Vé của bạn đã được thanh toán và xuất thành công. Vui lòng lưu lại mã QR dưới đây để xuất trình khi lên xe.</p>
          
          <!-- Ticket Card Layout -->
          <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; background-color: #ffffff; position: relative;">
            
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Mã đặt chỗ</div>
              <div style="font-size: 32px; font-weight: 900; color: #0f172a; margin-top: 4px;">${bookingId}</div>
            </div>

            <!-- Route Info -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: center;">
              <tr>
                <td style="width: 40%;">
                  <div style="font-size: 28px; font-weight: 900; color: #0f172a;">${departureTime}</div>
                  <div style="font-size: 14px; font-weight: bold; color: #64748b;">${from}</div>
                </td>
                <td style="width: 20%; color: #94a3b8; font-size: 24px;">➔</td>
                <td style="width: 40%;">
                  <div style="font-size: 28px; font-weight: 900; color: #0f172a;">${arrivalTime || '--:--'}</div>
                  <div style="font-size: 14px; font-weight: bold; color: #64748b;">${to}</div>
                </td>
              </tr>
            </table>

            <div style="border-top: 1px solid #e2e8f0; margin: 20px 0;"></div>

            <!-- Details -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
              <tr>
                <td style="padding: 12px 8px; width: 50%;">
                  <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Ngày đi</div>
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${date}</div>
                </td>
                <td style="padding: 12px 8px; width: 50%;">
                  <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Vị trí ghế</div>
                  <div style="font-size: 18px; font-weight: 900; color: #2563eb; margin-top: 4px;">${seats}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 8px;">
                  <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Thanh toán</div>
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${paymentMethod}</div>
                </td>
                <td style="padding: 12px 8px;">
                  <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Tổng tiền</div>
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${formattedPrice}</div>
                </td>
              </tr>
            </table>

            <!-- QR Code Section -->
            <div style="text-align: center; background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 16px;">Vui lòng quét mã QR này khi lên xe</div>
              <img src="${qrUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto; border: 4px solid white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
            </div>

          </div>

          <!-- Instructions -->
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-top: 32px;">
            <h3 style="margin-top: 0; color: #1d4ed8; font-size: 16px; display: flex; align-items: center;">💡 Hướng dẫn & Lưu ý</h3>
            <ul style="color: #1e40af; padding-left: 20px; margin-bottom: 0; font-size: 14px; line-height: 1.6;">
              <li>Hãy lưu hình ảnh thẻ vé này hoặc mã QR vào điện thoại của bạn.</li>
              <li>Có mặt tại bến xuất phát trước 30 phút để làm thủ tục lên xe.</li>
              <li>Vui lòng chuẩn bị sẵn CMND/CCCD hoặc giấy tờ tùy thân hợp lệ.</li>
              <li>Hotline hỗ trợ 24/7: <strong>1900 1234</strong></li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">
          <strong>BusGo</strong> - Nền tảng đặt vé xe thông minh<br/>
          &copy; ${new Date().getFullYear()} BusGo. All rights reserved.<br/>
          <span style="opacity: 0.8; font-size: 12px; display: block; margin-top: 8px;">Email này được gửi tự động, vui lòng không phản hồi trực tiếp vào địa chỉ này.</span>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"BusGo" <vantrang04042005@gmail.com>',
      to: email,
      subject: `Xác Nhận Vé BusGo - ${bookingId} - ${from} đi ${to}`,
      html: htmlContent,
    });
    console.log('Ticket email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending ticket email:', error);
  }
};

module.exports = {
  sendTicketEmail
};
