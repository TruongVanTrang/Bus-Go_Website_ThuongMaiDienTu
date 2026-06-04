const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

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

module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  getTicketsList,
  checkInTicket,
  createOfflineTicket,
  refundTicket
};
