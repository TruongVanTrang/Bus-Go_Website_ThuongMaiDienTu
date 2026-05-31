import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

function UsersPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();

    if (!role) {
      navigate('/login');
      return;
    }

    setUserRole(role);
    setUserName(user?.name || 'User');
    setLoading(false);
    
    // Fetch users
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = StorageUtil.getToken();
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
      alert('Không thể tải danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const token = StorageUtil.getToken();
      await axios.put(`http://localhost:5000/api/admin/users/${userId}`, 
        { trangThaiTaiKhoan: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Cập nhật lại danh sách sau khi thay đổi thành công
      setUsers(users.map(u => 
        u.maNguoiDung === userId ? { ...u, trangThaiTaiKhoan: newStatus } : u
      ));
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        menuItems={menuItems}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-main">
        <AdminTopbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="admin-content">
          <div className="dashboard-content">
            <h1 className="page-title mb-4">Quản lý người dùng</h1>
            
            <div className="card shadow-sm p-4">
              {loadingUsers ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải dữ liệu...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.maNguoiDung}>
                          <td>#{user.maNguoiDung}</td>
                          <td className="fw-bold">{user.tenNguoiDung}</td>
                          <td>{user.email}</td>
                          <td>{user.soDienThoai}</td>
                          <td>
                            <span className={`badge bg-${user.role === 'ADMIN' ? 'danger' : user.role === 'CUSTOMER' ? 'success' : 'primary'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${user.trangThaiTaiKhoan === 'active' ? 'success' : 'secondary'}`}>
                              {user.trangThaiTaiKhoan === 'active' ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td>
                            {user.role !== 'ADMIN' && (
                              <button 
                                className={`btn btn-sm ${user.trangThaiTaiKhoan === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                onClick={() => toggleUserStatus(user.maNguoiDung, user.trangThaiTaiKhoan)}
                              >
                                {user.trangThaiTaiKhoan === 'active' ? 'Khóa' : 'Mở khóa'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-4">Không có dữ liệu người dùng</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UsersPage;
