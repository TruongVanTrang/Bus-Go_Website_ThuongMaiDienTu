const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const { sql } = require("../config/db");

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
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
    let expireDate = moment().utcOffset('+07:00').add(5, 'minutes').format('YYYYMMDDHHmmss');
    
    // IP máy khách (Bắt buộc chuẩn IPv4, không được dùng ::1 và chỉ lấy 1 IP)
    let ipAddr = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
    if(typeof ipAddr === 'string' && ipAddr.includes(',')) {
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
    
    if(secureHash === signed){
        let orderId = vnp_Params['vnp_TxnRef']; // bookingId
        let rspCode = vnp_Params['vnp_ResponseCode'];
        
        try {
            if (rspCode === '00') {
                const pool = await sql.connect();
                await pool.request()
                  .input('bookingId', sql.VarChar, orderId + '%') 
                  .query("UPDATE VeDienTu SET trangThaiVe = 'da_thanh_toan' WHERE maQR LIKE @bookingId");
                  
                res.status(200).json({RspCode: '00', Message: 'Success'});
            } else {
                res.status(200).json({RspCode: '00', Message: 'Success'});
            }
        } catch (error) {
            console.error('Error updating DB inside IPN:', error);
            res.status(200).json({RspCode: '99', Message: 'Unknown error'});
        }
    } else {
        res.status(200).json({RspCode: '97', Message: 'Fail checksum'});
    }
};
