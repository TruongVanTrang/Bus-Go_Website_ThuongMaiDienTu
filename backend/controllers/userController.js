const { sql } = require('../config/db');
const { otpStore } = require('./authController');

// @desc    Lấy thông tin profile người dùng
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect();

    const userResult = await pool.request()
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        SELECT maNguoiDung as id, tenNguoiDung as name, email, soDienThoai as phone, 
               daXacThucEmail, trangThaiTaiKhoan, ngayTaoTaiKhoan
        FROM NguoiDung 
        WHERE maNguoiDung = @maNguoiDung
      `);

    const user = userResult.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Nếu là KhachHang thì lấy thêm thông tin
    let customerInfo = {};
    if (req.user.role === 'CUSTOMER') {
      const customerResult = await pool.request()
        .input('maKhachHang', sql.Int, userId)
        .query(`
          SELECT diemTichLuy, capDoThanhVien, tongTienDaChiTra 
          FROM KhachHang 
          WHERE maKhachHang = @maKhachHang
        `);
      if (customerResult.recordset.length > 0) {
        customerInfo = customerResult.recordset[0];
      }
    }

    res.json({
      ...user,
      ...customerInfo
    });

  } catch (error) {
    console.error('Lỗi khi lấy profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật profile người dùng (Không cập nhật password)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { name, email, phone, otp } = req.body;
  const userId = req.user.id;

  try {
    const pool = await sql.connect();

    // Check if user exists and get current data
    const userResult = await pool.request()
      .input('maNguoiDung', sql.Int, userId)
      .query('SELECT * FROM NguoiDung WHERE maNguoiDung = @maNguoiDung');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const currentUser = userResult.recordset[0];

    // Determine if sensitive info (email or phone) is changed
    const isEmailChanged = email && email !== currentUser.email;
    const isPhoneChanged = phone && phone !== currentUser.soDienThoai;

    if (isEmailChanged || isPhoneChanged) {
      // Must provide OTP sent to the CURRENT email
      if (!otp) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã xác thực OTP' });
      }

      const currentEmail = currentUser.email;
      const record = otpStore[currentEmail];

      if (!record) {
        return res.status(400).json({ message: 'Mã xác thực không tồn tại hoặc đã hết hạn' });
      }

      if (Date.now() > record.expiresAt) {
        delete otpStore[currentEmail];
        return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
      }

      if (record.code !== otp) {
        return res.status(400).json({ message: 'Mã xác thực không chính xác' });
      }

      // Verification success, delete OTP
      delete otpStore[currentEmail];
    }

    // Check if email or phone is already taken by ANOTHER user
    const checkDuplicate = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        SELECT * FROM NguoiDung 
        WHERE (email = @email OR soDienThoai = @phone) 
        AND maNguoiDung != @maNguoiDung
      `);

    if (checkDuplicate.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác' });
    }

    // Update info
    await pool.request()
      .input('tenNguoiDung', sql.NVarChar, name)
      .input('email', sql.VarChar, email)
      .input('soDienThoai', sql.VarChar, phone)
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        UPDATE NguoiDung 
        SET tenNguoiDung = @tenNguoiDung, 
            email = @email, 
            soDienThoai = @soDienThoai,
            ngayCapNhatCuoi = GETDATE()
        WHERE maNguoiDung = @maNguoiDung
      `);

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id: userId,
        name,
        email,
        phone
      }
    });

  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// =============================================================================
// CUSTOMER CHAT APIs
// =============================================================================

// @desc    Lấy phiên chat hiện tại của khách hàng
// @route   GET /api/users/chat
// @access  Private
const getMyChatSession = async (req, res) => {
  const userId = req.user.id;
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('maKhachHang', sql.Int, userId)
      .query(`
        SELECT TOP 1 * FROM ChatSession 
        WHERE maKhachHang = @maKhachHang 
        ORDER BY thoiGianCapNhat DESC
      `);
      
    res.json({ session: result.recordset[0] || null });
  } catch (error) {
    console.error('Lỗi getMyChatSession:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo phiên chat mới cho khách hàng
// @route   POST /api/users/chat
// @access  Private
const createMyChatSession = async (req, res) => {
  const userId = req.user.id;
  const { chuDeChat } = req.body;
  try {
    const pool = await sql.connect();
    
    // Tìm một Support Agent để assign (Lấy agent có role 3 - Support Staff)
    // Nếu ko có thì set mặc định 1 ID (ví dụ: 7) - giả lập route agent
    const agentResult = await pool.request().query(`
      SELECT TOP 1 maNhanVien FROM NhanVien nv
      INNER JOIN PhanQuyen pq ON nv.maNhanVien = pq.maNguoiDung
      WHERE pq.maVaiTro = 3
    `);
    
    const agentId = agentResult.recordset.length > 0 ? agentResult.recordset[0].maNhanVien : 7;
    
    const insertResult = await pool.request()
      .input('maKhachHang', sql.Int, userId)
      .input('maNhanVienHT', sql.Int, agentId)
      .input('chuDeChat', sql.NVarChar, chuDeChat || 'Cần hỗ trợ')
      .query(`
        INSERT INTO ChatSession (maNhanVienHT, maKhachHang, trangThai, chuDeChat)
        VALUES (@maNhanVienHT, @maKhachHang, 'active', @chuDeChat);
        SELECT SCOPE_IDENTITY() AS maChatSession;
      `);
      
    res.status(201).json({ maChatSession: insertResult.recordset[0].maChatSession });
  } catch (error) {
    console.error('Lỗi createMyChatSession:', error);
    res.status(500).json({ message: 'Lỗi server tạo phiên chat' });
  }
};

// @desc    Lấy tin nhắn của phiên chat khách hàng
// @route   GET /api/users/chat/:sessionId/messages
// @access  Private
const getMyChatMessages = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;
  
  try {
    const pool = await sql.connect();
    // Đánh dấu đã đọc tin nhắn của agent gửi cho khách
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        UPDATE ChatMessage SET trangThaiDoc = 'read' 
        WHERE maChatSession = @sessionId AND nguoiGui = 'agent' AND trangThaiDoc = 'sent'
      `);
      
    const result = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT m.* FROM ChatMessage m
        INNER JOIN ChatSession s ON m.maChatSession = s.maChatSession
        WHERE m.maChatSession = @sessionId AND s.maKhachHang = @userId
        ORDER BY thoiGianGui ASC
      `);
      
    res.json({ messages: result.recordset });
  } catch (error) {
    console.error('Lỗi getMyChatMessages:', error);
    res.status(500).json({ message: 'Lỗi server lấy tin nhắn' });
  }
};

// @desc    Gửi tin nhắn từ khách hàng
// @route   POST /api/users/chat/:sessionId/messages
// @access  Private
const sendMyChatMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { noiDung } = req.body;
  const userId = req.user.id;
  
  if (!noiDung || !noiDung.trim()) return res.status(400).json({ message: 'Tin nhắn trống' });
  
  try {
    const pool = await sql.connect();
    
    // Check session
    const sessionCheck = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('userId', sql.Int, userId)
      .query(`SELECT trangThai FROM ChatSession WHERE maChatSession = @sessionId AND maKhachHang = @userId`);
      
    if (sessionCheck.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    if (sessionCheck.recordset[0].trangThai === 'closed') return res.status(400).json({ message: 'Phiên chat đã đóng' });
    
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('maNguoiGui', sql.Int, userId)
      .input('noiDung', sql.NVarChar, noiDung)
      .query(`
        INSERT INTO ChatMessage (maChatSession, nguoiGui, maNguoiGui, noiDung, trangThaiDoc)
        VALUES (@sessionId, 'customer', @maNguoiGui, @noiDung, 'sent');
        UPDATE ChatSession SET thoiGianCapNhat = GETDATE() WHERE maChatSession = @sessionId;
      `);
      
    res.status(201).json({ message: 'Đã gửi tin' });
  } catch (error) {
    console.error('Lỗi sendMyChatMessage:', error);
    res.status(500).json({ message: 'Lỗi server gửi tin nhắn' });
  }
};

// =============================================================================
// CUSTOMER CANCELLATION REQUEST
// =============================================================================

// @desc    Khách hàng yêu cầu hủy vé
// @route   POST /api/users/tickets/:ticketId/cancel
// @access  Private
const requestTicketCancellation = async (req, res) => {
  const { ticketId } = req.params; // Thực chất là bookingId (ví dụ: BK1717506300994)
  const { lyDoHuy } = req.body;
  const userId = req.user.id;

  try {
    const pool = await sql.connect();
    
    // Tìm tất cả các vé thuộc booking này
    const ticketsResult = await pool.request()
      .input('bookingId', sql.VarChar, ticketId)
      .input('maKhachHang', sql.Int, userId)
      .query(`
        SELECT v.maVe, v.trangThaiVe, c.thoiGianDi 
        FROM VeDienTu v
        INNER JOIN ChuyenXe c ON v.maChuyenXe = c.maChuyenXe
        WHERE (v.maQR LIKE @bookingId + '%' OR CAST(v.maVe AS VARCHAR) = @bookingId)
          AND v.maKhachHang = @maKhachHang
      `);

    const tickets = ticketsResult.recordset;

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé cần hủy' });
    }

    // Lấy thông tin chuyến đi từ vé đầu tiên (cùng chuyến)
    const firstTicket = tickets[0];

    // Chỉ vé đã thanh toán mới được hủy để hoàn tiền
    if (firstTicket.trangThaiVe !== 'da_thanh_toan') {
      return res.status(400).json({ message: 'Chỉ vé đã thanh toán mới có thể yêu cầu hủy' });
    }

    // Kiểm tra thời gian
    const now = new Date();
    const thoiGianDi = new Date(firstTicket.thoiGianDi);
    if (thoiGianDi <= now) {
      return res.status(400).json({ message: 'Chuyến xe đã khởi hành, không thể hủy' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const t of tickets) {
        // Kiểm tra xem đã có yêu cầu nào pending chưa
        const existingReq = await transaction.request()
          .input('maVe', sql.Int, t.maVe)
          .query(`SELECT maYeuCau FROM CancellationRequest WHERE maVe = @maVe AND trangThai = 'pending'`);

        if (existingReq.recordset.length > 0) {
          continue; // Bỏ qua nếu đã có yêu cầu (hoặc có thể ném lỗi)
        }

        // Tạo yêu cầu hủy
        await transaction.request()
          .input('maVe', sql.Int, t.maVe)
          .input('maKhachHang', sql.Int, userId)
          .input('lyDoHuy', sql.NVarChar, lyDoHuy || 'Yêu cầu hủy từ khách hàng')
          .query(`
            INSERT INTO CancellationRequest (maVe, maKhachHang, lyDoHuy, trangThai, trangThaiHoan)
            VALUES (@maVe, @maKhachHang, @lyDoHuy, 'pending', 'pending')
          `);
      }

      await transaction.commit();
      res.status(201).json({ message: 'Đã gửi yêu cầu hủy vé thành công. Vui lòng đợi nhân viên xác nhận.' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi requestTicketCancellation:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu hủy vé' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyChatSession,
  createMyChatSession,
  getMyChatMessages,
  sendMyChatMessage,
  requestTicketCancellation
};
