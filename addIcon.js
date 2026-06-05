const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

content = content.replace("FiAlertTriangle } from 'react-icons/fi'", "FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'");

const target = `                          >
                            Đặt lại
                          </button>`;
const replacement = `                          >
                            <FiRefreshCw size={14} className="me-1" />
                            Đặt lại
                          </button>`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added FiRefreshCw icon');
