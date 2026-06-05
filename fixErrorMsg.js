const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const regex = /    \} catch \(error\) \{\r?\n      console\.error\(error\);\r?\n      toast\.error\('Lỗi khi tải ảnh lên'\)\r?\n    \} finally \{/g;
const newStr = `    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi tải ảnh lên')
    } finally {`;

if (regex.test(content)) {
  content = content.replace(regex, newStr);
  fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
  console.log('Fixed error message in DriverDashboard with regex.');
} else {
  console.log('Could not find error message block.');
}
