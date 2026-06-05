const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/services/driverService.js', 'utf8');

const uploadFn = `
// Upload ảnh
export const uploadImageAPI = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(\`\${API_BASE_URL}/upload\`, formData, {
      headers: {
        ...getAuthHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi API uploadImage:', error);
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' };
  }
}
`;

content += uploadFn;
fs.writeFileSync('BusGo-Frontend/src/services/driverService.js', content, 'utf8');
console.log('Added uploadImageAPI to driverService.js');
