import React, { useState, useEffect } from 'react'
import { getCancellationRequestsAPI, checkCancellationAPI, processCancellationAPI } from '../../services/supportService'
import { toast } from '../../utils/toastService'
import AdminSidebar from '../../admin/components/AdminSidebar'
import AdminTopbar from '../../admin/components/AdminTopbar'
import { AuthUtil } from '../../utils/helpers'
import { ROLE_MENU, USER_ROLES } from '../../utils/constants'
import './CancellationPage.css'

function CancellationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState('')

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all

  // Modal logic
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  useEffect(() => {
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    setUserRole(role)
    setUserName(user?.name || 'Support Staff')
    
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await getCancellationRequestsAPI(filter === 'all' ? null : filter)
      setRequests(data.requests || [])
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckEligibility = async (ticketId) => {
    setSelectedTicketId(ticketId)
    setIsChecking(true)
    setEligibilityData(null)
    setShowRejectInput(false)
    setRejectReason('')
    
    try {
      const data = await checkCancellationAPI(ticketId)
      setEligibilityData(data)
    } catch (error) {
      toast.error(error.message || 'Lỗi kiểm tra điều kiện')
    } finally {
      setIsChecking(false)
    }
  }

  const handleProcess = async (action) => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    if (!window.confirm(`Xác nhận ${action === 'approve' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu hủy vé này?`)) return

    try {
      await processCancellationAPI(selectedTicketId, {
        hanh_dong: action,
        lyDoTuChoi: rejectReason
      })
      toast.success(action === 'approve' ? 'Đã phê duyệt hủy vé' : 'Đã từ chối yêu cầu')
      setSelectedTicketId(null)
      fetchRequests()
    } catch (error) {
      toast.error(error.message || 'Lỗi xử lý yêu cầu')
    }
  }

  const menuItems = ROLE_MENU[USER_ROLES.SUPPORT_STAFF] || []

  return (
    <div className="admin-dashboard cancellation-page">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="admin-content">
          <div className="cancellation-container">
            <h2 className="mb-4">Xử lý Yêu cầu Hoàn/Hủy vé</h2>

            <div className="filter-tabs mb-4">
              <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ xử lý</button>
              <button className={`tab-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Đã phê duyệt</button>
              <button className={`tab-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Đã từ chối</button>
              <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
            </div>

            <div className="row">
              {/* Cột 1: Danh sách yêu cầu */}
              <div className="col-lg-7">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-0">
                    {loading ? (
                      <div className="p-5 text-center">Đang tải...</div>
                    ) : requests.length === 0 ? (
                      <div className="p-5 text-center text-muted">Không có dữ liệu</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="px-4">Mã Vé</th>
                              <th>Khách hàng</th>
                              <th>Tuyến đường</th>
                              <th>Lý do hủy</th>
                              <th>Trạng thái</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {requests.map(req => (
                              <tr key={req.maYeuCau} className={selectedTicketId === req.maVe ? 'table-primary' : ''}>
                                <td className="px-4"><strong>#{req.maVe}</strong></td>
                                <td>
                                  <div>{req.hoTenHanhKhach}</div>
                                  <small className="text-muted">{req.soDienThoaiHanhKhach}</small>
                                </td>
                                <td>
                                  <div>{req.diemDi} - {req.diemDen}</div>
                                  <small className="text-muted">{new Date(req.thoiGianDi).toLocaleDateString()}</small>
                                </td>
                                <td className="text-truncate" style={{maxWidth: '150px'}} title={req.lyDoHuy}>
                                  {req.lyDoHuy}
                                </td>
                                <td>
                                  <span className={`badge bg-${req.trangThai === 'pending' ? 'warning' : req.trangThai === 'approved' ? 'success' : 'danger'}`}>
                                    {req.trangThai}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleCheckEligibility(req.maVe)}
                                  >
                                    Kiểm tra
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cột 2: Chi tiết và Phê duyệt */}
              <div className="col-lg-5">
                <div className="card shadow-sm border-0 sticky-top" style={{top: '20px'}}>
                  <div className="card-header bg-white border-bottom py-3">
                    <h5 className="mb-0">Kết quả Kiểm tra</h5>
                  </div>
                  <div className="card-body p-4">
                    {!selectedTicketId ? (
                      <div className="text-center text-muted py-5">
                        <div className="fs-1 mb-3">🎫</div>
                        Chọn một yêu cầu bên trái để xem chi tiết
                      </div>
                    ) : isChecking ? (
                      <div className="text-center py-5">Đang kiểm tra điều kiện...</div>
                    ) : eligibilityData ? (
                      <div className="eligibility-details">
                        {/* Status Alert */}
                        {eligibilityData.eligibility.coTheHoan ? (
                          <div className="alert alert-success d-flex align-items-center mb-4">
                            <span className="fs-4 me-3">✅</span>
                            <div>
                              <strong>Vé đủ điều kiện hủy và hoàn tiền</strong>
                              <div className="small">Thời gian đến lúc khởi hành: {eligibilityData.eligibility.hoursUntilDeparture} giờ</div>
                            </div>
                          </div>
                        ) : eligibilityData.eligibility.coTheHuy ? (
                          <div className="alert alert-warning d-flex align-items-center mb-4">
                            <span className="fs-4 me-3">⚠️</span>
                            <div>
                              <strong>Vé có thể hủy nhưng KHÔNG ĐƯỢC HOÀN TIỀN</strong>
                              <div className="small">{eligibilityData.eligibility.lyDoKhongHuy || 'Không đủ điều kiện hoàn'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="alert alert-danger d-flex align-items-center mb-4">
                            <span className="fs-4 me-3">❌</span>
                            <div>
                              <strong>KHÔNG THỂ HỦY VÉ</strong>
                              <div className="small">{eligibilityData.eligibility.lyDoKhongHuy}</div>
                            </div>
                          </div>
                        )}

                        {/* Refund Calculation Box */}
                        <div className="refund-calculator bg-light p-3 rounded mb-4">
                          <h6 className="text-primary mb-3">Tính toán Hoàn tiền</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Giá vé gốc:</span>
                            <strong>{eligibilityData.refundCalculation.giaVeGoc.toLocaleString()} đ</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Chính sách áp dụng:</span>
                            <span>{eligibilityData.refundCalculation.moTa}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tỷ lệ hoàn:</span>
                            <span className={eligibilityData.refundCalculation.phanTramHoan > 0 ? 'text-success font-weight-bold' : 'text-danger font-weight-bold'}>
                              {eligibilityData.refundCalculation.phanTramHoan}%
                            </span>
                          </div>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Số tiền khách nhận lại:</span>
                            <span className="fs-4 fw-bold text-success">{eligibilityData.refundCalculation.soTienHoan.toLocaleString()} đ</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {filter === 'pending' && (
                          <div className="action-buttons mt-4">
                            {!showRejectInput ? (
                              <div className="d-flex gap-2">
                                <button 
                                  className="btn btn-success flex-1 py-2" 
                                  disabled={!eligibilityData.eligibility.coTheHuy}
                                  onClick={() => handleProcess('approve')}
                                >
                                  Phê duyệt Hủy
                                </button>
                                <button 
                                  className="btn btn-outline-danger flex-1 py-2"
                                  onClick={() => setShowRejectInput(true)}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <div className="reject-form bg-red-50 p-3 rounded border border-danger border-opacity-25">
                                <label className="form-label text-danger fw-bold">Lý do từ chối:</label>
                                <textarea 
                                  className="form-control mb-3" 
                                  rows="3" 
                                  placeholder="Nhập lý do để gửi cho khách hàng..."
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                ></textarea>
                                <div className="d-flex justify-content-end gap-2">
                                  <button className="btn btn-sm btn-secondary" onClick={() => setShowRejectInput(false)}>Hủy bỏ</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => handleProcess('reject')}>Xác nhận Từ chối</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {filter !== 'pending' && (
                          <div className="alert alert-secondary text-center mt-3">
                            Yêu cầu này đã được xử lý
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default CancellationPage
