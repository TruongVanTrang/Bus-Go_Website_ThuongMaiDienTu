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

/**
 * Gửi email chung
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
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

/**
 * Gửi email thông báo phê duyệt hủy vé
 */
const sendCancellationApprovedEmail = async (customerEmail, customerName, cancellationData) => {
  const { maVe, soVe, diemDi, diemDen, soTienHoan, phanTramHoan, thoiGianDi } = cancellationData;
  
  const formattedRefund = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(soTienHoan);

  const subject = `[BusGo] ✅ Yêu cầu hủy vé #${maVe} đã được phê duyệt`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0;">
        
        <!-- Header - Success -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">✅ Yêu Cầu Hủy Vé Được Phê Duyệt</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">Xin chào <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #334155; margin-bottom: 32px;">Yêu cầu hủy vé của quý khách đã được <strong>phê duyệt thành công</strong>. Chúng tôi sẽ hoàn tiền lại cho quý khách trong thời gian sớm nhất.</p>
          
          <!-- Cancellation Details Card -->
          <div style="border: 2px solid #10b981; border-radius: 12px; padding: 24px; background-color: #f0fdf4;">
            <h3 style="margin-top: 0; color: #059669; font-size: 18px;">Thông Tin Hủy Vé</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; width: 50%;">
                  <div style="font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase;">Mã Vé</div>
                  <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">#${maVe}</div>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; width: 50%; padding-left: 20px;">
                  <div style="font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase;">Số Vé Hủy</div>
                  <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${soVe} vé</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; width: 50%;">
                  <div style="font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase;">Tuyến Đường</div>
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${diemDi} ➔ ${diemDen}</div>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; width: 50%; padding-left: 20px;">
                  <div style="font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase;">Ngày Khởi Hành</div>
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${moment(thoiGianDi).format('DD/MM/YYYY HH:mm')}</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 12px 0;">
                  <div style="font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase;">Phần Trăm Hoàn Tiền</div>
                  <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${phanTramHoan}%</div>
                </td>
              </tr>
            </table>

            <!-- Refund Amount -->
            <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; border: 2px solid #10b981; margin-top: 20px; text-align: center;">
              <div style="font-size: 14px; font-weight: bold; color: #059669; text-transform: uppercase;">Số Tiền Hoàn Lại</div>
              <div style="font-size: 32px; font-weight: 900; color: #059669; margin-top: 8px;">${formattedRefund}</div>
            </div>
          </div>

          <!-- Important Info -->
          <div style="background-color: #e0f2fe; border: 2px solid #0284c7; border-radius: 8px; padding: 20px; margin-top: 32px;">
            <h4 style="margin-top: 0; color: #0c4a6e; font-size: 16px;">📌 Thông Tin Quan Trọng</h4>
            <ul style="color: #0c4a6e; padding-left: 20px; margin-bottom: 0; font-size: 14px; line-height: 1.8;">
              <li><strong>Thời gian hoàn tiền:</strong> 3-5 ngày làm việc (không tính thứ 7, chủ nhật)</li>
              <li><strong>Phương thức hoàn tiền:</strong> Sẽ được hoàn lại vào tài khoản thanh toán gốc của quý khách</li>
              <li><strong>Trạng thái vé:</strong> Sẽ được cập nhật thành "Đã Hủy" trong lịch sử đặt vé</li>
              <li><strong>Cần hỗ trợ:</strong> Liên hệ hotline 1900 1234 (24/7)</li>
            </ul>
          </div>

          <!-- Footer Message -->
          <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">Cảm ơn quý khách đã sử dụng dịch vụ BusGo. Chúc quý khách có những chuyến đi vui vẻ!</p>
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

  return sendEmail({ to: customerEmail, subject, html });
};

/**
 * Gửi email thông báo từ chối hủy vé
 */
const sendCancellationRejectedEmail = async (customerEmail, customerName, cancellationData) => {
  const { maVe, diemDi, diemDen, lyDoTuChoi, thoiGianDi } = cancellationData;

  const subject = `[BusGo] ❌ Yêu cầu hủy vé #${maVe} không được chấp nhận`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid #e2e8f0;">
        
        <!-- Header - Rejected -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">❌ Yêu Cầu Hủy Vé Không Được Chấp Nhận</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Vé của quý khách vẫn có hiệu lực</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">Xin chào <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #334155; margin-bottom: 32px;">Yêu cầu hủy vé của quý khách <strong>không được chấp nhận</strong> lý do sau đây:</p>
          
          <!-- Rejection Details Card -->
          <div style="border: 2px solid #ef4444; border-radius: 12px; padding: 24px; background-color: #fef2f2;">
            <h3 style="margin-top: 0; color: #dc2626; font-size: 18px;">Lý Do Từ Chối</h3>
            
            <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">${lyDoTuChoi}</p>
            </div>

            <!-- Ticket Info -->
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #fecaca;">
              <h4 style="margin-top: 0; color: #dc2626; font-size: 16px;">Thông Tin Vé</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; width: 50%;">
                    <div style="font-size: 12px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Mã Vé</div>
                    <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">#${maVe}</div>
                  </td>
                  <td style="padding: 12px 0; width: 50%; padding-left: 20px;">
                    <div style="font-size: 12px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Ngày Khởi Hành</div>
                    <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${moment(thoiGianDi).format('DD/MM/YYYY HH:mm')}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px 0;">
                    <div style="font-size: 12px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Tuyến Đường</div>
                    <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px;">${diemDi} ➔ ${diemDen}</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Important Info -->
          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 32px;">
            <h4 style="margin-top: 0; color: #92400e; font-size: 16px;">📌 Điều Quan Trọng Cần Biết</h4>
            <ul style="color: #92400e; padding-left: 20px; margin-bottom: 0; font-size: 14px; line-height: 1.8;">
              <li><strong>Vé của quý khách vẫn có hiệu lực:</strong> Quý khách vẫn có thể sử dụng vé này để đi chuyến được đặt</li>
              <li><strong>Yêu cầu hủy mới:</strong> Nếu muốn hủy, quý khách có thể gửi yêu cầu lần khác</li>
              <li><strong>Hết hạn tự động:</strong> Khi hết hạn sử dụng, trạng thái vé sẽ tự cập nhật</li>
              <li><strong>Cần hỗ trợ:</strong> Liên hệ hotline 1900 1234 (24/7) để được hỗ trợ thêm</li>
            </ul>
          </div>

          <!-- Footer Message -->
          <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">Nếu quý khách có thắc mắc, vui lòng liên hệ chúng tôi để được giải đáp chi tiết.</p>
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

  return sendEmail({ to: customerEmail, subject, html });
};

module.exports = {
  sendTicketEmail,
  sendEmail,
  sendOTPEmail,
  sendCancellationApprovedEmail,
  sendCancellationRejectedEmail
};
