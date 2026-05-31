const qs = require('qs');
const querystring = require('querystring');

let vnp_Params = {
  vnp_Amount: '25000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20260531134020',
  vnp_CurrCode: 'VND',
  vnp_ExpireDate: '20260531135520',
  vnp_IpAddr: '127.0.0.1',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'ThanhToanVeXeBK1234567890',
  vnp_OrderType: 'other',
  vnp_ReturnUrl: 'http%3A%2F%2Flocalhost%3A3000%2Fvnpay-return',
  vnp_TmnCode: '8ZUETNWX',
  vnp_TxnRef: 'BK1234567890',
  vnp_Version: '2.1.0'
};

let qs_str = qs.stringify(vnp_Params, { encode: false });
let native_str = querystring.stringify(vnp_Params, '&', '=', { encodeURIComponent: (str) => str });

console.log("qs:    ", qs_str);
console.log("native:", native_str);
console.log("Equal?", qs_str === native_str);
