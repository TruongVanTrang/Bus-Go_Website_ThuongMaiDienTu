const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'a@gmail.com',
      password: 'password'
    });
    const token = loginRes.data.token;

    const form = new FormData();
    // Use an existing file to test, e.g. checkDB2.js
    form.append('image', fs.createReadStream(path.join(__dirname, 'checkDB2.js')), {
      filename: 'checkDB2.jpg',
      contentType: 'image/jpeg' // mock it as image so filter passes
    });

    const uploadRes = await axios.post('http://localhost:5000/api/upload', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    console.log('Upload success:', uploadRes.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}
testUpload();
