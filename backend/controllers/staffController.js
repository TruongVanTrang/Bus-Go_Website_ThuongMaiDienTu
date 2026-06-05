const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');
const { sendCancellationApprovedEmail, sendCancellationRejectedEmail } = require('../utils/emailService');

const VALID_ROLES = ['DRIVER', 'TICKET_STAFF', 'SUPPORT_STAFF'];

const formatDate = (dateObj) => {
  const d = new Date(dateObj);
  let month = '' + (d.getUTCMonth() + 1);
  let day = '' + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const formatTime = (dateObj) => {
  const d = new Date(dateObj);
  let hours = '' + d.getUTCHours();
  let minutes = '' + d.getUTCMinutes();

  if (hours.length < 2) hours = '0' + hours;
  if (minutes.length < 2) minutes = '0' + minutes;

  return [hours, minutes].join(':');
};

// @desc    Tạo tài khoản nhân sự
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  const { fullName, email, phone, password, role } = req.body;

  if (!fullName || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`
    });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra email hoặc SĐT đã tồn tại chưa
    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .query('SELECT maNguoiDung FROM NguoiDung WHERE email = @email OR soDienThoai = @phone');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insert NguoiDung
      const insertUserResult = await transaction.request()
        .input('tenNguoiDung', sql.NVarChar, fullName)
        .input('email', sql.VarChar, email)
        .input('soDienThoai', sql.VarChar, phone)
        .input('matKhau', sql.VarChar, hashedPassword)
        .query(`
          INSERT INTO NguoiDung (tenNguoiDung, email, soDienThoai, matKhau, daXacThucEmail, trangThaiTaiKhoan)
          OUTPUT INSERTED.maNguoiDung
          VALUES (@tenNguoiDung, @email, @soDienThoai, @matKhau, 1, 'active')
        `);

      const userId = insertUserResult.recordset[0].maNguoiDung;

      // 2. Insert NhanVien
      await transaction.request()
        .input('maNhanVien', sql.Int, userId)
        .input('vaiTro', sql.VarChar, role)
        .query(`
          INSERT INTO NhanVien (maNhanVien, vaiTro)
          VALUES (@maNhanVien, @vaiTro)
        `);

      // 3. Nếu là DRIVER, insert thêm vào TaiXe nếu bảng tồn tại
      if (role === 'DRIVER') {
        await transaction.request()
          .input('maTaiXe', sql.Int, userId)
          .query(`
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TaiXe')
            BEGIN
              INSERT INTO TaiXe (maTaiXe, trangThai)
              VALUES (@maTaiXe, 'active')
            END
          `);
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Tạo tài khoản nhân sự thành công',
        staff: { id: userId, name: fullName, email, phone, role }
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi tạo tài khoản nhân sự:', error.message);
    console.error('Chi tiết:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo tài khoản nhân sự', error: error.message });
  }
};

// @desc    Lấy danh sách nhân sự
// @route   GET /api/admin/staff
// @access  Private/Admin
const getAllStaff = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT
        nd.maNguoiDung, nd.tenNguoiDung, nd.email, nd.soDienThoai,
        nd.trangThaiTaiKhoan, nd.ngayTaoTaiKhoan,
        nv.vaiTro, nv.lichLamViec
      FROM NguoiDung nd
      INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
      ORDER BY nd.ngayTaoTaiKhoan DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân sự' });
  }
};

// @desc    Cập nhật thông tin nhân sự
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, role, trangThaiTaiKhoan } = req.body;

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`
    });
  }

  try {
    const pool = await sql.connect();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT nd.maNguoiDung FROM NguoiDung nd
        INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
        WHERE nd.maNguoiDung = @id
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân sự' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction.request()
        .input('id', sql.Int, id)
        .input('tenNguoiDung', sql.NVarChar, fullName || null)
        .input('soDienThoai', sql.VarChar, phone || null)
        .input('trangThaiTaiKhoan', sql.VarChar, trangThaiTaiKhoan || null)
        .query(`
          UPDATE NguoiDung SET
            tenNguoiDung      = COALESCE(@tenNguoiDung, tenNguoiDung),
            soDienThoai       = COALESCE(@soDienThoai, soDienThoai),
            trangThaiTaiKhoan = COALESCE(@trangThaiTaiKhoan, trangThaiTaiKhoan),
            ngayCapNhatCuoi   = GETDATE()
          WHERE maNguoiDung = @id
        `);

      if (role) {
        await transaction.request()
          .input('id', sql.Int, id)
          .input('vaiTro', sql.VarChar, role)
          .query('UPDATE NhanVien SET vaiTro = @vaiTro WHERE maNhanVien = @id');
      }

      await transaction.commit();
      res.json({ message: 'Cập nhật thông tin nhân sự thành công' });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi cập nhật nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân sự' });
  }
};

// @desc    Lấy danh sách vé theo chuyến xe hoặc ngày
// @route   GET /api/staff/tickets
// @access  Private/Ticket-Staff
const getTicketsList = async (req, res) => {
  const { maChuyenXe, ngayDi } = req.query;

  if (!maChuyenXe && !ngayDi) {
    return res.status(400).json({ message: 'Vui lòng cung cấp maChuyenXe hoặc ngayDi' });
  }

  try {
    const pool = await sql.connect();

    let query = `
      SELECT
        vdt.maVe,
        vdt.hoTenHanhKhach,
        vdt.emailHanhKhach,
        vdt.soDienThoaiHanhKhach,
        vdt.maQR,
        vdt.giaVe,
        vdt.giaHangHoa,
        vdt.giaThanhToan,
        vdt.trangThaiVe,
        vdt.ngayDatVe,
        vdt.maChuyenXe,
        td.diemDi,
        td.diemDen,
        cx.thoiGianDi,
        cx.thoiGianDen,
        gh.soGhe,
        ptt.tenPhuongThuc
      FROM VeDienTu vdt
      INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
      INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
      LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
      LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc
      WHERE 1=1
    `;

    if (maChuyenXe) {
      query += ` AND vdt.maChuyenXe = @maChuyenXe`;
    }

    if (ngayDi) {
      query += ` AND CAST(cx.thoiGianDi AS DATE) = @ngayDi`;
    }

    query += ` ORDER BY vdt.ngayDatVe DESC`;

    const request = pool.request();
    if (maChuyenXe) {
      request.input('maChuyenXe', sql.Int, maChuyenXe);
    }
    if (ngayDi) {
      request.input('ngayDi', sql.Date, ngayDi);
    }

    const result = await request.query(query);

    const tickets = result.recordset.map(t => ({
      maVe: t.maVe,
      hoTenHanhKhach: t.hoTenHanhKhach,
      email: t.emailHanhKhach,
      phone: t.soDienThoaiHanhKhach,
      maQR: t.maQR,
      soGhe: t.soGhe,
      giaVe: Number(t.giaVe),
      giaHangHoa: Number(t.giaHangHoa),
      giaThanhToan: Number(t.giaThanhToan),
      trangThaiVe: t.trangThaiVe,
      ngayDatVe: formatDate(t.ngayDatVe),
      chuyenXe: {
        maChuyenXe: t.maChuyenXe,
        diemDi: t.diemDi,
        diemDen: t.diemDen,
        thoiGianDi: formatDate(t.thoiGianDi),
        gioDi: formatTime(t.thoiGianDi),
        gioTra: formatTime(t.thoiGianDen)
      },
      phuongThucThanhToan: t.tenPhuongThuc
    }));

    res.json({ tickets, total: tickets.length });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vé:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách vé' });
  }
};

// @desc    Check-in hành khách bằng quét mã QR
// @route   POST /api/staff/tickets/check-in
// @access  Private/Ticket-Staff
const checkInTicket = async (req, res) => {
  const { maQR, maVe } = req.body;

  if (!maQR && !maVe) {
    return res.status(400).json({ message: 'Vui lòng cung cấp maQR hoặc maVe' });
  }

  try {
    const pool = await sql.connect();

    let query = 'SELECT maVe, trangThaiVe, hoTenHanhKhach FROM VeDienTu WHERE ';
    const request = pool.request();

    if (maQR) {
      query += 'maQR = @maQR';
      request.input('maQR', sql.VarChar, maQR);
    } else {
      query += 'maVe = @maVe';
      request.input('maVe', sql.Int, maVe);
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const ticket = result.recordset[0];

    if (ticket.trangThaiVe === 'da_su_dung') {
      return res.status(400).json({ message: 'Vé đã được check-in' });
    }

    if (ticket.trangThaiVe === 'da_huy') {
      return res.status(400).json({ message: 'Vé đã bị hủy' });
    }

    // Update ticket status to check-in
    await pool.request()
      .input('maVe', sql.Int, ticket.maVe)
      .query(`
        UPDATE VeDienTu
        SET trangThaiVe = 'da_su_dung', ngayCapNhat = GETDATE()
        WHERE maVe = @maVe
      `);

    res.json({
      message: 'Check-in thành công',
      ticket: {
        maVe: ticket.maVe,
        hoTenHanhKhach: ticket.hoTenHanhKhach,
        trangThaiMoi: 'da_su_dung'
      }
    });

  } catch (error) {
    console.error('Lỗi khi check-in vé:', error);
    res.status(500).json({ message: 'Lỗi server khi check-in vé' });
  }
};

// @desc    Đặt vé và xuất vé trực tiếp tại quầy (khách vãng lai - thanh toán tiền mặt)
// @route   POST /api/staff/tickets/offline
// @access  Private/Ticket-Staff
const createOfflineTicket = async (req, res) => {
  const { maChuyenXe, selectedSeats, passengerInfo, cargoInfo } = req.body;

  if (!maChuyenXe || !passengerInfo || !selectedSeats || selectedSeats.length === 0) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    const pool = await sql.connect();

    // Get payment method ID for cash (tiền mặt)
    const paymentResult = await pool.request()
      .input('tenPhuongThuc', sql.NVarChar, 'Tiền mặt')
      .query('SELECT maPhuongThuc FROM PhuongThucThanhToan WHERE tenPhuongThuc = @tenPhuongThuc');

    const maPhuongThuc = paymentResult.recordset[0]?.maPhuongThuc || 3; // fallback

    // Get trip information
    const tripResult = await pool.request()
      .input('maChuyenXe', sql.Int, maChuyenXe)
      .query(`
        SELECT cx.giaCoBan, cx.thoiGianDi, cx.thoiGianDen, td.diemDi, td.diemDen
        FROM ChuyenXe cx
        JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        WHERE cx.maChuyenXe = @maChuyenXe
      `);

    if (tripResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
    }

    const tripData = tripResult.recordset[0];
    const giaCoBan = Number(tripData.giaCoBan);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const createdBookingId = 'OFFLINE-' + Date.now();
      const createdTickets = [];

      for (let i = 0; i < selectedSeats.length; i++) {
        const seatName = String(selectedSeats[i]);

        // Check/Insert seat
        let seatId;
        const checkSeatResult = await transaction.request()
          .input('maChuyenXe', sql.Int, maChuyenXe)
          .input('soGhe', sql.VarChar, seatName)
          .query('SELECT maGhe, trangThaiGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = @soGhe');

        if (checkSeatResult.recordset.length > 0) {
          const seat = checkSeatResult.recordset[0];
          if (seat.trangThaiGhe !== 'trong') {
            await transaction.rollback();
            return res.status(400).json({ message: `Ghế ${seatName} đã được đặt` });
          }
          seatId = seat.maGhe;
          await transaction.request()
            .input('maGhe', sql.Int, seatId)
            .query("UPDATE GheNgoi SET trangThaiGhe = 'da_dat' WHERE maGhe = @maGhe");
        } else {
          const insertSeatResult = await transaction.request()
            .input('maChuyenXe', sql.Int, maChuyenXe)
            .input('soGhe', sql.VarChar, seatName)
            .query(`
              INSERT INTO GheNgoi (maChuyenXe, soGhe, loaiGhe, viTriGhe, giaSoGhe, trangThaiGhe)
              VALUES (@maChuyenXe, @soGhe, 'standard', 'middle', 0, 'da_dat');
              SELECT SCOPE_IDENTITY() AS maGhe;
            `);
          seatId = insertSeatResult.recordset[0].maGhe;
        }

        // Create ticket - status da_thanh_toan since it's cash payment
        const qrCode = `${createdBookingId}-${seatName}`;
        const giaHangHoa = (i === 0 && cargoInfo && cargoInfo.type !== 'none') ? Number(cargoInfo.estimatedPrice || 0) : 0;
        const totalTicketPrice = giaCoBan + giaHangHoa;

        const insertTicketResult = await transaction.request()
          .input('maChuyenXe', sql.Int, maChuyenXe)
          .input('maGhe', sql.Int, seatId)
          .input('hoTenHanhKhach', sql.NVarChar, `${passengerInfo.firstName} ${passengerInfo.lastName}`)
          .input('firstName', sql.NVarChar, passengerInfo.firstName)
          .input('lastName', sql.NVarChar, passengerInfo.lastName)
          .input('emailHanhKhach', sql.VarChar, passengerInfo.email || '')
          .input('soDienThoaiHanhKhach', sql.VarChar, passengerInfo.phone || '')
          .input('diemDon', sql.NVarChar, 'Bến đi')
          .input('diemTra', sql.NVarChar, 'Bến đến')
          .input('maQR', sql.VarChar, qrCode)
          .input('maPhuongThuc', sql.Int, maPhuongThuc)
          .input('giaVe', sql.Decimal(18, 2), giaCoBan)
          .input('giaHangHoa', sql.Decimal(18, 2), giaHangHoa)
          .input('giaThanhToan', sql.Decimal(18, 2), totalTicketPrice)
          .input('trangThaiVe', sql.VarChar, 'da_thanh_toan')
          .query(`
            INSERT INTO VeDienTu (maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
            VALUES (@maChuyenXe, @maGhe, @hoTenHanhKhach, @firstName, @lastName, @emailHanhKhach, @soDienThoaiHanhKhach, @diemDon, @diemTra, @maQR, @maPhuongThuc, @giaVe, @giaHangHoa, @giaThanhToan, @trangThaiVe);
            SELECT SCOPE_IDENTITY() AS maVe;
          `);

        const ticketId = insertTicketResult.recordset[0].maVe;

        // Insert cargo info if needed
        if (i === 0 && cargoInfo && cargoInfo.type !== 'none') {
          await transaction.request()
            .input('maVe', sql.Int, ticketId)
            .input('loaiHangHoa', sql.NVarChar, cargoInfo.type)
            .input('moTa', sql.NVarChar, cargoInfo.description || 'Hàng gửi đi kèm vé')
            .input('trongLuong', sql.Float, cargoInfo.weight || 0)
            .input('giaHangHoa', sql.Decimal(18, 2), giaHangHoa)
            .input('tenNguoiGui', sql.NVarChar, `${passengerInfo.firstName} ${passengerInfo.lastName}`)
            .input('soDienThoaiNguoiGui', sql.VarChar, passengerInfo.phone)
            .input('tenNguoiNhan', sql.NVarChar, cargoInfo.receiverName || 'Người nhận')
            .input('soDienThoaiNguoiNhan', sql.VarChar, cargoInfo.receiverPhone || '')
            .input('giaTrucDeclare', sql.Decimal(18, 2), cargoInfo.declaredValue || 0)
            .input('giaBAO_HIEM', sql.Decimal(18, 2), cargoInfo.insuranceFee || 0)
            .query(`
              INSERT INTO HangHoa (maVe, loaiHangHoa, moTa, trongLuong, giaHangHoa, tenNguoiGui, soDienThoaiNguoiGui, tenNguoiNhan, soDienThoaiNguoiNhan, giaTrucDeclare, giaBAO_HIEM, trangThaiVanChuyen)
              VALUES (@maVe, @loaiHangHoa, @moTa, @trongLuong, @giaHangHoa, @tenNguoiGui, @soDienThoaiNguoiGui, @tenNguoiNhan, @soDienThoaiNguoiNhan, @giaTrucDeclare, @giaBAO_HIEM, 'pending')
            `);
        }

        createdTickets.push({
          maVe: ticketId,
          soGhe: seatName,
          maQR: qrCode,
          giaVe: giaCoBan,
          giaHangHoa: giaHangHoa
        });
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Tạo vé tại quầy thành công',
        bookingId: createdBookingId,
        passengerInfo: passengerInfo,
        trip: {
          maChuyenXe: maChuyenXe,
          diemDi: tripData.diemDi,
          diemDen: tripData.diemDen,
          thoiGianDi: formatDate(tripData.thoiGianDi),
          gioDi: formatTime(tripData.thoiGianDi),
          gioTra: formatTime(tripData.thoiGianDen)
        },
        tickets: createdTickets,
        totalPrice: createdTickets.reduce((sum, t) => sum + t.giaVe + t.giaHangHoa, 0)
      });

    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Lỗi rollback:', rollbackErr);
      }
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi tạo vé tại quầy:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo vé tại quầy' });
  }
};

// @desc    Xử lý hoàn tiền vé
// @route   PUT /api/staff/tickets/:id/refund
// @access  Private/Ticket-Staff
const refundTicket = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const pool = await sql.connect();

    const ticketResult = await pool.request()
      .input('maVe', sql.Int, id)
      .query('SELECT maVe, maGhe, maChuyenXe, trangThaiVe, giaThanhToan FROM VeDienTu WHERE maVe = @maVe');

    if (ticketResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const ticket = ticketResult.recordset[0];

    if (ticket.trangThaiVe === 'da_huy') {
      return res.status(400).json({ message: 'Vé đã bị hủy' });
    }

    if (ticket.trangThaiVe === 'da_su_dung') {
      return res.status(400).json({ message: 'Không thể hoàn tiền vé đã sử dụng' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Update ticket status to da_huy
      await transaction.request()
        .input('maVe', sql.Int, ticket.maVe)
        .query(`
          UPDATE VeDienTu
          SET trangThaiVe = 'da_huy', ngayCapNhat = GETDATE()
          WHERE maVe = @maVe
        `);

      // 2. Free up seat
      if (ticket.maGhe) {
        await transaction.request()
          .input('maGhe', sql.Int, ticket.maGhe)
          .query("UPDATE GheNgoi SET trangThaiGhe = 'trong' WHERE maGhe = @maGhe");
      }

      await transaction.commit();

      res.json({
        message: 'Xử lý hoàn tiền thành công',
        refund: {
          maVe: ticket.maVe,
          soTienHoanLai: Number(ticket.giaThanhToan),
          lyDo: reason || 'Hủy vé tại quầy'
        }
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi xử lý hoàn tiền:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý hoàn tiền' });
  }
};

// =============================================================================
// SUPPORT STAFF – LIVE CHAT
// =============================================================================

// Chính sách hoàn tiền:
// > 24h  : 95% (100% - 5% phí HC)
// 12-24h : 70% (75%  - 5% phí HC)
// 1-12h  : 45% (50%  - 5% phí HC)
// < 1h   : 0%  (không hoàn)
// Đã KH  : 0%  (không hoàn)
const calculateRefundPolicy = (hoursUntilDeparture) => {
  if (hoursUntilDeparture > 24) {
    return { phanTramHoan: 95, moTa: 'Hoàn 100% - 5% phí hành chính', ghiChu: 'Hủy trước 24 giờ' };
  } else if (hoursUntilDeparture > 12) {
    return { phanTramHoan: 70, moTa: 'Hoàn 75% - 5% phí hành chính', ghiChu: 'Hủy trong 12-24 giờ trước khởi hành' };
  } else if (hoursUntilDeparture > 1) {
    return { phanTramHoan: 45, moTa: 'Hoàn 50% - 5% phí hành chính', ghiChu: 'Hủy trong 1-12 giờ trước khởi hành' };
  } else {
    return { phanTramHoan: 0, moTa: 'Không hoàn tiền', ghiChu: hoursUntilDeparture <= 0 ? 'Chuyến xe đã khởi hành' : 'Hủy trong vòng 1 giờ trước khởi hành' };
  }
};

// @desc    Lấy danh sách phiên chat (Support Agent)
// @route   GET /api/staff/support/chats
// @access  Private/Support-Staff
const getChatSessions = async (req, res) => {
  const agentId = req.user.id;
  const { trangThai } = req.query;

  try {
    const pool = await sql.connect();
    // Support Staff có thể xem TẤT CẢ phiên chat (không chỉ của họ)
    // để có thể pick up từ bất kỳ khách nào
    let query = `
      SELECT
        cs.maChatSession, 
        cs.maKhachHang, 
        ISNULL(nd.tenNguoiDung, cs.tenKhachHang) AS tenKhachHang,
        ISNULL(nd.email, cs.emailKhach) AS emailKhach,
        cs.trangThai, 
        cs.chuDeChat, 
        cs.thoiGianBatDau, 
        cs.thoiGianCapNhat,
        cs.maNhanVienHT, 
        nv_user.tenNguoiDung AS tenAgentHienTai,
        (
          SELECT TOP 1 noiDung FROM ChatMessage
          WHERE maChatSession = cs.maChatSession
          ORDER BY thoiGianGui DESC
        ) AS tinNhanCuoi,
        (
          SELECT COUNT(*) FROM ChatMessage
          WHERE maChatSession = cs.maChatSession AND nguoiGui = 'customer' AND trangThaiDoc = 'sent'
        ) AS soTinChuaDoc
      FROM ChatSession cs
      LEFT JOIN NguoiDung nd ON cs.maKhachHang = nd.maNguoiDung
      LEFT JOIN NhanVien nv ON cs.maNhanVienHT = nv.maNhanVien
      LEFT JOIN NguoiDung nv_user ON nv.maNhanVien = nv_user.maNguoiDung
    `;

    const request = pool.request();

    if (trangThai) {
      query += ` WHERE cs.trangThai = @trangThai`;
      request.input('trangThai', sql.VarChar, trangThai);
    }

    query += ` ORDER BY cs.thoiGianCapNhat DESC`;

    const result = await request.query(query);
    res.json({ chatSessions: result.recordset, total: result.recordset.length });
  } catch (error) {
    console.error('Lỗi getChatSessions:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phiên chat', error: error.message });
  }
};

// @desc    Lấy tin nhắn của một phiên chat
// @route   GET /api/staff/support/chats/:sessionId/messages
// @access  Private/Support-Staff
const getChatMessages = async (req, res) => {
  const { sessionId } = req.params;
  const agentId = req.user.id;

  try {
    const pool = await sql.connect();

    // Kiểm tra phiên chat tồn tại (không cần check agent cụ thể)
    const sessionResult = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        SELECT cs.*, 
               ISNULL(nd.tenNguoiDung, cs.tenKhachHang) AS tenKhachHangTaiKhoan,
               nv_user.tenNguoiDung AS tenAgentHienTai
        FROM ChatSession cs
        LEFT JOIN NguoiDung nd ON cs.maKhachHang = nd.maNguoiDung
        LEFT JOIN NhanVien nv ON cs.maNhanVienHT = nv.maNhanVien
        LEFT JOIN NguoiDung nv_user ON nv.maNhanVien = nv_user.maNguoiDung
        WHERE cs.maChatSession = @sessionId
      `);

    if (sessionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }

    // Nếu phiên chưa được gán cho ai, assign cho agent hiện tại
    const session = sessionResult.recordset[0];
    if (!session.maNhanVienHT) {
      await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .input('agentId', sql.Int, agentId)
        .query(`
          UPDATE ChatSession 
          SET maNhanVienHT = @agentId 
          WHERE maChatSession = @sessionId
        `);
    }

    // Lấy tin nhắn
    const msgResult = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        SELECT maTinNhan, maChatSession, nguoiGui, maNguoiGui, noiDung, trangThaiDoc, thoiGianGui
        FROM ChatMessage
        WHERE maChatSession = @sessionId
        ORDER BY thoiGianGui ASC
      `);

    // Đánh dấu đã đọc cho tin của customer
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        UPDATE ChatMessage SET trangThaiDoc = 'read'
        WHERE maChatSession = @sessionId AND nguoiGui = 'customer' AND trangThaiDoc = 'sent'
      `);

    res.json({
      session: sessionResult.recordset[0],
      messages: msgResult.recordset
    });
  } catch (error) {
    console.error('Lỗi getChatMessages:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn' });
  }
};

// @desc    Gửi tin nhắn (Support Agent)
// @route   POST /api/staff/support/chats/:sessionId/messages
// @access  Private/Support-Staff
const sendChatMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { noiDung } = req.body;
  const agentId = req.user.id;

  if (!noiDung || !noiDung.trim()) {
    return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra phiên chat tồn tại (không cần check agent cụ thể)
    const sessionCheck = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`SELECT trangThai FROM ChatSession WHERE maChatSession = @sessionId`);

    if (sessionCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }

    if (sessionCheck.recordset[0].trangThai === 'closed') {
      return res.status(400).json({ message: 'Phiên chat đã đóng, không thể gửi tin nhắn' });
    }

    // Insert tin nhắn
    const insertResult = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('nguoiGui', sql.VarChar, 'agent')
      .input('maNguoiGui', sql.Int, agentId)
      .input('noiDung', sql.NVarChar, noiDung.trim())
      .query(`
        INSERT INTO ChatMessage (maChatSession, nguoiGui, maNguoiGui, noiDung, trangThaiDoc)
        VALUES (@sessionId, @nguoiGui, @maNguoiGui, @noiDung, 'sent');
        SELECT SCOPE_IDENTITY() AS maTinNhan;
      `);

    // Cập nhật thời gian session và đảm bảo agent được assign
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('agentId', sql.Int, agentId)
      .query(`
        UPDATE ChatSession 
        SET thoiGianCapNhat = GETDATE(), trangThai = 'active',
            maNhanVienHT = ISNULL(maNhanVienHT, @agentId)
        WHERE maChatSession = @sessionId
      `);

    res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      tinNhan: {
        maTinNhan: insertResult.recordset[0].maTinNhan,
        maChatSession: parseInt(sessionId),
        nguoiGui: 'agent',
        maNguoiGui: agentId,
        noiDung: noiDung.trim(),
        trangThaiDoc: 'sent',
        thoiGianGui: new Date()
      }
    });
  } catch (error) {
    console.error('Lỗi sendChatMessage:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
  }
};

// @desc    Đóng phiên chat
// @route   PUT /api/staff/support/chats/:sessionId/close
// @access  Private/Support-Staff
const closeChatSession = async (req, res) => {
  const { sessionId } = req.params;
  const agentId = req.user.id;

  try {
    const pool = await sql.connect();

    const result = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        UPDATE ChatSession
        SET trangThai = 'closed', thoiGianKetThuc = GETDATE(), thoiGianCapNhat = GETDATE()
        WHERE maChatSession = @sessionId AND trangThai != 'closed'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hoặc phiên chat đã đóng' });
    }

    res.json({ message: 'Đã đóng phiên chat thành công' });
  } catch (error) {
    console.error('Lỗi closeChatSession:', error);
    res.status(500).json({ message: 'Lỗi server khi đóng phiên chat' });
  }
};

// @desc    Tạo phiên chat mới
// @route   POST /api/staff/support/chats
// @access  Private/Support-Staff
const createChatSession = async (req, res) => {
  const agentId = req.user.id;
  const { maKhachHang, tenKhachHang, emailKhach, chuDeChat } = req.body;

  if (!maKhachHang && !tenKhachHang) {
    return res.status(400).json({ message: 'Vui lòng cung cấp thông tin khách hàng' });
  }

  try {
    const pool = await sql.connect();

    const insertResult = await pool.request()
      .input('agentId', sql.Int, agentId)
      .input('maKhachHang', sql.Int, maKhachHang || null)
      .input('tenKhachHang', sql.NVarChar, tenKhachHang || null)
      .input('emailKhach', sql.VarChar, emailKhach || null)
      .input('chuDeChat', sql.NVarChar, chuDeChat || null)
      .query(`
        INSERT INTO ChatSession (maNhanVienHT, maKhachHang, tenKhachHang, emailKhach, trangThai, chuDeChat)
        VALUES (@agentId, @maKhachHang, @tenKhachHang, @emailKhach, 'active', @chuDeChat);
        SELECT SCOPE_IDENTITY() AS maChatSession;
      `);

    res.status(201).json({
      message: 'Tạo phiên chat thành công',
      maChatSession: insertResult.recordset[0].maChatSession
    });
  } catch (error) {
    console.error('Lỗi createChatSession:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo phiên chat' });
  }
};

// @desc    Lấy vé của khách hàng (để hiển thị trong chat)
// @route   GET /api/staff/support/customers/:customerId/tickets
// @access  Private/Support-Staff
const getCustomerTickets = async (req, res) => {
  const { customerId } = req.params;

  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('customerId', sql.Int, customerId)
      .query(`
        SELECT
          vdt.maVe, vdt.hoTenHanhKhach, vdt.emailHanhKhach, vdt.soDienThoaiHanhKhach,
          vdt.giaVe, vdt.giaHangHoa, vdt.giaThanhToan, vdt.trangThaiVe, vdt.ngayDatVe,
          vdt.maChuyenXe,
          td.diemDi, td.diemDen,
          cx.thoiGianDi, cx.thoiGianDen, cx.trangThaiChuyen,
          gh.soGhe,
          ptt.tenPhuongThuc
        FROM VeDienTu vdt
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
        LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc
        WHERE vdt.maKhachHang = @customerId
        ORDER BY vdt.ngayDatVe DESC
      `);

    const tickets = result.recordset.map(t => ({
      maVe: t.maVe,
      hoTenHanhKhach: t.hoTenHanhKhach,
      email: t.emailHanhKhach,
      phone: t.soDienThoaiHanhKhach,
      soGhe: t.soGhe,
      giaVe: Number(t.giaVe),
      giaThanhToan: Number(t.giaThanhToan),
      trangThaiVe: t.trangThaiVe,
      ngayDatVe: t.ngayDatVe,
      phuongThucThanhToan: t.tenPhuongThuc,
      chuyenXe: {
        maChuyenXe: t.maChuyenXe,
        diemDi: t.diemDi,
        diemDen: t.diemDen,
        thoiGianDi: t.thoiGianDi,
        thoiGianDen: t.thoiGianDen,
        trangThaiChuyen: t.trangThaiChuyen
      }
    }));

    res.json({ tickets, total: tickets.length });
  } catch (error) {
    console.error('Lỗi getCustomerTickets:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy vé khách hàng' });
  }
};

// =============================================================================
// SUPPORT STAFF – CANCELLATION / REFUND
// =============================================================================

// @desc    Lấy danh sách yêu cầu hoàn/hủy vé
// @route   GET /api/staff/support/cancellations
// @access  Private/Support-Staff
const getCancellationRequests = async (req, res) => {
  const { trangThai, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect();
    
    // Query tối ưu: 1 CancellationRequest = 1 booking (đã tạo từ customer)
    let query = `
      SELECT
        cr.maYeuCau,
        cr.maVe,
        vdt.maQR,
        cr.trangThai,
        cr.trangThaiHoan,
        cr.lyDoHuy,
        cr.giaVeGoc,
        cr.phanTramHoan,
        cr.soTienHoan,
        cr.lyDoTuChoi,
        cr.thoiGianYeuCau,
        cr.thoiGianXuLy,
        vdt.hoTenHanhKhach,
        vdt.emailHanhKhach,
        vdt.soDienThoaiHanhKhach,
        vdt.trangThaiVe,
        vdt.maKhachHang,
        vdt.maChuyenXe,
        vdt.ngayDatVe,
        td.diemDi,
        td.diemDen,
        cx.thoiGianDi,
        cx.thoiGianDen,
        nd.tenNguoiDung AS tenNhanVienXuLy,
        (SELECT COUNT(*) FROM VeDienTu WHERE maQR LIKE (CASE WHEN CHARINDEX('-', vdt.maQR) > 0 THEN LEFT(vdt.maQR, CHARINDEX('-', vdt.maQR) - 1) ELSE vdt.maQR END) + '%') AS soVeInBooking
      FROM CancellationRequest cr
      INNER JOIN VeDienTu vdt ON cr.maVe = vdt.maVe
      INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
      INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
      LEFT JOIN NhanVien nv ON cr.maNhanVienXuLy = nv.maNhanVien
      LEFT JOIN NguoiDung nd ON nv.maNhanVien = nd.maNguoiDung
      WHERE 1=1
    `;

    const request = pool.request();
    if (trangThai) {
      query += ` AND cr.trangThai = @trangThai`;
      request.input('trangThai', sql.VarChar, trangThai);
    }

    query += `
      ORDER BY cr.thoiGianYeuCau DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const result = await request.query(query);
    
    // Đếm tổng số request
    let countQuery = `
      SELECT COUNT(*) as total
      FROM CancellationRequest cr
      WHERE 1=1
    `;
    
    if (trangThai) {
      countQuery += ` AND cr.trangThai = @trangThai`;
    }
    
    const countRequest = pool.request();
    if (trangThai) {
      countRequest.input('trangThai', sql.VarChar, trangThai);
    }
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    const requests = result.recordset;

    // Lấy chi tiết từng vé trong booking
    for (const req of requests) {
      const detailReq = pool.request();
      let detailQuery = `
        SELECT vdt.maVe, vdt.giaThanhToan, vdt.trangThaiVe, gh.soGhe
        FROM VeDienTu vdt
        LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
        WHERE 1=1
      `;
      if (req.maQR) {
        const bookingId = req.maQR.split('-')[0];
        detailQuery += ` AND vdt.maQR LIKE @bookingId + '%'`;
        detailReq.input('bookingId', sql.VarChar, bookingId);
      } else {
        detailQuery += ` AND vdt.maChuyenXe = @maChuyenXe AND vdt.maKhachHang = @maKhachHang AND CAST(vdt.ngayDatVe AS DATE) = CAST(@ngayDatVe AS DATE)`;
        detailReq.input('maChuyenXe', sql.Int, req.maChuyenXe);
        detailReq.input('maKhachHang', sql.Int, req.maKhachHang);
        detailReq.input('ngayDatVe', sql.DateTime, req.ngayDatVe);
      }
      const detailResult = await detailReq.query(detailQuery);
      req.danhSachVe = detailResult.recordset;
      req.soVeInBooking = req.danhSachVe.length;
    }

    res.json({ 
      requests: requests, 
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      note: '1 request = 1 booking. Khi phê duyệt/từ chối, tất cả vé trong booking sẽ được xử lý'
    });
  } catch (error) {
    console.error('Lỗi getCancellationRequests:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách yêu cầu' });
  }
};

// @desc    Kiểm tra điều kiện hủy vé và tính toán hoàn tiền
// @route   GET /api/staff/support/cancellations/:ticketId/check
// @access  Private/Support-Staff
const checkCancellationEligibility = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('maVe', sql.Int, ticketId)
      .query(`
        SELECT
          vdt.maVe, vdt.hoTenHanhKhach, vdt.emailHanhKhach, vdt.soDienThoaiHanhKhach,
          vdt.trangThaiVe, vdt.giaVe, vdt.giaHangHoa, vdt.giaThanhToan,
          vdt.ngayDatVe, vdt.maChuyenXe, vdt.maQR,
          cx.thoiGianDi, cx.trangThaiChuyen,
          td.diemDi, td.diemDen,
          gh.soGhe,
          ptt.tenPhuongThuc
        FROM VeDienTu vdt
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
        LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc
        WHERE vdt.maVe = @maVe
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const ticket = result.recordset[0];
    const now = new Date();
    const thoiGianDi = new Date(ticket.thoiGianDi);
    const hoursUntilDeparture = (thoiGianDi - now) / (1000 * 60 * 60);

    // Kiểm tra điều kiện
    let coTheHuy = true;
    let lyDoKhongHuy = null;
    let coTheHoan = false;

    if (ticket.trangThaiVe === 'da_huy') {
      coTheHuy = false;
      lyDoKhongHuy = 'Vé đã bị hủy trước đó';
    } else if (ticket.trangThaiVe === 'da_su_dung') {
      coTheHuy = false;
      lyDoKhongHuy = 'Vé đã được sử dụng (check-in)';
    } else if (ticket.trangThaiChuyen === 'da_hoan_thanh') {
      coTheHuy = false;
      lyDoKhongHuy = 'Chuyến xe đã hoàn thành';
    } else if (hoursUntilDeparture <= 0) {
      coTheHuy = false;
      lyDoKhongHuy = 'Chuyến xe đã khởi hành';
    }

    // Lấy tất cả vé trong booking để tính tổng
    let totalGiaVeGoc = Number(ticket.giaThanhToan || ticket.giaVe);
    if (ticket.maQR && ticket.maQR.trim()) {
      const bookingId = ticket.maQR.split('-')[0];
      const allTicketsRes = await pool.request()
        .input('bookingId', sql.VarChar, bookingId)
        .query(`SELECT giaThanhToan, giaVe FROM VeDienTu WHERE maQR LIKE @bookingId + '%'`);
      totalGiaVeGoc = allTicketsRes.recordset.reduce((sum, t) => sum + Number(t.giaThanhToan || t.giaVe), 0);
    }

    // Tính toán hoàn tiền nếu đủ điều kiện
    const refundPolicy = calculateRefundPolicy(hoursUntilDeparture);
    const soTienHoan = coTheHuy ? Math.floor(totalGiaVeGoc * refundPolicy.phanTramHoan / 100) : 0;

    // Kiểm tra trạng thái thanh toán để xác định hoàn tiền
    coTheHoan = coTheHuy && ticket.trangThaiVe === 'da_thanh_toan' && refundPolicy.phanTramHoan > 0;

    res.json({
      ticket: {
        maVe: ticket.maVe,
        hoTenHanhKhach: ticket.hoTenHanhKhach,
        email: ticket.emailHanhKhach,
        phone: ticket.soDienThoaiHanhKhach,
        soGhe: ticket.soGhe,
        giaVe: totalGiaVeGoc,
        giaThanhToan: Number(ticket.giaThanhToan),
        trangThaiVe: ticket.trangThaiVe,
        phuongThucThanhToan: ticket.tenPhuongThuc,
        chuyenXe: {
          diemDi: ticket.diemDi,
          diemDen: ticket.diemDen,
          thoiGianDi: ticket.thoiGianDi,
          trangThaiChuyen: ticket.trangThaiChuyen
        }
      },
      eligibility: {
        coTheHuy,
        lyDoKhongHuy,
        coTheHoan,
        hoursUntilDeparture: parseFloat(hoursUntilDeparture.toFixed(2))
      },
      refundCalculation: {
        giaVeGoc: totalGiaVeGoc,
        phanTramHoan: refundPolicy.phanTramHoan,
        soTienHoan,
        moTa: refundPolicy.moTa,
        ghiChu: refundPolicy.ghiChu
      }
    });
  } catch (error) {
    console.error('Lỗi checkCancellationEligibility:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra điều kiện hủy vé' });
  }
};

// @desc    Xử lý yêu cầu hoàn/hủy vé (Phê duyệt hoặc Từ chối) - Xử lý TẤT CẢ vé trong booking
// @route   POST /api/staff/support/cancellations/:ticketId/process
// @access  Private/Support-Staff
const processCancellationRequest = async (req, res) => {
  const { ticketId } = req.params;
  const { hanh_dong, lyDoHuy, lyDoTuChoi } = req.body;
  // hanh_dong: 'approve' | 'reject'
  const agentId = req.user.id;

  if (!hanh_dong || !['approve', 'reject'].includes(hanh_dong)) {
    return res.status(400).json({ message: 'Hành động không hợp lệ (approve/reject)' });
  }

  if (hanh_dong === 'reject' && (!lyDoTuChoi || !lyDoTuChoi.trim())) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
  }

  try {
    const pool = await sql.connect();

    // Lấy thông tin yêu cầu hủy từ CancellationRequest
    const cancellationReqResult = await pool.request()
      .input('maVe', sql.Int, ticketId)
      .query(`
        SELECT maYeuCau, maVe, giaVeGoc, trangThai, trangThaiHoan
        FROM CancellationRequest
        WHERE maVe = @maVe
      `);

    if (cancellationReqResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hủy vé' });
    }

    const cancellationReq = cancellationReqResult.recordset[0];
    const storedGiaVeGoc = Number(cancellationReq.giaVeGoc || 0);

    // Lấy thông tin vé gốc + thông tin khách hàng
    const ticketResult = await pool.request()
      .input('maVe', sql.Int, ticketId)
      .query(`
        SELECT vdt.maVe, vdt.maChuyenXe, vdt.maKhachHang, vdt.ngayDatVe, vdt.maQR,
               vdt.trangThaiVe, vdt.giaVe, vdt.maGhe,
               vdt.hoTenHanhKhach, vdt.emailHanhKhach,
               cx.thoiGianDi, cx.trangThaiChuyen,
               td.diemDi, td.diemDen
        FROM VeDienTu vdt
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        WHERE vdt.maVe = @maVe
      `);

    if (ticketResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const ticket = ticketResult.recordset[0];

    // Lấy TẤT CẢ vé thuộc cùng booking
    // Chiến lược: Nếu có maQR, dùng maQR để nhóm (vì maQR là ID của booking)
    // Nếu không có maQR, dùng maChuyenXe + maKhachHang + DATE(ngayDatVe)
    let allTicketsQuery;
    let allTicketsRequest = pool.request()
      .input('maChuyenXe', sql.Int, ticket.maChuyenXe)
      .input('maKhachHang', sql.Int, ticket.maKhachHang)
      .input('ngayDatVe', sql.DateTime, ticket.ngayDatVe);

    if (ticket.maQR && ticket.maQR.trim()) {
      // Tách bookingId từ maQR (vd: BK123456-12 -> BK123456)
      const bookingId = ticket.maQR.split('-')[0];
      allTicketsRequest = allTicketsRequest.input('bookingId', sql.VarChar, bookingId);
      allTicketsQuery = `
        SELECT vdt.maVe, vdt.trangThaiVe, vdt.giaVe, vdt.giaThanhToan, vdt.maGhe, vdt.maKhachHang, vdt.maQR,
               cx.thoiGianDi, cx.trangThaiChuyen
        FROM VeDienTu vdt
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        WHERE vdt.maQR LIKE @bookingId + '%'
      `;
    } else {
      // Fallback: dùng composite key nếu maQR không có
      allTicketsQuery = `
        SELECT vdt.maVe, vdt.trangThaiVe, vdt.giaVe, vdt.giaThanhToan, vdt.maGhe, vdt.maKhachHang, vdt.maQR,
               cx.thoiGianDi, cx.trangThaiChuyen
        FROM VeDienTu vdt
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        WHERE vdt.maChuyenXe = @maChuyenXe
          AND vdt.maKhachHang = @maKhachHang
          AND CAST(vdt.ngayDatVe AS DATE) = CAST(@ngayDatVe AS DATE)
      `;
    }

    const allTicketsResult = await allTicketsRequest.query(allTicketsQuery);

    const allTickets = allTicketsResult.recordset;
    
    // DEBUG: Log for troubleshooting
    console.log(`[Cancellation] Processing booking:`, {
      ticketId,
      maQR: ticket.maQR,
      maChuyenXe: ticket.maChuyenXe,
      maKhachHang: ticket.maKhachHang,
      ngayDatVe: ticket.ngayDatVe,
      ticketsFound: allTickets.length,
      ticketDetails: allTickets.map(t => ({ maVe: t.maVe, giaThanhToan: t.giaThanhToan, maQR: t.maQR }))
    });

    // Kiểm tra lại điều kiện
    if (ticket.trangThaiVe === 'da_huy') {
      return res.status(400).json({ message: 'Vé đã bị hủy' });
    }

    const now = new Date();
    const hoursUntilDeparture = (new Date(ticket.thoiGianDi) - now) / (1000 * 60 * 60);

    const refundPolicy = calculateRefundPolicy(hoursUntilDeparture);
    
    // Luôn tính lại tổng giá vé gốc từ allTickets để sửa lỗi dữ liệu bị lưu sai trước đó
    const tongGiaVeGoc = allTickets.reduce((sum, t) => sum + Number(t.giaThanhToan || t.giaVe), 0);
    // Tính hoàn tiền dựa trên tổng giá
    const tongSoTienHoan = Math.floor(tongGiaVeGoc * refundPolicy.phanTramHoan / 100);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (hanh_dong === 'approve') {
        // Xử lý TẤT CẢ vé trong booking
        for (const tkt of allTickets) {
          // 1. Cập nhật trạng thái vé
          await transaction.request()
            .input('maVe', sql.Int, tkt.maVe)
            .query(`UPDATE VeDienTu SET trangThaiVe = 'da_huy', ngayCapNhat = GETDATE() WHERE maVe = @maVe`);

          // 2. Giải phóng ghế
          if (tkt.maGhe) {
            await transaction.request()
              .input('maGhe', sql.Int, tkt.maGhe)
              .query(`UPDATE GheNgoi SET trangThaiGhe = 'trong' WHERE maGhe = @maGhe`);
          }
        }

        // 3. Cập nhật 1 CancellationRequest cho vé đầu tiên (đại diện cho booking)
        await transaction.request()
          .input('maVe', sql.Int, ticketId)
          .input('agentId', sql.Int, agentId)
          .input('phanTramHoan', sql.Decimal(5, 2), refundPolicy.phanTramHoan)
          .input('soTienHoanTongCong', sql.Decimal(18, 2), tongSoTienHoan)
          .input('tongGiaVeGoc', sql.Decimal(18, 2), tongGiaVeGoc)
          .query(`
            UPDATE CancellationRequest SET
              trangThai = 'approved', trangThaiHoan = 'processing',
              maNhanVienXuLy = @agentId, thoiGianXuLy = GETDATE(),
              giaVeGoc = @tongGiaVeGoc,
              phanTramHoan = @phanTramHoan, soTienHoan = @soTienHoanTongCong,
              thoiGianCapNhat = GETDATE()
            WHERE maVe = @maVe
          `);

        await transaction.commit();

        // Gửi email thông báo phê duyệt
        try {
          await sendCancellationApprovedEmail(ticket.emailHanhKhach, ticket.hoTenHanhKhach, {
            maVe: ticketId,
            soVe: allTickets.length,
            diemDi: ticket.diemDi,
            diemDen: ticket.diemDen,
            soTienHoan: tongSoTienHoan,
            phanTramHoan: refundPolicy.phanTramHoan,
            thoiGianDi: ticket.thoiGianDi
          });
        } catch (emailError) {
          console.error('Lỗi gửi email phê duyệt:', emailError);
        }

        res.json({
          message: `Phê duyệt hủy ${allTickets.length} vé thành công`,
          result: {
            soVe: allTickets.length,
            danhSachMaVe: allTickets.map(t => t.maVe),
            trangThai: 'approved',
            soTienHoanTongCong: tongSoTienHoan,
            phanTramHoan: refundPolicy.phanTramHoan,
            moTa: refundPolicy.moTa
          }
        });

      } else {
        // Từ chối - chỉ cập nhật 1 CancellationRequest (cho vé đầu tiên)
        // Restore vé về trạng thái "da_thanh_toan"
        for (const tkt of allTickets) {
          await transaction.request()
            .input('maVe', sql.Int, tkt.maVe)
            .query(`UPDATE VeDienTu SET trangThaiVe = 'da_thanh_toan', ngayCapNhat = GETDATE() WHERE maVe = @maVe`);
        }

        await transaction.request()
          .input('maVe', sql.Int, ticketId)
          .input('agentId', sql.Int, agentId)
          .input('lyDoTuChoi', sql.NVarChar, lyDoTuChoi.trim())
          .query(`
            UPDATE CancellationRequest SET
              trangThai = 'rejected', trangThaiHoan = 'rejected',
              maNhanVienXuLy = @agentId, thoiGianXuLy = GETDATE(),
              lyDoTuChoi = @lyDoTuChoi, thoiGianCapNhat = GETDATE()
            WHERE maVe = @maVe
          `);

        await transaction.commit();

        // Gửi email thông báo từ chối
        try {
          await sendCancellationRejectedEmail(ticket.emailHanhKhach, ticket.hoTenHanhKhach, {
            maVe: ticketId,
            diemDi: ticket.diemDi,
            diemDen: ticket.diemDen,
            lyDoTuChoi: lyDoTuChoi.trim(),
            thoiGianDi: ticket.thoiGianDi
          });
        } catch (emailError) {
          console.error('Lỗi gửi email từ chối:', emailError);
        }

        res.json({
          message: `Đã từ chối yêu cầu hủy ${allTickets.length} vé`,
          result: { 
            soVe: allTickets.length,
            danhSachMaVe: allTickets.map(t => t.maVe),
            trangThai: 'rejected', 
            lyDoTuChoi: lyDoTuChoi.trim() 
          }
        });
      }
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi processCancellationRequest:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu hủy vé' });
  }
};

// @desc    Tạo yêu cầu hoàn/hủy vé (pending) từ nhân viên
// @route   POST /api/staff/support/cancellations
// @access  Private/Support-Staff
const createCancellationRequest = async (req, res) => {
  const { maVe, lyDoHuy } = req.body;
  const agentId = req.user.id;

  if (!maVe) {
    return res.status(400).json({ message: 'Vui lòng cung cấp mã vé' });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra vé tồn tại
    const ticketCheck = await pool.request()
      .input('maVe', sql.Int, maVe)
      .query(`SELECT maVe, maKhachHang, trangThaiVe FROM VeDienTu WHERE maVe = @maVe`);

    if (ticketCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const ticket = ticketCheck.recordset[0];

    // Kiểm tra đã có yêu cầu pending chưa
    const existing = await pool.request()
      .input('maVe', sql.Int, maVe)
      .query(`SELECT maYeuCau FROM CancellationRequest WHERE maVe = @maVe AND trangThai = 'pending'`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Vé này đã có yêu cầu hủy đang chờ xử lý' });
    }

    await pool.request()
      .input('maVe', sql.Int, maVe)
      .input('maKhachHang', sql.Int, ticket.maKhachHang || null)
      .input('agentId', sql.Int, agentId)
      .input('lyDoHuy', sql.NVarChar, lyDoHuy || 'Yêu cầu hủy từ khách hàng')
      .query(`
        INSERT INTO CancellationRequest (maVe, maKhachHang, maNhanVienXuLy, lyDoHuy, trangThai, trangThaiHoan)
        VALUES (@maVe, @maKhachHang, @agentId, @lyDoHuy, 'pending', 'pending')
      `);

    res.status(201).json({ message: 'Đã tạo yêu cầu hủy vé thành công' });
  } catch (error) {
    console.error('Lỗi createCancellationRequest:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu' });
  }
};

// @desc    Lấy lịch sử chat của khách hàng theo customer ID
// @route   GET /api/staff/support/customers/:customerId/chat-history
// @access  Private/Support-Staff
const getCustomerChatHistory = async (req, res) => {
  const { customerId } = req.params;

  try {
    const pool = await sql.connect();

    // Lấy tất cả chat session của khách hàng
    const sessionResult = await pool.request()
      .input('customerId', sql.Int, customerId)
      .query(`
        SELECT 
          cs.maChatSession, cs.maKhachHang, cs.tenKhachHang, cs.emailKhach,
          cs.trangThai, cs.chuDeChat, cs.thoiGianBatDau, cs.thoiGianCapNhat,
          cs.thoiGianKetThuc, cs.maNhanVienHT, nv.tenNhanVien AS tenAgentHienTai,
          (SELECT COUNT(*) FROM ChatMessage WHERE maChatSession = cs.maChatSession) AS soTinNhan
        FROM ChatSession cs
        LEFT JOIN NhanVien nv ON cs.maNhanVienHT = nv.maNhanVien
        WHERE cs.maKhachHang = @customerId
        ORDER BY cs.thoiGianBatDau DESC
      `);

    if (sessionResult.recordset.length === 0) {
      return res.json({
        success: true,
        message: 'Khách hàng chưa có phiên chat nào',
        data: {
          customerId,
          chatSessions: [],
          totalSessions: 0
        }
      });
    }

    // Lấy tin nhắn của từng session
    const chatSessions = sessionResult.recordset;
    const chatData = [];

    for (const session of chatSessions) {
      const messagesResult = await pool.request()
        .input('sessionId', sql.Int, session.maChatSession)
        .query(`
          SELECT 
            maTinNhan, maChatSession, nguoiGui, maNguoiGui, noiDung, 
            trangThaiDoc, thoiGianGui
          FROM ChatMessage
          WHERE maChatSession = @sessionId
          ORDER BY thoiGianGui ASC
        `);

      chatData.push({
        session: {
          maChatSession: session.maChatSession,
          chuDeChat: session.chuDeChat,
          trangThai: session.trangThai,
          thoiGianBatDau: session.thoiGianBatDau,
          thoiGianCapNhat: session.thoiGianCapNhat,
          thoiGianKetThuc: session.thoiGianKetThuc,
          tenAgentHienTai: session.tenAgentHienTai,
          soTinNhan: session.soTinNhan
        },
        messages: messagesResult.recordset
      });
    }

    res.json({
      success: true,
      message: 'Lấy lịch sử chat thành công',
      data: {
        customerId,
        totalSessions: chatSessions.length,
        chatData
      }
    });

  } catch (error) {
    console.error('Lỗi getCustomerChatHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử chat',
      error: error.message
    });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  getTicketsList,
  checkInTicket,
  createOfflineTicket,
  refundTicket,
  // Support Staff - Chat
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  closeChatSession,
  createChatSession,
  getCustomerTickets,
  getCustomerChatHistory,
  // Support Staff - Cancellation
  getCancellationRequests,
  checkCancellationEligibility,
  processCancellationRequest,
  createCancellationRequest
};
