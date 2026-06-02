-- ============================================================================
-- BusGo Database - Cập nhật phù hợp với giao diện FE hiện tại (v2.0)
-- Cập nhật: Thêm các trường mới dựa trên frontend, xóa và tạo lại bảng
-- ============================================================================

-- 1. Khởi tạo Database
USE master;
GO
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'BusGoDBs')
BEGIN
    ALTER DATABASE BusGoDBs SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BusGoDBs;
END
GO
WAITFOR DELAY '00:00:02';
GO
CREATE DATABASE BusGoDBs;
GO
USE BusGoDBs;
GO

-- ============================================================================
-- PHẦN 1: BẢNG CƠ BẢN
-- ============================================================================

-- 2. Bảng Phương thức thanh toán
CREATE TABLE PhuongThucThanhToan (
    maPhuongThuc INT IDENTITY(1,1) PRIMARY KEY,
    tenPhuongThuc NVARCHAR(50) NOT NULL UNIQUE,
    loaiPhuongThuc NVARCHAR(50),
    bieuTuong NVARCHAR(5),
    moTa NVARCHAR(255),
    daKichHoat BIT DEFAULT 1,
    phiBanToiThieu DECIMAL(18, 2) DEFAULT 0,
    tyLePhi DECIMAL(5, 2) DEFAULT 0
);

-- 3. Bảng Người dùng (Lớp cha) - CẬP NHẬT: Thêm daXacThucPhone, lastLoginDate
CREATE TABLE NguoiDung (
    maNguoiDung INT IDENTITY(1,1) PRIMARY KEY,
    tenNguoiDung NVARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    soDienThoai VARCHAR(15),
    matKhau VARCHAR(255) NOT NULL,
    trangThaiTaiKhoan NVARCHAR(20) DEFAULT 'active',
    daXacThucEmail BIT DEFAULT 0,
    lastLoginDate DATETIME NULL, 
    ngayTaoTaiKhoan DATETIME DEFAULT GETDATE(),
    ngayCapNhatCuoi DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_Email_Format CHECK (email LIKE '%@%.%')
);

-- 4. Bảng Admin
CREATE TABLE Admin (
    maAdmin INT PRIMARY KEY,
    phanQuyen NVARCHAR(50),
    CONSTRAINT FK_Admin_NguoiDung FOREIGN KEY (maAdmin) REFERENCES NguoiDung(maNguoiDung)
);

-- 5. Bảng Nhân viên
CREATE TABLE NhanVien (
    maNhanVien INT PRIMARY KEY,
    vaiTro NVARCHAR(100),
    lichLamViec NVARCHAR(MAX),
    CONSTRAINT FK_NhanVien_NguoiDung FOREIGN KEY (maNhanVien) REFERENCES NguoiDung(maNguoiDung)
);

-- 6. Bảng Khách hàng - CẬP NHẬT: Thêm lastBookingDate
CREATE TABLE KhachHang (
    maKhachHang INT PRIMARY KEY,
    diemTichLuy INT DEFAULT 0,
    congTichLuy INT DEFAULT 0,
    tongTienDaChiTra DECIMAL(18, 2) DEFAULT 0,
    capDoThanhVien NVARCHAR(50) DEFAULT 'bronze',
    lastBookingDate DATETIME NULL, -- THÊM MỚI: Lần đặt vé cuối cùng
    CONSTRAINT FK_KhachHang_NguoiDung FOREIGN KEY (maKhachHang) REFERENCES NguoiDung(maNguoiDung)
);

-- ============================================================================
-- PHẦN 2: BẢNG TUYẾN ĐƯỜNG VÀ PHƯƠNG TIỆN
-- ============================================================================

-- 7. Bảng Tuyến đường (Nội thành + Ngoại thành)
CREATE TABLE TuyenDuong (
    maTuyenDuong INT IDENTITY(1,1) PRIMARY KEY,
    diemDi NVARCHAR(100) NOT NULL,
    diemDen NVARCHAR(100) NOT NULL,
    loaiDichVu NVARCHAR(20) NOT NULL, -- 'city' (nội thành) hoặc 'interCity' (ngoại thành)
    khoangCach FLOAT,
    danhSachTramDung NVARCHAR(MAX),
    ngayTao DATETIME DEFAULT GETDATE()
);

-- 8. Bảng Phương tiện (16 chỗ hoặc 35 chỗ)
CREATE TABLE PhuongTien (
    maPhuongTien INT IDENTITY(1,1) PRIMARY KEY,
    bienSoXe VARCHAR(20) UNIQUE NOT NULL,
    nhanHieu NVARCHAR(50),
    mauSac NVARCHAR(30),
    namSanXuat INT,
    tongSoGhe INT NOT NULL, -- 16 hoặc 35
    loaiXe NVARCHAR(50), -- '16-seater' hoặc '35-seater'
    trangThaiXe NVARCHAR(50) DEFAULT 'san_sang', -- san_sang, bao_tri, ngoai_hoat_dong
    tienIch NVARCHAR(MAX), -- JSON: ['AC', 'Wifi', 'Phone Charger']
    ngayMuaVao DATE,
    ngayBaoTriLanSau DATE,
    maTaiXeChinh INT FOREIGN KEY REFERENCES NhanVien(maNhanVien)
);

-- ============================================================================
-- PHẦN 3: BẢNG CHUYẾN XE VÀ GHẾ NGỒI
-- ============================================================================

-- 9. Bảng Chuyến xe
CREATE TABLE ChuyenXe (
    maChuyenXe INT IDENTITY(1,1) PRIMARY KEY,
    maTuyenDuong INT NOT NULL FOREIGN KEY REFERENCES TuyenDuong(maTuyenDuong),
    maPhuongTien INT NOT NULL FOREIGN KEY REFERENCES PhuongTien(maPhuongTien),
    maNhanVien INT FOREIGN KEY REFERENCES NhanVien(maNhanVien),
    thoiGianDi DATETIME NOT NULL,
    thoiGianDen DATETIME NOT NULL,
    giaCoBan DECIMAL(18, 2) NOT NULL,
    soGheConTrong INT,
    soLuongGheDat INT DEFAULT 0, -- Số lượng ghế đã đặt
    trangThaiChuyen NVARCHAR(50) DEFAULT 'da_len_lich', -- da_len_lich, dang_khoi_hanh, da_hoan_thanh
    tienIchChiTiet NVARCHAR(MAX), -- JSON chi tiết tiện ích
    diemDanhGia DECIMAL(3, 2) DEFAULT 4.0,
    soLuotDanhGia INT DEFAULT 0,
    ngayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_ChuyenXe_Rating CHECK (diemDanhGia >= 1 AND diemDanhGia <= 5),
    CONSTRAINT CK_ChuyenXe_Times CHECK (thoiGianDi < thoiGianDen)
);

-- 10. Bảng Ghế ngồi (Sơ đồ động cho ngoại thành, số lượng cho nội thành)
CREATE TABLE GheNgoi (
    maGhe INT IDENTITY(1,1) PRIMARY KEY,
    maChuyenXe INT NOT NULL FOREIGN KEY REFERENCES ChuyenXe(maChuyenXe),
    soGhe VARCHAR(10) NOT NULL, -- Số ghế (A1, A2, B1, etc.) hoặc số thứ tự
    loaiGhe NVARCHAR(20) DEFAULT 'standard', -- standard, vip
    viTriGhe NVARCHAR(20), -- front, middle, back (chỉ dùng cho ngoại thành)
    giaSoGhe DECIMAL(18, 2) DEFAULT 0,
    trangThaiGhe NVARCHAR(50) DEFAULT 'trong', -- trong, da_dat, giu_tam_thoi
    CONSTRAINT UQ_GheNgoi UNIQUE (maChuyenXe, soGhe)
);

-- ============================================================================
-- PHẦN 4: BẢNG VÉ ĐIỆN TỬ VÀ HÀNG HÓA
-- ============================================================================

-- 11. Bảng Vé điện tử - CẬP NHẬT: Thêm firstName, lastName, maPhuongThuc
CREATE TABLE VeDienTu (
    maVe INT IDENTITY(1,1) PRIMARY KEY,
    maKhachHang INT FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    maChuyenXe INT NOT NULL FOREIGN KEY REFERENCES ChuyenXe(maChuyenXe),
    maGhe INT FOREIGN KEY REFERENCES GheNgoi(maGhe),
    hoTenHanhKhach NVARCHAR(100) NOT NULL,
    firstName NVARCHAR(50) NULL, -- THÊM MỚI: Tên riêng (cho UI booking form)
    lastName NVARCHAR(50) NULL, -- THÊM MỚI: Họ (cho UI booking form)
    emailHanhKhach VARCHAR(100),
    soDienThoaiHanhKhach VARCHAR(15),
    diemDon NVARCHAR(255), -- Điểm đón khách
    diemTra NVARCHAR(255), -- Điểm trả khách
    maQR VARCHAR(255) UNIQUE,
    maPhuongThuc INT FOREIGN KEY REFERENCES PhuongThucThanhToan(maPhuongThuc), -- THÊM MỚI: Link tới phương thức thanh toán
    ngayDatVe DATETIME DEFAULT GETDATE(),
    giaVe DECIMAL(18, 2) NOT NULL,
    giaHangHoa DECIMAL(18, 2) DEFAULT 0,
    giaThanhToan DECIMAL(18, 2) NOT NULL, -- giaVe + giaHangHoa
    trangThaiVe NVARCHAR(50) DEFAULT 'cho_thanh_toan', -- cho_thanh_toan, da_thanh_toan, da_su_dung, da_huy
    ghiChu NVARCHAR(MAX),
    ngayCapNhat DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_VeDienTu_Price CHECK (giaThanhToan >= 0)
);

-- 12. Bảng Hàng hóa - CẬP NHẬT: Thêm thông tin người gửi/nhận, giá trị, bảo hiểm, trạng thái
CREATE TABLE HangHoa (
    maHangHoa INT IDENTITY(1,1) PRIMARY KEY,
    maVe INT NOT NULL FOREIGN KEY REFERENCES VeDienTu(maVe),
    loaiHangHoa NVARCHAR(50) NOT NULL, -- none, light, heavy, scooter, maxi_scooter, motorcycle
    moTa NVARCHAR(255),
    trongLuong FLOAT, -- Cân nặng (kg) - cho hàng nặng
    giaHangHoa DECIMAL(18, 2) NOT NULL,
    -- THÊM MỚI: Thông tin người gửi
    tenNguoiGui NVARCHAR(100) NULL,
    soDienThoaiNguoiGui VARCHAR(15) NULL,
    -- THÊM MỚI: Thông tin người nhận
    tenNguoiNhan NVARCHAR(100) NULL,
    soDienThoaiNguoiNhan VARCHAR(15) NULL,
    -- THÊM MỚI: Giá trị và bảo hiểm
    giaTrucDeclare DECIMAL(18, 2) NULL, -- Giá trị khai báo (bảo hiểm)
    giaBAO_HIEM DECIMAL(18, 2) NULL, -- Phí bảo hiểm (2% của giá trị)
    trangThaiVanChuyen NVARCHAR(50) NULL, -- pending, confirmed, in_transit, delivered
    ngayTao DATETIME DEFAULT GETDATE(),
    ghiChu NVARCHAR(MAX)
);

-- ============================================================================
-- PHẦN 5: BẢNG THANH TOÁN VÀ HÓA ĐƠN
-- ============================================================================

-- 13. Bảng Hóa đơn
CREATE TABLE HoaDon (
    maHoaDon INT IDENTITY(1,1) PRIMARY KEY,
    maVe INT NOT NULL FOREIGN KEY REFERENCES VeDienTu(maVe),
    soHoaDonTam VARCHAR(50) UNIQUE,
    soTien DECIMAL(18, 2) NOT NULL,
    maPhuongThuc INT FOREIGN KEY REFERENCES PhuongThucThanhToan(maPhuongThuc),
    trangThaiThanhToan NVARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    maChuyenDich VARCHAR(100),
    ngayThanhToan DATETIME,
    ngayTao DATETIME DEFAULT GETDATE()
);

-- ============================================================================
-- PHẦN 6: BẢNG FEEDBACK VÀ THÔNG BÁO
-- ============================================================================

-- 14. Bảng Feedback - CẬP NHẬT: Thêm diemPhucVu, diemGiaoThiep
CREATE TABLE Feedback (
    maFeedback INT IDENTITY(1,1) PRIMARY KEY,
    maVe INT NOT NULL FOREIGN KEY REFERENCES VeDienTu(maVe),
    maKhachHang INT NOT NULL FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    diemDanhGia INT NOT NULL, -- 1-5 sao (tổng thể)
    diemPhucVu INT NULL, -- THÊM MỚI: Đánh giá dịch vụ (1-5)
    diemGiaoThiep INT NULL, -- THÊM MỚI: Đánh giá giao diện (1-5)
    nhanXet NVARCHAR(MAX),
    ngayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_Feedback_Rating CHECK (diemDanhGia >= 1 AND diemDanhGia <= 5),
    CONSTRAINT CK_Feedback_Service CHECK (diemPhucVu IS NULL OR (diemPhucVu >= 1 AND diemPhucVu <= 5)),
    CONSTRAINT CK_Feedback_UI CHECK (diemGiaoThiep IS NULL OR (diemGiaoThiep >= 1 AND diemGiaoThiep <= 5))
);

-- 15. Bảng Yêu thích (Tuyến yêu thích)
CREATE TABLE YeuThich (
    maYeuThich INT IDENTITY(1,1) PRIMARY KEY,
    maKhachHang INT NOT NULL FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    maTuyenDuong INT NOT NULL FOREIGN KEY REFERENCES TuyenDuong(maTuyenDuong),
    ngayTao DATETIME DEFAULT GETDATE(),
    UNIQUE (maKhachHang, maTuyenDuong)
);

-- 16. Bảng Thông báo
CREATE TABLE ThongBao (
    maThongBao INT IDENTITY(1,1) PRIMARY KEY,
    maKhachHang INT NOT NULL FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    tieuDe NVARCHAR(255) NOT NULL,
    noiDung NVARCHAR(MAX),
    daDoc BIT DEFAULT 0,
    thoiGianTao DATETIME DEFAULT GETDATE()
);

-- ============================================================================
-- PHẦN 6.5: BẢNG MỚI
-- ============================================================================

-- 17. Bảng Ký gửi hàng - THÊM MỚI (dùng cho CargoConsignmentPage)
CREATE TABLE KyGuiHang (
    maKyGui INT IDENTITY(1,1) PRIMARY KEY,
    maKhachHang INT NOT NULL FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    maHangHoa INT FOREIGN KEY REFERENCES HangHoa(maHangHoa),
    consignmentId VARCHAR(50) UNIQUE, -- CSM + timestamp
    tenNguoiGui NVARCHAR(100) NOT NULL,
    soDienThoaiNguoiGui VARCHAR(15) NOT NULL,
    tenNguoiNhan NVARCHAR(100) NOT NULL,
    soDienThoaiNguoiNhan VARCHAR(15) NOT NULL,
    trangThaiKyGui NVARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_transit, delivered, failed
    giaTrucDeclare DECIMAL(18, 2), -- Giá trị khai báo
    giaBAO_HIEM DECIMAL(18, 2), -- Phí bảo hiểm
    chieKySo NVARCHAR(MAX), -- Digital signature (base64)
    trangThaiKySo BIT DEFAULT 0, -- eSignatureAccepted
    viTriHienTai NVARCHAR(255), -- Vị trí hiện tại (tracking)
    ngayTao DATETIME DEFAULT GETDATE(),
    ngayCapNhat DATETIME DEFAULT GETDATE()
);

-- 18. Bảng Đánh giá chi tiết - THÊM MỚI (dùng khi cần phân tích chi tiết rating)
CREATE TABLE DanhGiaChiTiet (
    maDanhGiaChiTiet INT IDENTITY(1,1) PRIMARY KEY,
    maFeedback INT NOT NULL FOREIGN KEY REFERENCES Feedback(maFeedback),
    diemTongThe INT NOT NULL, -- 1-5
    diemPhucVu INT, -- 1-5 (service quality)
    diemGiaoThiep INT, -- 1-5 (UI/UX)
    diemChonCho INT, -- 1-5 (seat comfort)
    diemVeSinh INT, -- 1-5 (cleanliness)
    ngayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_DanhGiaChiTiet_Overall CHECK (diemTongThe >= 1 AND diemTongThe <= 5)
);

-- 19. Bảng Thông báo theo dõi hàng - THÊM MỚI
CREATE TABLE ThongBaoTheoDoiHang (
    maThongBao INT IDENTITY(1,1) PRIMARY KEY,
    maKhachHang INT NOT NULL FOREIGN KEY REFERENCES KhachHang(maKhachHang),
    maKyGui INT FOREIGN KEY REFERENCES KyGuiHang(maKyGui),
    loaiThongBao NVARCHAR(50), -- accepted, in_transit, delivered, failed
    viTriHienTai NVARCHAR(255),
    noiDung NVARCHAR(MAX),
    daDoc BIT DEFAULT 0,
    thoiGianTao DATETIME DEFAULT GETDATE()
);

-- 19.5. Bảng Nhật ký hành trình - THÊM MỚI (dùng cho hành trình di chuyển của tài xế)
CREATE TABLE NhatKyHanhTrinh (
    maNhatKy INT IDENTITY(1,1) PRIMARY KEY,
    maChuyenXe INT NOT NULL FOREIGN KEY REFERENCES ChuyenXe(maChuyenXe),
    kieuCapNhat NVARCHAR(50) NOT NULL, -- START, END, INCIDENT, CHECKPOINT
    thoiGian DATETIME DEFAULT GETDATE(),
    viTri NVARCHAR(255) NOT NULL,
    soKm INT NOT NULL,
    tinhTrangXe NVARCHAR(255),
    anhMinhChung NVARCHAR(MAX),   -- Ảnh đồng hồ km / minh chứng chính
    anhXeSauChuyen NVARCHAR(MAX), -- Ảnh xe sau chuyến (chỉ dùng khi END)
    ghiChu NVARCHAR(MAX)
);

-- ============================================================================
-- PHẦN 7: INDEX VÀ TRIGGER
-- ============================================================================

-- 20. Tạo Index để tối ưu tìm kiếm
CREATE NONCLUSTERED INDEX IDX_ChuyenXe_Search ON ChuyenXe(maTuyenDuong, thoiGianDi);
CREATE NONCLUSTERED INDEX IDX_ChuyenXe_Status ON ChuyenXe(trangThaiChuyen);
CREATE NONCLUSTERED INDEX IDX_VeDienTu_QR ON VeDienTu(maQR);
CREATE NONCLUSTERED INDEX IDX_VeDienTu_Status ON VeDienTu(trangThaiVe);
CREATE NONCLUSTERED INDEX IDX_VeDienTu_KhachHang ON VeDienTu(maKhachHang);
CREATE NONCLUSTERED INDEX IDX_GheNgoi_Status ON GheNgoi(maChuyenXe, trangThaiGhe);
CREATE NONCLUSTERED INDEX IDX_TuyenDuong_LoaiDichVu ON TuyenDuong(loaiDichVu);
CREATE NONCLUSTERED INDEX IDX_HangHoa_VeDienTu ON HangHoa(maVe);
CREATE NONCLUSTERED INDEX IDX_Feedback_VeDienTu ON Feedback(maVe);
CREATE NONCLUSTERED INDEX IDX_KyGuiHang_KhachHang ON KyGuiHang(maKhachHang);
CREATE NONCLUSTERED INDEX IDX_KyGuiHang_Status ON KyGuiHang(trangThaiKyGui);
GO

-- 21. Trigger: Tự động cập nhật số ghế trống
CREATE TRIGGER TRG_UpdateSoGheConTrong
ON GheNgoi
AFTER UPDATE, INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ChuyenXe
    SET soGheConTrong = (
        SELECT COUNT(*) 
        FROM GheNgoi 
        WHERE maChuyenXe = ChuyenXe.maChuyenXe 
        AND trangThaiGhe = 'trong'
    )
    WHERE maChuyenXe IN (
        SELECT DISTINCT maChuyenXe FROM inserted 
        UNION 
        SELECT DISTINCT maChuyenXe FROM deleted
    );
END;
GO

-- 22. Trigger: Tự động cập nhật giá thanh toán khi có hàng hóa
CREATE TRIGGER TRG_UpdateGiaThanhToan
ON HangHoa
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE VeDienTu
    SET giaThanhToan = giaVe + ISNULL((
        SELECT SUM(giaHangHoa) 
        FROM HangHoa 
        WHERE maVe = VeDienTu.maVe
    ), 0)
    WHERE maVe IN (SELECT DISTINCT maVe FROM inserted);
END;
GO

-- 23. Trigger: Tự động cập nhật lastBookingDate khi khách hàng đặt vé
CREATE TRIGGER TRG_UpdateLastBookingDate
ON VeDienTu
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE KhachHang
    SET lastBookingDate = GETDATE()
    WHERE maKhachHang IN (SELECT DISTINCT maKhachHang FROM inserted WHERE maKhachHang IS NOT NULL);
END;
GO

-- ============================================================================
-- PHẦN 8: DỮ LIỆU MẪU
-- ============================================================================

-- 24. Thêm phương thức thanh toán
INSERT INTO PhuongThucThanhToan (tenPhuongThuc, loaiPhuongThuc, bieuTuong, moTa)
VALUES 
    (N'Visa', N'the-quoc-te', '💳', N'Thẻ Visa quốc tế'),
    (N'Momo', N'vi-dien-tu', '📱', N'Ví điện tử Momo'),
    (N'ATM Nội địa', N'the-noi-dia', '🏦', N'Thẻ ATM nội địa'),
    (N'ZaloPay', N'vi-dien-tu', '🛍️', N'Ví ZaloPay'),
    (N'VNPay', N'cong-thanh-toan', '🏦', N'Cổng thanh toán VNPay');
GO

-- 25. Thêm người dùng mẫu và các tài khoản vai trò
INSERT INTO NguoiDung (tenNguoiDung, email, soDienThoai, matKhau, daXacThucEmail)
VALUES 
    (N'Admin Hệ Thống', 'admin@busgo.vn', '0905123456', '$2b$10$kVDCzxke2YOep.aywavS1.Y5TTdYttAdQuot.pH21jG9hwZjF/eji', 1), -- pwd: admin123
    (N'Khách hàng mẫu', 'customer@busgo.vn', '0912345670', '$2b$10$duKmIUD9PYTkniBNZw23i.NkbZu5ah5Lgm7JSSFiAaXd6yOOOCBzm', 1), -- pwd: customer123
    (N'Trương Trạng', 'vantrang04042005@gmail.com', '0372575316', '$2b$10$OhPLwF/l2qHGmlrzbIdImOaghj15H/bD0gT45AzhFoh1HPDzRZw0O', 1),
    (N'Admin BusGo', 'admin@busgo.com', '0987654321', '$2b$10$CYQA0YG1D0eNOs0PbCwF0ufWNHcn4tqx2BnzlCBBJ90pU7gsLMo3a', 1), -- pwd: admin123
    (N'Tài xế Nguyễn Văn A', 'driver@busgo.com', '0912345678', '$2b$10$zbDMul9Z/FsZAUY/wKQb7u/lKSZCbkZh8arB46d.ZvyeznWNsppdK', 1), -- pwd: staff123
    (N'Nhân viên soát vé Trần Thị B', 'ticket@busgo.com', '0911111111', '$2b$10$MU2cEqbeEUVLZ3SI4yUS4OmfF8GJZJI5tgUKdGRjwP6.kaUqnNojS', 1), -- pwd: staff123
    (N'Nhân viên hỗ trợ Lê Văn C', 'support@busgo.com', '0922222222', '$2b$10$C8XiBgVsyFWKgYjHsqb9vu5F/lV3cxrP3mnb0WrZMNRU5oqJJukvm', 1), -- pwd: staff123
    (N'Khách hàng', 'user@gmail.com', '0998765432', '$2b$10$Z7WYlaUauSEg7vlq7KYa5eT2gGWHIlyxMwDknxdbQR5FBhUFhHUky', 1); -- pwd: user123
GO

-- 26. Thêm Admin
INSERT INTO Admin (maAdmin, phanQuyen) 
VALUES 
    (1, N'Full Access'),
    (4, N'Full Access');
GO

-- 27. Thêm Nhân viên
INSERT INTO NhanVien (maNhanVien, vaiTro, lichLamViec)
VALUES
    (5, N'DRIVER', N'Hành chính'),
    (6, N'TICKET_STAFF', N'Hành chính'),
    (7, N'SUPPORT_STAFF', N'Hành chính');
GO

-- 27.5 Thêm Khách hàng
INSERT INTO KhachHang (maKhachHang, diemTichLuy, capDoThanhVien)
VALUES 
    (2, 0, 'bronze'),
    (3, 0, 'bronze'),
    (8, 0, 'bronze');
GO

-- 28. Thêm Tuyến đường (Nội thành)
INSERT INTO TuyenDuong (diemDi, diemDen, loaiDichVu, khoangCach)
VALUES 
    (N'Bến xe trung tâm', N'Sân bay Quốc tế Đà Nẵng', 'city', 5),
    (N'Bến xe trung tâm', N'Bãi biển Mỹ Khê', 'city', 3),
    (N'Cầu Rồng', N'Phố cổ Hội An', 'city', 30),
    (N'Sân bay Quốc tế Đà Nẵng', N'Bãi biển Non Nước', 'city', 25),
    (N'Đại học Duy Tân', N'Trung tâm thành phố', 'city', 8),
    (N'Khu công nghiệp Hòa Cầm', N'Bến xe trung tâm', 'city', 12);
GO

-- 29. Thêm Tuyến đường (Ngoại thành - Chỉ miền Trung & Bắc Trung Bộ)
INSERT INTO TuyenDuong (diemDi, diemDen, loaiDichVu, khoangCach)
VALUES 
    (N'Đà Nẵng', N'Huế',       'interCity', 108),
    (N'Đà Nẵng', N'Quảng Nam', 'interCity',  40),
    (N'Đà Nẵng', N'Quảng Ngãi','interCity', 130),
    (N'Đà Nẵng', N'Quảng Trị', 'interCity', 190),
    (N'Đà Nẵng', N'Quảng Bình','interCity', 320),
    (N'Đà Nẵng', N'Hà Tĩnh',   'interCity', 430),
    (N'Đà Nẵng', N'Nghệ An',   'interCity', 540),
    (N'Đà Nẵng', N'Thanh Hóa', 'interCity', 680);
GO

-- 30. Thêm Phương tiện (16 chỗ - Nội thành)
INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch)
VALUES 
    (N'29A-12345', N'Hyundai',      N'Trắng', 2022, 16, 'mini_16', 'san_sang', N'["AC", "Wifi"]'),
    (N'29A-12346', N'Samco',        N'Xanh',  2022, 20, 'city_small', 'san_sang', N'["AC", "Wifi"]'),
    (N'29A-12347', N'Ford Transit', N'Trắng', 2023, 9, 'mini_9', 'san_sang', N'["AC", "Wifi", "Phone Charger"]'),
    (N'43A-22221', N'Hyundai',      N'Trắng', 2021, 16, 'mini_16', 'san_sang', N'["AC", "Wifi", "Phone Charger"]'),
    (N'43A-22222', N'Toyota Inno',  N'Vàng',  2022, 7, 'mini_7', 'san_sang', N'["AC"]');
GO

-- 31. Thêm Phương tiện (35 chỗ - Ngoại thành)
INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch)
VALUES 
    (N'29A-54321', N'Toyota',          N'Trắng', 2021, 35, 'coach_29_35', 'san_sang', N'["AC", "Wifi", "Phone Charger", "Toilet"]'),
    (N'29A-54322', N'Thaco Mobihome',  N'Bạc',   2021, 45, 'coach_suburb', 'san_sang', N'["AC", "Wifi", "Phone Charger"]'),
    (N'29A-54323', N'Hyundai',         N'Trắng', 2022, 35, 'coach_29_35', 'san_sang', N'["AC", "Wifi", "Pillow & Blanket"]'),
    (N'43A-11111', N'Ford Transit',    N'Trắng', 2022, 16, 'coach_16', 'san_sang', N'["AC", "Wifi", "Phone Charger", "Pillow & Blanket"]'),
    (N'43A-11112', N'Thaco TB120S',    N'Bạc',   2023, 35, 'coach_29_35', 'san_sang', N'["AC", "Wifi"]');
GO

-- ============================================================================
-- PHẦN 9: VIEW HỖ TRỢ
-- ============================================================================

-- 32. View: Danh sách chuyến xe với thông tin đầy đủ
CREATE VIEW vw_ChuyenXeChiTiet AS
SELECT 
    cx.maChuyenXe,
    td.diemDi,
    td.diemDen,
    td.loaiDichVu,
    cx.thoiGianDi,
    cx.thoiGianDen,
    cx.giaCoBan,
    cx.soGheConTrong,
    cx.soLuongGheDat,
    pt.tongSoGhe,
    pt.loaiXe,
    cx.diemDanhGia,
    cx.soLuotDanhGia,
    cx.trangThaiChuyen
FROM ChuyenXe cx
INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien;
GO

-- 33. View: Danh sách vé với thông tin chi tiết
CREATE VIEW vw_VeDienTuChiTiet AS
SELECT 
    vdt.maVe,
    vdt.hoTenHanhKhach,
    vdt.firstName,
    vdt.lastName,
    vdt.emailHanhKhach,
    vdt.soDienThoaiHanhKhach,
    vdt.diemDon,
    vdt.diemTra,
    td.diemDi,
    td.diemDen,
    cx.thoiGianDi,
    cx.thoiGianDen,
    vdt.giaVe,
    vdt.giaHangHoa,
    vdt.giaThanhToan,
    vdt.trangThaiVe,
    ptt.tenPhuongThuc,
    vdt.ngayDatVe
FROM VeDienTu vdt
INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc;
GO

-- 34. View: Danh sách hàng hóa với thông tin người gửi/nhận
CREATE VIEW vw_HangHoaChiTiet AS
SELECT 
    hh.maHangHoa,
    hh.maVe,
    hh.loaiHangHoa,
    hh.moTa,
    hh.trongLuong,
    hh.giaHangHoa,
    hh.tenNguoiGui,
    hh.soDienThoaiNguoiGui,
    hh.tenNguoiNhan,
    hh.soDienThoaiNguoiNhan,
    hh.giaTrucDeclare,
    hh.giaBAO_HIEM,
    hh.trangThaiVanChuyen,
    vdt.maChuyenXe,
    cx.thoiGianDi,
    cx.thoiGianDen
FROM HangHoa hh
INNER JOIN VeDienTu vdt ON hh.maVe = vdt.maVe
INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe;
GO

-- ============================================================================
-- PHẦN 10: STORED PROCEDURES
-- ============================================================================

-- 35. Procedure: Tìm chuyến xe theo tuyến đường và ngày
CREATE PROCEDURE sp_TimChuyenXe
    @diemDi NVARCHAR(100),
    @diemDen NVARCHAR(100),
    @ngayDi DATE
AS
BEGIN
    SELECT 
        cx.maChuyenXe,
        cx.thoiGianDi,
        cx.thoiGianDen,
        cx.giaCoBan,
        cx.soGheConTrong,
        cx.soLuongGheDat,
        pt.tongSoGhe,
        pt.loaiXe,
        cx.diemDanhGia,
        cx.tienIchChiTiet
    FROM ChuyenXe cx
    INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
    INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
    WHERE td.diemDi = @diemDi 
    AND td.diemDen = @diemDen
    AND CAST(cx.thoiGianDi AS DATE) = @ngayDi
    AND cx.trangThaiChuyen = 'da_len_lich'
    ORDER BY cx.thoiGianDi;
END;
GO

-- 36. Procedure: Lấy thông tin vé chi tiết
CREATE PROCEDURE sp_LayThongTinVe
    @maVe INT
AS
BEGIN
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
        td.diemDi,
        td.diemDen,
        cx.thoiGianDi,
        cx.thoiGianDen,
        gh.soGhe,
        vdt.giaVe,
        vdt.giaHangHoa,
        vdt.giaThanhToan,
        vdt.trangThaiVe,
        ptt.tenPhuongThuc,
        vdt.ngayDatVe
    FROM VeDienTu vdt
    INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
    INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
    LEFT JOIN GheNgoi gh ON vdt.maGhe = gh.maGhe
    LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc
    WHERE vdt.maVe = @maVe;
END;
GO

-- 37. Procedure: Lấy lịch sử đặt vé của khách hàng
CREATE PROCEDURE sp_LayLichSuVeKhachHang
    @maKhachHang INT
AS
BEGIN
    SELECT 
        vdt.maVe,
        vdt.hoTenHanhKhach,
        vdt.diemDon,
        vdt.diemTra,
        td.diemDi,
        td.diemDen,
        cx.thoiGianDi,
        cx.thoiGianDen,
        vdt.giaVe,
        vdt.giaHangHoa,
        vdt.giaThanhToan,
        vdt.trangThaiVe,
        vdt.ngayDatVe
    FROM VeDienTu vdt
    INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
    INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
    WHERE vdt.maKhachHang = @maKhachHang
    ORDER BY vdt.ngayDatVe DESC;
END;
GO

-- 38. Procedure: Tìm ký gửi hàng theo khách hàng
CREATE PROCEDURE sp_TimKyGuiHang
    @maKhachHang INT
AS
BEGIN
    SELECT 
        kg.maKyGui,
        kg.consignmentId,
        kg.tenNguoiGui,
        kg.tenNguoiNhan,
        kg.trangThaiKyGui,
        kg.giaTrucDeclare,
        kg.giaBAO_HIEM,
        kg.viTriHienTai,
        kg.ngayTao,
        kg.ngayCapNhat
    FROM KyGuiHang kg
    WHERE kg.maKhachHang = @maKhachHang
    ORDER BY kg.ngayCapNhat DESC;
END;
GO

-- ============================================================================
-- PHẦN 11: SEED DỮ LIỆU CHUYẾN XE (7 ngày tiếp theo kể từ ngày chạy script)
-- ============================================================================

DECLARE @i INT = 0;
DECLARE @Ngay DATE;

WHILE @i < 7
BEGIN
    SET @Ngay = DATEADD(DAY, @i, CAST(GETDATE() AS DATE));

    DECLARE @maXe35_1 INT, @maXe35_2 INT, @maXe35_3 INT, @maXe35_4 INT, @maXe35_5 INT;
    SELECT @maXe35_1 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-54321';
    SELECT @maXe35_2 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-54322';
    SELECT @maXe35_3 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-54323';
    SELECT @maXe35_4 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'43A-11111';
    SELECT @maXe35_5 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'43A-11112';

    DECLARE @maXe16_1 INT, @maXe16_2 INT, @maXe16_3 INT, @maXe16_4 INT, @maXe16_5 INT;
    SELECT @maXe16_1 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-12345';
    SELECT @maXe16_2 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-12346';
    SELECT @maXe16_3 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'29A-12347';
    SELECT @maXe16_4 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'43A-22221';
    SELECT @maXe16_5 = maPhuongTien FROM PhuongTien WHERE bienSoXe = N'43A-22222';

    -- ── Đà Nẵng → Huế ──────────────────────────────────────────────────────
    DECLARE @maTuyen_Hue INT;
    SELECT @maTuyen_Hue = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Huế';
    IF @maTuyen_Hue IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_Hue AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='06:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_Hue,@maXe35_1,DATEADD(HOUR,6,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,8,CAST(@Ngay AS DATETIME)),120000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger"]',4.8,45);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_Hue AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='09:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_Hue,@maXe35_2,DATEADD(MINUTE,9*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,11*60+30,CAST(@Ngay AS DATETIME)),120000,35,0,'da_len_lich',N'["AC","Wifi"]',4.5,28);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_Hue AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='13:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_Hue,@maXe35_3,DATEADD(HOUR,13,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,15,CAST(@Ngay AS DATETIME)),120000,35,0,'da_len_lich',N'["AC","Wifi","Pillow & Blanket"]',4.9,62);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_Hue AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='16:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_Hue,@maXe35_4,DATEADD(MINUTE,16*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,18*60+30,CAST(@Ngay AS DATETIME)),130000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger","Pillow & Blanket"]',4.7,33);
    END

    -- ── Đà Nẵng → Quảng Nam ────────────────────────────────────────────────
    DECLARE @maTuyen_QNam INT;
    SELECT @maTuyen_QNam = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Nam';
    IF @maTuyen_QNam IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QNam AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='07:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QNam,@maXe35_2,DATEADD(HOUR,7,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,8,CAST(@Ngay AS DATETIME)),80000,35,0,'da_len_lich',N'["AC","Wifi"]',4.3,19);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QNam AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='11:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QNam,@maXe35_3,DATEADD(HOUR,11,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,12,CAST(@Ngay AS DATETIME)),80000,35,0,'da_len_lich',N'["AC"]',4.1,8);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QNam AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='15:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QNam,@maXe35_5,DATEADD(HOUR,15,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,16,CAST(@Ngay AS DATETIME)),80000,35,0,'da_len_lich',N'["AC","Wifi"]',4.4,14);
    END

    -- ── Đà Nẵng → Quảng Ngãi ───────────────────────────────────────────────
    DECLARE @maTuyen_QNgai INT;
    SELECT @maTuyen_QNgai = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Ngãi';
    IF @maTuyen_QNgai IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QNgai AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='07:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QNgai,@maXe35_3,DATEADD(MINUTE,7*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,9*60+30,CAST(@Ngay AS DATETIME)),150000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger"]',4.6,37);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QNgai AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='12:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QNgai,@maXe35_4,DATEADD(MINUTE,12*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,14*60+30,CAST(@Ngay AS DATETIME)),150000,35,0,'da_len_lich',N'["AC","Wifi"]',4.2,22);
    END

    -- ── Đà Nẵng → Quảng Trị ────────────────────────────────────────────────
    DECLARE @maTuyen_QTri INT;
    SELECT @maTuyen_QTri = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Trị';
    IF @maTuyen_QTri IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QTri AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='06:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QTri,@maXe35_4,DATEADD(MINUTE,6*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,9*60+30,CAST(@Ngay AS DATETIME)),180000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger","Pillow & Blanket"]',4.7,41);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QTri AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='14:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QTri,@maXe35_5,DATEADD(HOUR,14,CAST(@Ngay AS DATETIME)),DATEADD(HOUR,17,CAST(@Ngay AS DATETIME)),180000,35,0,'da_len_lich',N'["AC","Wifi"]',4.4,18);
    END

    -- ── Đà Nẵng → Quảng Bình ───────────────────────────────────────────────
    DECLARE @maTuyen_QBinh INT;
    SELECT @maTuyen_QBinh = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Bình';
    IF @maTuyen_QBinh IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QBinh AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='05:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QBinh,@maXe35_1,DATEADD(MINUTE,5*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,11*60+30,CAST(@Ngay AS DATETIME)),280000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger","Pillow & Blanket"]',4.6,29);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_QBinh AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='20:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_QBinh,@maXe35_3,DATEADD(HOUR,20,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,26*60,CAST(@Ngay AS DATETIME)),280000,35,0,'da_len_lich',N'["AC","Wifi","Pillow & Blanket"]',4.8,52);
    END

    -- ── Đà Nẵng → Hà Tĩnh ─────────────────────────────────────────────────
    DECLARE @maTuyen_HTinh INT;
    SELECT @maTuyen_HTinh = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Hà Tĩnh';
    IF @maTuyen_HTinh IS NOT NULL
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_HTinh AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='19:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_HTinh,@maXe35_1,DATEADD(HOUR,19,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,26*60+30,CAST(@Ngay AS DATETIME)),380000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger","Pillow & Blanket"]',4.7,23);

    -- ── Đà Nẵng → Nghệ An ─────────────────────────────────────────────────
    DECLARE @maTuyen_NAn INT;
    SELECT @maTuyen_NAn = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Nghệ An';
    IF @maTuyen_NAn IS NOT NULL
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_NAn AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='18:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_NAn,@maXe35_4,DATEADD(HOUR,18,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,27*60,CAST(@Ngay AS DATETIME)),420000,35,0,'da_len_lich',N'["AC","Wifi","Phone Charger","Pillow & Blanket"]',4.8,35);

    -- ── Đà Nẵng → Thanh Hóa ──────────────────────────────────────────────
    DECLARE @maTuyen_THoa INT;
    SELECT @maTuyen_THoa = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đà Nẵng' AND diemDen = N'Thanh Hóa';
    IF @maTuyen_THoa IS NOT NULL
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_THoa AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='17:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_THoa,@maXe35_5,DATEADD(HOUR,17,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,29*60,CAST(@Ngay AS DATETIME)),520000,35,0,'da_len_lich',N'["AC","Wifi","Pillow & Blanket"]',4.5,17);

    -- ── Nội thành: Bến xe → Sân bay (mỗi 2h từ 5h-21h) ──────────────────
    DECLARE @maTuyen_BxSb INT;
    SELECT @maTuyen_BxSb = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Bến xe trung tâm' AND diemDen = N'Sân bay Quốc tế Đà Nẵng';
    IF @maTuyen_BxSb IS NOT NULL
    BEGIN
        DECLARE @h INT = 5;
        WHILE @h <= 21
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_BxSb AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)=CAST(RIGHT('0'+CAST(@h AS VARCHAR),2)+':00:00' AS TIME))
                INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
                VALUES(@maTuyen_BxSb,CASE WHEN @h%2=0 THEN @maXe16_1 ELSE @maXe16_2 END,
                    DATEADD(HOUR,@h,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,@h*60+30,CAST(@Ngay AS DATETIME)),
                    50000,16,0,'da_len_lich',N'["AC"]',4.3,5+@h);
            SET @h = @h + 2;
        END
    END

    -- ── Nội thành: Cầu Rồng → Phố cổ Hội An (mỗi 2h từ 6h-20h) ─────────
    DECLARE @maTuyen_CauRong INT;
    SELECT @maTuyen_CauRong = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Cầu Rồng' AND diemDen = N'Phố cổ Hội An';
    IF @maTuyen_CauRong IS NOT NULL
    BEGIN
        DECLARE @ch INT = 6;
        WHILE @ch <= 20
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_CauRong AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)=CAST(RIGHT('0'+CAST(@ch AS VARCHAR),2)+':00:00' AS TIME))
                INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
                VALUES(@maTuyen_CauRong,CASE WHEN @ch%3=0 THEN @maXe16_3 WHEN @ch%3=1 THEN @maXe16_4 ELSE @maXe16_5 END,
                    DATEADD(HOUR,@ch,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,@ch*60+45,CAST(@Ngay AS DATETIME)),
                    60000,16,0,'da_len_lich',
                    CASE WHEN @ch%2=0 THEN N'["AC","Wifi"]' ELSE N'["AC","Wifi","Phone Charger"]' END,
                    CAST(4.3+(@ch%3)*0.2 AS DECIMAL(3,1)),10+@ch);
            SET @ch = @ch + 2;
        END
    END

    -- ── Nội thành: Sân bay → Bãi biển Non Nước ───────────────────────────
    DECLARE @maTuyen_SbNuoc INT;
    SELECT @maTuyen_SbNuoc = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Sân bay Quốc tế Đà Nẵng' AND diemDen = N'Bãi biển Non Nước';
    IF @maTuyen_SbNuoc IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_SbNuoc AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='07:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_SbNuoc,@maXe16_4,DATEADD(HOUR,7,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,7*60+40,CAST(@Ngay AS DATETIME)),45000,16,0,'da_len_lich',N'["AC","Wifi","Phone Charger"]',4.6,22);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_SbNuoc AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='13:00:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_SbNuoc,@maXe16_5,DATEADD(HOUR,13,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,13*60+40,CAST(@Ngay AS DATETIME)),45000,16,0,'da_len_lich',N'["AC"]',4.4,14);
    END

    -- ── Nội thành: KCN Hòa Cầm → Bến xe trung tâm ───────────────────────
    DECLARE @maTuyen_KCN INT;
    SELECT @maTuyen_KCN = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Khu công nghiệp Hòa Cầm' AND diemDen = N'Bến xe trung tâm';
    IF @maTuyen_KCN IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_KCN AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='05:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_KCN,@maXe16_1,DATEADD(MINUTE,5*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,6*60+10,CAST(@Ngay AS DATETIME)),40000,16,0,'da_len_lich',N'["AC"]',4.2,9);
        IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_KCN AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)='16:30:00')
            INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
            VALUES(@maTuyen_KCN,@maXe16_2,DATEADD(MINUTE,16*60+30,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,17*60+10,CAST(@Ngay AS DATETIME)),40000,16,0,'da_len_lich',N'["AC"]',4.1,11);
    END

    -- ── Nội thành: Đại học Duy Tân → Trung tâm (mỗi 3h từ 6h-18h) ───────
    DECLARE @maTuyen_DHDT INT;
    SELECT @maTuyen_DHDT = maTuyenDuong FROM TuyenDuong WHERE diemDi = N'Đại học Duy Tân' AND diemDen = N'Trung tâm thành phố';
    IF @maTuyen_DHDT IS NOT NULL
    BEGIN
        DECLARE @dhh INT = 6;
        WHILE @dhh <= 18
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM ChuyenXe WHERE maTuyenDuong=@maTuyen_DHDT AND CAST(thoiGianDi AS DATE)=@Ngay AND CAST(thoiGianDi AS TIME)=CAST(RIGHT('0'+CAST(@dhh AS VARCHAR),2)+':00:00' AS TIME))
                INSERT INTO ChuyenXe(maTuyenDuong,maPhuongTien,thoiGianDi,thoiGianDen,giaCoBan,soGheConTrong,soLuongGheDat,trangThaiChuyen,tienIchChiTiet,diemDanhGia,soLuotDanhGia)
                VALUES(@maTuyen_DHDT,CASE WHEN @dhh%2=0 THEN @maXe16_2 ELSE @maXe16_4 END,
                    DATEADD(HOUR,@dhh,CAST(@Ngay AS DATETIME)),DATEADD(MINUTE,@dhh*60+25,CAST(@Ngay AS DATETIME)),
                    30000,16,0,'da_len_lich',N'["AC"]',4.0,3+@dhh);
            SET @dhh = @dhh + 3;
        END
    END

    SET @i = @i + 1;
END;
GO

-- Đồng bộ lại số ghế trống của chuyến xe khớp với số ghế thực tế của Phương tiện sau khi insert hardcode
UPDATE cx
SET cx.soGheConTrong = pt.tongSoGhe
FROM ChuyenXe cx
INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
WHERE cx.soLuongGheDat = 0;
GO


-- ============================================================================
-- PHẦN CẬP NHẬT: XE GIƯỜNG NẰM 36 CHỖ VÀ THÊM CÁC CHUYẾN ĐI
-- ============================================================================
-- 1. Tìm hoặc tạo Phương Tiện Sleeper 36
DECLARE @maPhuongTienSleeper INT;
SELECT TOP 1 @maPhuongTienSleeper = maPhuongTien FROM PhuongTien WHERE loaiXe = 'sleeper_36';

IF @maPhuongTienSleeper IS NULL
BEGIN
    INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch, ngayMuaVao)
    VALUES ('43B-999.99', 'Thaco Mobihome', 'Trắng-Xanh', 2024, 36, 'sleeper_36', 'san_sang', '["AC", "Wifi", "TV"]', GETDATE());
    SET @maPhuongTienSleeper = SCOPE_IDENTITY();
END

-- 2. Lấy Tuyến Đường ngoại thành đầu tiên
DECLARE @maTuyenDuongSleeper INT;
SELECT TOP 1 @maTuyenDuongSleeper = maTuyenDuong FROM TuyenDuong WHERE loaiDichVu = 'interCity';

IF @maTuyenDuongSleeper IS NOT NULL
BEGIN
    -- 3. Insert Chuyến Xe cho ngày mai và ngày mốt
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen)
    VALUES 
    (@maTuyenDuongSleeper, @maPhuongTienSleeper, DATEADD(day, 1, GETDATE()), DATEADD(day, 1, GETDATE()) + 0.1, 400000, 36, 0, 'da_len_lich'),
    (@maTuyenDuongSleeper, @maPhuongTienSleeper, DATEADD(day, 2, GETDATE()), DATEADD(day, 2, GETDATE()) + 0.1, 400000, 31, 5, 'da_len_lich');

    DECLARE @maChuyenXeSleeper INT = SCOPE_IDENTITY(); -- ID chuyến vừa tạo (chuyến 2)

    -- 4. Insert Ghế Ngồi (giả sử khách đã đặt 5 giường)
    INSERT INTO GheNgoi (maChuyenXe, soGhe, trangThaiGhe) VALUES (@maChuyenXeSleeper, '1', 'da_dat');
    INSERT INTO GheNgoi (maChuyenXe, soGhe, trangThaiGhe) VALUES (@maChuyenXeSleeper, '2', 'da_dat');
    INSERT INTO GheNgoi (maChuyenXe, soGhe, trangThaiGhe) VALUES (@maChuyenXeSleeper, '10', 'da_dat');
    INSERT INTO GheNgoi (maChuyenXe, soGhe, trangThaiGhe) VALUES (@maChuyenXeSleeper, '19', 'da_dat');
    INSERT INTO GheNgoi (maChuyenXe, soGhe, trangThaiGhe) VALUES (@maChuyenXeSleeper, '36', 'da_dat');
END
GO

-- ============================================================================
-- PHẦN 12: GÁN TÀI XẾ 5 VÀ SEED DỮ LIỆU THỰC TẾ CHO TRANG DRIVER
-- ============================================================================

-- 1. Gán tài xế Nguyễn Văn A (maNhanVien = 5) cho các chuyến đi ngày hôm nay
UPDATE ChuyenXe
SET maNhanVien = 5
WHERE maTuyenDuong IN (
    SELECT maTuyenDuong FROM TuyenDuong 
    WHERE (diemDi = N'Đà Nẵng' AND diemDen = N'Huế')
       OR (diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Nam')
       OR (diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Ngãi')
       OR (diemDi = N'Đà Nẵng' AND diemDen = N'Quảng Trị')
)
AND CAST(thoiGianDi AS DATE) = CAST(GETDATE() AS DATE);
GO

-- 2. Tự động thêm Ghế ngồi, Vé điện tử và Hàng hóa cho các chuyến xe ngày hôm nay của tài xế 5
DECLARE @maChuyenXe INT;
DECLARE @maTuyenDuong INT;
DECLARE @diemDi NVARCHAR(100);
DECLARE @diemDen NVARCHAR(100);

DECLARE ChuyenXeCursor CURSOR FOR
SELECT cx.maChuyenXe, cx.maTuyenDuong, td.diemDi, td.diemDen
FROM ChuyenXe cx
INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
WHERE cx.maNhanVien = 5
  AND CAST(cx.thoiGianDi AS DATE) = CAST(GETDATE() AS DATE);

OPEN ChuyenXeCursor;
FETCH NEXT FROM ChuyenXeCursor INTO @maChuyenXe, @maTuyenDuong, @diemDi, @diemDen;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Thêm sơ đồ ghế mẫu cho chuyến xe
    IF NOT EXISTS (SELECT 1 FROM GheNgoi WHERE maChuyenXe = @maChuyenXe)
    BEGIN
        INSERT INTO GheNgoi (maChuyenXe, soGhe, loaiGhe, viTriGhe, giaSoGhe, trangThaiGhe)
        VALUES 
            (@maChuyenXe, 'A01', 'standard', 'front', 0, 'trong'),
            (@maChuyenXe, 'A02', 'standard', 'front', 0, 'trong'),
            (@maChuyenXe, 'B05', 'standard', 'middle', 0, 'trong'),
            (@maChuyenXe, 'C02', 'standard', 'middle', 0, 'trong'),
            (@maChuyenXe, 'D01', 'standard', 'middle', 0, 'trong'),
            (@maChuyenXe, 'E03', 'standard', 'back', 0, 'trong'),
            (@maChuyenXe, 'F04', 'standard', 'back', 0, 'trong'),
            (@maChuyenXe, 'G02', 'standard', 'back', 0, 'trong');
    END

    -- Lấy ID các ghế vừa tạo
    DECLARE @maGhe_A01 INT, @maGhe_A02 INT, @maGhe_B05 INT, @maGhe_C02 INT, @maGhe_D01 INT;
    SELECT @maGhe_A01 = maGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = 'A01';
    SELECT @maGhe_A02 = maGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = 'A02';
    SELECT @maGhe_B05 = maGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = 'B05';
    SELECT @maGhe_C02 = maGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = 'C02';
    SELECT @maGhe_D01 = maGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND soGhe = 'D01';

    -- Thêm vé điện tử mẫu cho chuyến xe
    IF NOT EXISTS (SELECT 1 FROM VeDienTu WHERE maChuyenXe = @maChuyenXe)
    BEGIN
        -- Khách hàng 1: Nguyễn Văn Hùng
        INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
        VALUES (2, @maChuyenXe, @maGhe_A01, N'Nguyễn Văn Hùng', N'Hùng', N'Nguyễn', 'hungnv@gmail.com', '0905123456', N'Bến xe Trung tâm ' + @diemDi, N'Ga ' + @diemDen, CAST(NEWID() AS VARCHAR(255)), 1, 120000, 0, 120000, 'da_thanh_toan');

        -- Khách hàng 2: Lê Thị Mai
        INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
        VALUES (2, @maChuyenXe, @maGhe_A02, N'Lê Thị Mai', N'Mai', N'Lê', 'mailt@gmail.com', '0914987654', N'Nguyễn Văn Linh, ' + @diemDi, N'Trạm dừng ' + @diemDen, CAST(NEWID() AS VARCHAR(255)), 2, 120000, 0, 120000, 'da_thanh_toan');

        -- Khách hàng 3: Trần Tuấn Anh
        INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
        VALUES (2, @maChuyenXe, @maGhe_B05, N'Trần Tuấn Anh', N'Anh', N'Trần', 'anhtt@gmail.com', '0935555666', N'Bến xe Trung tâm ' + @diemDi, N'Ga ' + @diemDen, CAST(NEWID() AS VARCHAR(255)), 1, 120000, 0, 120000, 'da_su_dung');

        -- Khách hàng 4: Phạm Thanh Sơn
        INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
        VALUES (2, @maChuyenXe, @maGhe_C02, N'Phạm Thanh Sơn', N'Sơn', N'Phạm', 'sonpt@gmail.com', '0909111222', N'Sân bay ' + @diemDi, N'Hương Thủy, ' + @diemDen, CAST(NEWID() AS VARCHAR(255)), 3, 120000, 0, 120000, 'da_huy');

        -- Khách hàng 5: Hoàng Minh Thu
        INSERT INTO VeDienTu (maKhachHang, maChuyenXe, maGhe, hoTenHanhKhach, firstName, lastName, emailHanhKhach, soDienThoaiHanhKhach, diemDon, diemTra, maQR, maPhuongThuc, giaVe, giaHangHoa, giaThanhToan, trangThaiVe)
        VALUES (2, @maChuyenXe, @maGhe_D01, N'Hoàng Minh Thu', N'Thu', N'Hoàng', 'thohm@gmail.com', '0982333444', N'Cầu Rồng, ' + @diemDi, N'Ga ' + @diemDen, CAST(NEWID() AS VARCHAR(255)), 1, 120000, 0, 120000, 'da_thanh_toan');

        -- Cập nhật trạng thái ghế đã đặt
        UPDATE GheNgoi SET trangThaiGhe = 'da_dat' WHERE maGhe IN (@maGhe_A01, @maGhe_A02, @maGhe_B05, @maGhe_D01);
    END

    -- Thêm hàng hóa ký gửi mẫu liên kết với các vé của chuyến xe
    DECLARE @maVe_Hung INT, @maVe_Mai INT, @maVe_Thu INT;
    SELECT @maVe_Hung = maVe FROM VeDienTu WHERE maChuyenXe = @maChuyenXe AND hoTenHanhKhach = N'Nguyễn Văn Hùng';
    SELECT @maVe_Mai = maVe FROM VeDienTu WHERE maChuyenXe = @maChuyenXe AND hoTenHanhKhach = N'Lê Thị Mai';
    SELECT @maVe_Thu = maVe FROM VeDienTu WHERE maChuyenXe = @maChuyenXe AND hoTenHanhKhach = N'Hoàng Minh Thu';

    IF @maVe_Hung IS NOT NULL AND NOT EXISTS (SELECT 1 FROM HangHoa WHERE maVe = @maVe_Hung)
    BEGIN
        INSERT INTO HangHoa (maVe, loaiHangHoa, moTa, trongLuong, giaHangHoa, tenNguoiGui, soDienThoaiNguoiGui, tenNguoiNhan, soDienThoaiNguoiNhan, trangThaiVanChuyen)
        VALUES (@maVe_Hung, N'light', N'Tài liệu & Hồ sơ giấy tờ', 1.0, 50000, N'Nguyễn Văn A', '0905222333', N'Trần Văn B', '0914888999', 'pending');
    END

    IF @maVe_Mai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM HangHoa WHERE maVe = @maVe_Mai)
    BEGIN
        INSERT INTO HangHoa (maVe, loaiHangHoa, moTa, trongLuong, giaHangHoa, tenNguoiGui, soDienThoaiNguoiGui, tenNguoiNhan, soDienThoaiNguoiNhan, trangThaiVanChuyen)
        VALUES (@maVe_Mai, N'heavy', N'Thùng trái cây sấy', 8.5, 80000, N'Lê Thị C', '0982444555', N'Phạm Văn D', '0905777888', 'in_transit');
    END

    IF @maVe_Thu IS NOT NULL AND NOT EXISTS (SELECT 1 FROM HangHoa WHERE maVe = @maVe_Thu)
    BEGIN
        INSERT INTO HangHoa (maVe, loaiHangHoa, moTa, trongLuong, giaHangHoa, tenNguoiGui, soDienThoaiNguoiGui, tenNguoiNhan, soDienThoaiNguoiNhan, trangThaiVanChuyen)
        VALUES (@maVe_Thu, N'light', N'Đồ điện tử (Laptop Acer)', 2.5, 150000, N'Hoàng Văn E', '0911112222', N'Nguyễn Thị F', '0935444555', 'delivered');
    END

    -- Đồng bộ lại số lượng ghế đã đặt trên chuyến xe
    UPDATE ChuyenXe
    SET soLuongGheDat = (SELECT COUNT(*) FROM VeDienTu WHERE maChuyenXe = @maChuyenXe AND trangThaiVe != 'da_huy')
    WHERE maChuyenXe = @maChuyenXe;

    FETCH NEXT FROM ChuyenXeCursor INTO @maChuyenXe, @maTuyenDuong, @diemDi, @diemDen;
END

CLOSE ChuyenXeCursor;
DEALLOCATE ChuyenXeCursor;
GO