const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const { sql } = require("../config/db");
const { sendTicketEmail } = require('../utils/emailService');

// Helper function to format Time to HH:mm
const formatTime = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  let hours = '' + d.getUTCHours();
  let minutes = '' + d.getUTCMinutes();
  if (hours.length < 2) hours = '0' + hours;
  if (minutes.length < 2) minutes = '0' + minutes;
  return [hours, minutes].join(':');
};

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

exports.createPaymentUrl = (req, res) => {
    let createDate = moment().utcOffset('+07:00').format('YYYYMMDDHHmmss');
    let expireDate = moment().utcOffset('+07:00').add(3, 'minutes').format('YYYYMMDDHHmmss');

    // IP máy khách (Bắt buộc chuẩn IPv4, không được dùng ::1 và chỉ lấy 1 IP)
    let ipAddr = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
    if (typeof ipAddr === 'string' && ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0].trim();
    }
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1' || !ipAddr) {
        ipAddr = '127.0.0.1';
    }

    let tmnCode = process.env.VNP_TMNCODE?.trim();
    let secretKey = process.env.VNP_HASHSECRET?.trim();
    let vnpUrl = process.env.VNP_URL?.trim();
    let returnUrl = process.env.VNP_RETURN_URL?.trim();

    let orderId = String(req.body.bookingId || moment().format('DDHHmmss')).replace(/[^a-zA-Z0-9]/g, ''); // Bắt buộc chỉ có chữ và số
    let amount = req.body.amount;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'ThanhToanVeXe' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100).toString();
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    res.status(200).json({ url: vnpUrl });
};

exports.vnpayIpn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let secretKey = process.env.VNP_HASHSECRET?.trim();
    let signData = qs.stringify(vnp_Params, { encode: false });

    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        let orderId = vnp_Params['vnp_TxnRef']; // bookingId
        let rspCode = vnp_Params['vnp_ResponseCode'];

        try {
            if (rspCode === '00') {
                const pool = await sql.connect();
                
                // 1. Update the booking status
                await pool.request()
                    .input('bookingId', sql.VarChar, orderId + '%')
                    .query("UPDATE VeDienTu SET trangThaiVe = 'da_thanh_toan' WHERE maQR LIKE @bookingId");

                // 2. Fetch booking details to send the email
                try {
                    const bookingResult = await pool.request()
                        .input('bookingId', sql.VarChar, orderId + '%')
                        .query(`
                            SELECT 
                                vdt.maQR as bookingId, vdt.emailHanhKhach, vdt.hoTenHanhKhach,
                                vdt.giaThanhToan, vdt.giaHangHoa,
                                cx.thoiGianDi, cx.thoiGianDen, td.diemDi, td.diemDen,
                                STRING_AGG(gh.soGhe, ', ') as seats
                            FROM VeDienTu vdt
                            INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
                            INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
                            LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
                            WHERE vdt.maQR LIKE @bookingId
                            GROUP BY vdt.maQR, vdt.emailHanhKhach, vdt.hoTenHanhKhach, vdt.giaThanhToan, vdt.giaHangHoa, cx.thoiGianDi, cx.thoiGianDen, td.diemDi, td.diemDen
                        `);

                    if (bookingResult.recordset.length > 0) {
                        const bData = bookingResult.recordset[0];
                        
                        // Total price from all matching tickets in this booking
                        // Note: If multiple tickets have the same booking ID, giaThanhToan is per ticket.
                        // We might need to sum them, but for now we take the first one or sum them up.
                        // Actually, the above query groups by maQR, but giaThanhToan is included in grouping.
                        // Let's just send the email using the aggregated seats.
                        
                        // Calculate total sum of this booking group
                        const totalSumResult = await pool.request()
                            .input('bookingId', sql.VarChar, orderId + '%')
                            .query('SELECT SUM(giaThanhToan + ISNULL(giaHangHoa, 0)) as total FROM VeDienTu WHERE maQR LIKE @bookingId');
                        const totalAmount = totalSumResult.recordset[0].total;

                        const dDate = new Date(bData.thoiGianDi);
                        const departureDateFormatted = `${String(dDate.getUTCDate()).padStart(2, '0')}/${String(dDate.getUTCMonth() + 1).padStart(2, '0')}/${dDate.getUTCFullYear()}`;
                        const departureTimeFormatted = formatTime(bData.thoiGianDi);
                        const arrivalTimeFormatted = formatTime(bData.thoiGianDen);

                        await sendTicketEmail({
                            email: bData.emailHanhKhach,
                            passengerName: bData.hoTenHanhKhach,
                            bookingId: orderId,
                            from: bData.diemDi,
                            to: bData.diemDen,
                            departureTime: departureTimeFormatted,
                            arrivalTime: arrivalTimeFormatted,
                            date: departureDateFormatted,
                            seats: bData.seats ? bData.seats.split(',').map(s => `Ghế ${s.trim()}`).join(', ') : '',
                            totalPrice: totalAmount,
                            paymentMethod: 'VNPay'
                        });
                    }
                } catch (emailErr) {
                    console.error('Error sending VNPay ticket email:', emailErr);
                }

                res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
                res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
        } catch (error) {
            console.error('Error updating DB inside IPN:', error);
            res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }
};
