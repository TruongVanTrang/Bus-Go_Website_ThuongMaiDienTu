const { sql } = require('../config/db');

// Helper function to format duration
const calculateDuration = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Helper function to format Date to YYYY-MM-DD
const formatDate = (dateObj) => {
  const d = new Date(dateObj);
  let month = '' + (d.getUTCMonth() + 1);
  let day = '' + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Helper function to format Time to HH:mm
const formatTime = (dateObj) => {
  const d = new Date(dateObj);
  let hours = '' + d.getUTCHours();
  let minutes = '' + d.getUTCMinutes();

  if (hours.length < 2) hours = '0' + hours;
  if (minutes.length < 2) minutes = '0' + minutes;

  return [hours, minutes].join(':');
};

const mapMethodName = (methodStr) => {
  if (!methodStr) return 'Momo';
  const norm = methodStr.toLowerCase();
  if (norm.includes('momo')) return 'Momo';
  if (norm.includes('zalopay')) return 'ZaloPay';
  if (norm.includes('vnpay')) return 'VNPay';
  if (norm.includes('visa')) return 'Visa';
  if (norm.includes('atm') || norm.includes('napas')) return 'ATM Nội địa';
  return 'Momo'; // fallback
};

// @desc    Đặt vé mới
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const { maChuyenXe, selectedSeats, passengerInfo, cargoInfo, paymentMethod } = req.body;
  const maKhachHang = req.user.id;

  if (!maChuyenXe || !selectedSeats || selectedSeats.length === 0 || !passengerInfo) {
    return res.status(400).json({ message: 'Thiếu thông tin đặt vé bắt buộc' });
  }

  try {
    const pool = await sql.connect();

    // 1. Lấy phương thức thanh toán
    const paymentName = mapMethodName(paymentMethod);
    const paymentResult = await pool.request()
      .input('paymentName', sql.NVarChar, paymentName)
      .query('SELECT maPhuongThuc FROM PhuongThucThanhToan WHERE tenPhuongThuc = @paymentName');
    
    const maPhuongThuc = paymentResult.recordset[0]?.maPhuongThuc || 2; // fallback to Momo

    // 2. Lấy giá cơ bản chuyến xe
    const tripResult = await pool.request()
      .input('maChuyenXe', sql.Int, maChuyenXe)
      .query('SELECT giaCoBan FROM ChuyenXe WHERE maChuyenXe = @maChuyenXe');
    
    if (tripResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
    }
    const giaCoBan = Number(tripResult.recordset[0].giaCoBan);

    // 3. Khởi chạy Transaction để đảm bảo tính toàn vẹn (tất cả ghế được đặt thành công hoặc hủy bỏ)
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const createdBookingId = 'BK' + Date.now();
      const firstTicketIdRef = { value: null };

      for (let i = 0; i < selectedSeats.length; i++) {
        const seatName = selectedSeats[i];

        // 3a. Kiểm tra/Chèn ghế ngồi
        let seatId;
        const checkSeatResult = await transaction.request()
          .input('maChuyenXe', sql.Int, maChuyenXe)
          .input('soGhe', sql.VarChar, seatName)
          .query('SELECT maGhe, trangThaiGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = @soGhe');

        if (checkSeatResult.recordset.length > 0) {
          const seat = checkSeatResult.recordset[0];
          if (seat.trangThaiGhe !== 'trong') {
            await transaction.rollback();
            return res.status(400).json({ message: `Ghế ${seatName} đã được đặt bởi người khác. Vui lòng chọn ghế khác.` });
          }
          seatId = seat.maGhe;
          // Update status to da_dat
          await transaction.request()
            .input('maGhe', sql.Int, seatId)
            .query("UPDATE GheNgoi SET trangThaiGhe = 'da_dat' WHERE maGhe = @maGhe");
        } else {
          // Insert new seat record
          const insertSeatResult = await transaction.request()
            .input('maChuyenXe', sql.Int, maChuyenXe)
            .input('soGhe', sql.VarChar, seatName)
            .query(`
              INSERT INTO GheNgoi (maChuyenXe, soGhe, loaiGhe, viTriGhe, giaSoGhe, trangThaiGhe)
              OUTPUT INSERTED.maGhe
              VALUES (@maChuyenXe, @soGhe, 'standard', 'middle', 0, 'da_dat')
            `);
          seatId = insertSeatResult.recordset[0].maGhe;
        }

        // 3b. Tạo bản ghi Vé Điện Tử
        const qrCode = `${createdBookingId}-${seatName}`;
        const giaHangHoa = (i === 0 && cargoInfo && cargoInfo.type !== 'none') ? Number(cargoInfo.estimatedPrice || 0) : 0;
        const totalTicketPrice = giaCoBan + giaHangHoa;

        const insertTicketResult = await transaction.request()
          .input('maKhachHang', sql.Int, maKhachHang)
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
          .query(`
            INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
            OUTPUT INSERTED.maVe
            VALUES (@maKhachHang, @maChuyenXe, @maGhe, @hoTenHanhKhach, @firstName, @lastName, @emailHanhKhach, @soDienThoaiHanhKhach, @diemDon, @diemTra, @maQR, @maPhuongThuc, @giaVe, @giaHangHoa, @giaThanhToan, 'da_thanh_toan')
          `);

        const ticketId = insertTicketResult.recordset[0].maVe;
        if (i === 0) {
          firstTicketIdRef.value = ticketId;
        }

        // 3c. Chèn thông tin Hàng Hóa đi kèm (nếu có và là ticket đầu tiên)
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
      }

      await transaction.commit();
      res.status(201).json({
        message: 'Đặt vé thành công',
        bookingId: createdBookingId
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi đặt vé:', error);
    res.status(500).json({ message: 'Lỗi server khi đặt vé' });
  }
};

// @desc    Lấy lịch sử đặt vé của khách hàng hiện tại
// @route   GET /api/bookings/my-tickets
// @access  Private
const getMyTickets = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('maKhachHang', sql.Int, req.user.id)
      .query(`
        SELECT 
          vdt.maVe,
          vdt.hoTenHanhKhach,
          vdt.firstName,
          vdt.lastName,
          vdt.emailHanhKhach,
          vdt.soDienThoaiHanhKhach,
          vdt.diemDon,
          vdt.diemTra,
          vdt.maQR,
          vdt.giaVe,
          vdt.giaHangHoa,
          vdt.giaThanhToan,
          vdt.trangThaiVe,
          vdt.ngayDatVe,
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
        WHERE vdt.maKhachHang = @maKhachHang
        ORDER BY vdt.ngayDatVe DESC
      `);

    const tickets = result.recordset;
    const bookingsMap = {};

    for (const t of tickets) {
      let bId = t.maQR ? t.maQR.split('-')[0] : `BK${t.maVe}`;
      if (!bId.startsWith('BK')) {
        bId = `BK${t.maVe}`;
      }

      if (!bookingsMap[bId]) {
        const cargoResult = await pool.request()
          .input('maVe', sql.Int, t.maVe)
          .query('SELECT * FROM HangHoa WHERE maVe = @maVe');
        const cargoRow = cargoResult.recordset[0];

        bookingsMap[bId] = {
          id: bId,
          from: t.diemDi,
          to: t.diemDen,
          date: formatDate(t.thoiGianDi),
          departureTime: formatTime(t.thoiGianDi),
          arrivalTime: formatTime(t.thoiGianDen),
          seats: [t.soGhe],
          price: Number(t.giaVe),
          status: t.trangThaiVe === 'da_thanh_toan' ? 'Da thanh toan' : (t.trangThaiVe === 'da_huy' ? 'Da huy' : 'Cho thanh toan'),
          operator: 'BusGo',
          bookingDate: formatDate(t.ngayDatVe),
          passengerName: t.hoTenHanhKhach,
          email: t.emailHanhKhach,
          phone: t.soDienThoaiHanhKhach,
          cargoInfo: {
            type: cargoRow ? cargoRow.loaiHangHoa : 'none',
            description: cargoRow ? cargoRow.moTa : 'Không có',
            weight: cargoRow ? cargoRow.trongLuong : null,
            price: cargoRow ? Number(cargoRow.giaHangHoa) : 0
          }
        };
      } else {
        bookingsMap[bId].seats.push(t.soGhe);
        bookingsMap[bId].price += Number(t.giaVe);
      }
    }

    res.json(Object.values(bookingsMap));
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử vé:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử vé' });
  }
};

// @desc    Lấy chi tiết vé
// @route   GET /api/bookings/:id
// @access  Private
const getTicketDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('bookingId', sql.VarChar, id)
      .query(`
        SELECT 
          vdt.maVe,
          vdt.hoTenHanhKhach,
          vdt.firstName,
          vdt.lastName,
          vdt.emailHanhKhach,
          vdt.soDienThoaiHanhKhach,
          vdt.diemDon,
          vdt.diemTra,
          vdt.maQR,
          vdt.giaVe,
          vdt.giaHangHoa,
          vdt.giaThanhToan,
          vdt.trangThaiVe,
          vdt.ngayDatVe,
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
        WHERE vdt.maQR LIKE @bookingId + '%' OR CAST(vdt.maVe AS VARCHAR) = @bookingId
      `);

    const tickets = result.recordset;
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé' });
    }

    const first = tickets[0];
    const ticketIds = tickets.map(t => t.maVe);

    const cargoResult = await pool.request()
      .query(`SELECT * FROM HangHoa WHERE maVe IN (${ticketIds.join(',')})`);
    const cargoRow = cargoResult.recordset[0];

    const ticketData = {
      bookingId: id,
      trip: {
        id: first.maChuyenXe,
        from: first.diemDi,
        to: first.diemDen,
        date: formatDate(first.thoiGianDi),
        departureTime: formatTime(first.thoiGianDi),
        arrivalTime: formatTime(first.thoiGianDen),
        duration: calculateDuration(first.thoiGianDi, first.thoiGianDen),
        operator: 'BusGo'
      },
      selectedSeats: tickets.map(t => t.soGhe),
      passengerInfo: {
        firstName: first.firstName || first.hoTenHanhKhach,
        lastName: first.lastName || '',
        email: first.emailHanhKhach,
        phone: first.soDienThoaiHanhKhach
      },
      cargoInfo: {
        type: cargoRow ? cargoRow.loaiHangHoa : 'none',
        description: cargoRow ? cargoRow.moTa : 'Không có',
        weight: cargoRow ? cargoRow.trongLuong : 0,
        receiverName: cargoRow ? cargoRow.tenNguoiNhan : '',
        receiverPhone: cargoRow ? cargoRow.soDienThoaiNguoiNhan : '',
        declaredValue: cargoRow ? Number(cargoRow.giaTrucDeclare) : 0,
        insuranceFee: cargoRow ? Number(cargoRow.giaBAO_HIEM) : 0,
        estimatedPrice: cargoRow ? Number(cargoRow.giaHangHoa) : 0
      },
      paymentStatus: first.trangThaiVe === 'da_thanh_toan' ? 'Da thanh toan' : (first.trangThaiVe === 'da_huy' ? 'Da huy' : 'Cho thanh toan'),
      paymentMethod: first.tenPhuongThuc || 'Momo',
      totalPrice: Number(first.giaVe)
    };

    res.json(ticketData);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết vé' });
  }
};

// @desc    Hủy đặt vé
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect();
    
    const ticketsResult = await pool.request()
      .input('bookingId', sql.VarChar, id)
      .query(`
        SELECT maVe, maGhe, maChuyenXe FROM VeDienTu 
        WHERE maQR LIKE @bookingId + '%' OR CAST(maVe AS VARCHAR) = @bookingId
      `);

    const tickets = ticketsResult.recordset;
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vé cần hủy' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const t of tickets) {
        // 1. Cập nhật trạng thái vé
        await transaction.request()
          .input('maVe', sql.Int, t.maVe)
          .query("UPDATE VeDienTu SET trangThaiVe = 'da_huy', ngayCapNhat = GETDATE() WHERE maVe = @maVe");

        // 2. Giải phóng ghế ngồi
        if (t.maGhe) {
          await transaction.request()
            .input('maGhe', sql.Int, t.maGhe)
            .query("UPDATE GheNgoi SET trangThaiGhe = 'trong' WHERE maGhe = @maGhe");
        }
      }

      await transaction.commit();
      res.json({ message: 'Hủy vé thành công' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi khi hủy vé:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy vé' });
  }
};

// @desc    Đánh giá chuyến đi
// @route   POST /api/bookings/:id/feedback
// @access  Private
const submitFeedback = async (req, res) => {
  const { id } = req.params;
  const { rating, comments } = req.body;
  try {
    const pool = await sql.connect();
    const ticketResult = await pool.request()
      .input('bookingId', sql.VarChar, id)
      .query(`
        SELECT TOP 1 maVe FROM VeDienTu 
        WHERE maQR LIKE @bookingId + '%' OR CAST(maVe AS VARCHAR) = @bookingId
      `);
    
    const ticket = ticketResult.recordset[0];
    if (!ticket) {
      return res.status(404).json({ message: 'Không tìm thấy vé để đánh giá' });
    }

    await pool.request()
      .input('maVe', sql.Int, ticket.maVe)
      .input('maKhachHang', sql.Int, req.user.id)
      .input('diemDanhGia', sql.Int, rating)
      .input('nhanXet', sql.NVarChar, comments)
      .query(`
        INSERT INTO Feedback (maVe, maKhachHang, diemDanhGia, diemPhucVu, diemGiaoThiep, nhanXet)
        VALUES (@maVe, @maKhachHang, @diemDanhGia, @diemDanhGia, @diemDanhGia, @nhanXet)
      `);

    res.json({ message: 'Gửi đánh giá thành công' });
  } catch (error) {
    console.error('Lỗi khi gửi đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi đánh giá' });
  }
};

module.exports = {
  createBooking,
  getMyTickets,
  getTicketDetail,
  cancelBooking,
  submitFeedback
};
