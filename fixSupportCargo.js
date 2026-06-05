const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/admin/pages/SupportCargoPage.jsx', 'utf8');

// 1. Add import for approveEditConsignmentAPI
content = content.replace(
  /import \{ getAllConsignmentsAPI, assignDriverAPI \} from '\.\.\/\.\.\/services\/staffService'/,
  "import { getAllConsignmentsAPI, assignDriverAPI } from '../../services/staffService'\nimport { approveEditConsignmentAPI } from '../../services/cargoService'"
);

// 2. Add handleApproveEdit function
const approveFn = `  const handleApproveEdit = async (consignmentId, keepDriver) => {
    try {
      const token = localStorage.getItem('busgo_token')
      await approveEditConsignmentAPI(consignmentId, keepDriver, token)
      toast.success(keepDriver ? 'Đã duyệt chỉnh sửa và giữ tài xế' : 'Đã duyệt chỉnh sửa và yêu cầu chọn lại tài xế')
      setShowAssignModal(false)
      fetchConsignments()
    } catch (error) {
      toast.error(error.message || 'Lỗi khi duyệt chỉnh sửa')
    }
  }

  const handleAssignSubmit`;
content = content.replace('  const handleAssignSubmit', approveFn);

// 3. Add badge in list
content = content.replace(
  /<td className=\"fw-bold\">#\{orderId\}<\/td>/g,
  `<td className="fw-bold">\n                                  #{orderId}\n                                  {cargo.isEdited && <div className="badge bg-warning text-dark mt-1 d-block">ĐÃ CHỈNH SỬA</div>}\n                                </td>`
);

// 4. Update the Modal content
const editButtons = `{selectedCargo?.isEdited ? (
            <div className="alert alert-warning m-4">
              <h5 className="alert-heading fw-bold mb-3">Đơn hàng đã được khách chỉnh sửa</h5>
              <p>Khách hàng đã thay đổi thông tin đơn ký gửi này. Bạn có muốn giữ tài xế cũ không?</p>
              <div className="d-flex gap-2 mt-4">
                <button type="button" className="btn btn-success flex-grow-1" onClick={() => handleApproveEdit(selectedCargo.consignmentId || selectedCargo.id, true)}>
                  Duyệt (Giữ Tài Xế)
                </button>
                <button type="button" className="btn btn-danger flex-grow-1" onClick={() => handleApproveEdit(selectedCargo.consignmentId || selectedCargo.id, false)}>
                  Chọn Lại Tài Xế
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAssignSubmit}>`;

content = content.replace(/<form onSubmit=\{handleAssignSubmit\}>/, editButtons);

// 5. Close ternary
content = content.replace(
  /<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*\}\)\s*<\/div>\s*\);\s*\}/,
  `</form>\n          )}\n            </div>\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}`
);

fs.writeFileSync('BusGo-Frontend/src/admin/pages/SupportCargoPage.jsx', content, 'utf8');
console.log('Fixed SupportCargoPage.jsx');
