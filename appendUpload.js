const fs = require('fs');
const content = `\n// Upload ảnh
export const uploadImageAPI = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(\`\${API_BASE_URL}/upload\`, formData, {
      headers: {
        ...getAuthHeaders().headers
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi tải ảnh' }
  }
}\n`;
fs.appendFileSync('BusGo-Frontend/src/services/driverService.js', content, 'utf8');
console.log('Appended uploadImageAPI.');
