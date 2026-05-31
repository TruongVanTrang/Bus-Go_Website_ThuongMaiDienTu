const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Use fetch from node 18+ global or just use axios

async function run() {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'busgo_secret_key', { expiresIn: '1d' });
  
  const res = await fetch('http://localhost:5000/api/bookings', { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer ' + token 
    }, 
    body: JSON.stringify({ 
      maChuyenXe: 1, 
      selectedSeats: [], 
      passengerQuantity: 2, 
      passengerInfo: { firstName: 'A', lastName: 'B', phone: '1', email: 'e', pickupLocation: 'x', dropoffLocation: 'y' } 
    }) 
  });
  
  console.log(res.status, await res.text());
}

run();
