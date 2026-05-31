const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

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

let createDate = moment().utcOffset('+07:00').format('YYYYMMDDHHmmss');
let expireDate = moment().utcOffset('+07:00').add(15, 'minutes').format('YYYYMMDDHHmmss');
let ipAddr = '127.0.0.1';

let tmnCode = '8ZUETNWX';
let secretKey = 'JY5RA730VHTKX1SVU28Q0KHI4SKN5YB2';
let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
let returnUrl = 'http://localhost:3000/vnpay-return';

let orderId = 'BK1234567890';
let amount = 250000;

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

console.log("signData:", signData);
console.log("vnpUrl:", vnpUrl);
