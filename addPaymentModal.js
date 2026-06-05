const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// 1. Add state variables for Payment Modal
const stateInsertPoint = '  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false)';
const stateVars = `  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentConsignment, setPaymentConsignment] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentLoading, setPaymentLoading] = useState(false)`;

content = content.replace(stateInsertPoint, stateVars);

// 2. Add handlePaymentConfirm function after loadConsignments
const logicInsertPoint = `} catch (err) {
        console.error('Error loading consignments:', err)
      }
    }`;
const logicVars = `} catch (err) {
        console.error('Error loading consignments:', err)
      }
    }

    const handlePaymentConfirm = async () => {
      setPaymentLoading(true)
      try {
        const response = await fetch(\`http://localhost:5000/api/cargo/consignment/\${paymentConsignment.id}/pay\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod: paymentMethod })
        })
        if (response.ok) {
          // Refresh list locally
          const token = localStorage.getItem('token')
          if (token) {
            const data = await getMyConsignmentsAPI(token)
            const mappedConsignments = data.map(item => {
              let mappedStatus = 'pending'
              if (item.trangThaiKyGui === 'da_xac_nhan') mappedStatus = 'confirmed'
              if (item.trangThaiKyGui === 'in_transit') mappedStatus = 'in_transit'
              if (item.trangThaiKyGui === 'delivered') mappedStatus = 'delivered'
              if (item.trangThaiKyGui === 'failed' || item.trangThaiKyGui === 'da_huy') mappedStatus = 'cancelled'

              return {
                id: item.consignmentId,
                from: item.diemGui,
                to: item.diemNhan,
                type: item.loaiHangHoa,
                weight: item.trongLuong,
                declaredValue: item.giaTrucDeclare,
                totalPrice: item.tongTien,
                senderName: item.tenNguoiGui,
                senderPhone: item.soDienThoaiNguoiGui,
                receiverName: item.tenNguoiNhan,
                receiverPhone: item.soDienThoaiNguoiNhan,
                cargoStatus: mappedStatus,
                date: item.ngayGui,
                images: item.hinhAnh || [],
                rawBackendData: item
              }
            })
            setConsignments(mappedConsignments)
          }
          setShowPaymentModal(false)
          alert('Thanh toán thành công!')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setPaymentLoading(false)
      }
    }`;

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegexStr = escapeRegex(logicInsertPoint).replace(/\\n/g, '\n').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, logicVars);
    console.log('Added states and logic');
} else {
    console.log('Could not find logic insert point');
}

// 3. Change "Thanh toán ngay" button to open modal
const targetButton = `<button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                navigate('/cargo-consignment', { 
                                  state: { 
                                    payNowData: consignment.rawBackendData
                                  } 
                                })
                              }}
                            >`;
const replaceButton = `<button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                setPaymentConsignment(consignment)
                                setShowPaymentModal(true)
                              }}
                            >`;

const targetRegexStr2 = escapeRegex(targetButton).replace(/\\n/g, '\n').replace(/\s+/g, '\\s+');
const targetRegex2 = new RegExp(targetRegexStr2);

if (targetRegex2.test(content)) {
    content = content.replace(targetRegex2, replaceButton);
    console.log('Modified button');
} else {
    console.log('Could not find button to replace');
}

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
