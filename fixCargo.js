const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/services/cargoService.js', 'utf8');
content = content.replace(/\/\*\*\s*\*\s*H\?y don[\s\S]*$/, '');
content += `
/**
 * Hủy đơn hàng ký gửi (khách hàng)
 * @param {string} id - ID đơn ký gửi (consignmentId)
 * @param {string} token - JWT Token
 */
export const cancelConsignmentAPI = async (id, token) => {
  try {
    const response = await axios.put(\`\${API_BASE_URL}/cargo/consignment/\${id}/cancel\`, {}, {
      headers: {
        Authorization: \`Bearer \${token}\`
      }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}
`;
fs.writeFileSync('BusGo-Frontend/src/services/cargoService.js', content, 'utf8');
console.log('Fixed cargoService.js');
