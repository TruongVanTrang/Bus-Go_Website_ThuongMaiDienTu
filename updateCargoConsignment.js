const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/CargoConsignmentPage.jsx', 'utf8');

const targetEffect = `        senderEmail: c.emailNguoiGui || '',
        receiverName: c.tenNguoiNhan || '',
        receiverPhone: c.soDienThoaiNguoiNhan || ''
      });
    }
  }, [location.state]);`;

const replaceEffect = `        senderEmail: c.emailNguoiGui || '',
        receiverName: c.tenNguoiNhan || '',
        receiverPhone: c.soDienThoaiNguoiNhan || ''
      });
    } else if (location.state && location.state.payNowData) {
      const c = location.state.payNowData;
      setActiveConsignmentId(c.consignmentId);
      setActiveConsignment(c);
      setConsignmentStatus('da_xac_nhan');
      setIsConfirmed(true);
      setCurrentStep(5);
    }
  }, [location.state]);`;

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegexStr = escapeRegex(targetEffect).replace(/\\n/g, '\n').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceEffect);
    fs.writeFileSync('BusGo-Frontend/src/customer/pages/CargoConsignmentPage.jsx', content, 'utf8');
    console.log('Fixed CargoConsignmentPage');
} else {
    console.log('Could not find effect to replace');
}
