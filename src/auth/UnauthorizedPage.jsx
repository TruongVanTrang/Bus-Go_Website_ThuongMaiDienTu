import React from 'react'
import { useNavigate } from 'react-router-dom'
import './UnauthorizedPage.css'

function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">🔒</div>
        <h1 className="unauthorized-title">Truy cập bị từ chối</h1>
        <p className="unauthorized-message">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một lỗi.
        </p>
        
        <div className="unauthorized-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => navigate('/login')}
          >
            Đăng nhập lại
          </button>
        </div>

        <div className="error-code">
          <span className="code-404">403</span>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
