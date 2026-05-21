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
    (N'Sân bay Quốc tế Đà Nẵng', N'Bãi biển Non Nước', 'city', 25);
GO

-- 29. Thêm Tuyến đường (Ngoại thành)
INSERT INTO TuyenDuong (diemDi, diemDen, loaiDichVu, khoangCach)
VALUES 
    (N'Đà Nẵng', N'Hà Nội', 'interCity', 1000),
    (N'Đà Nẵng', N'Sài Gòn', 'interCity', 950),
    (N'Đà Nẵng', N'Huế', 'interCity', 100),
    (N'Đà Nẵng', N'Quảng Nam', 'interCity', 40);
GO

-- 30. Thêm Phương tiện (16 chỗ - Nội thành)
INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch)
VALUES 
    (N'29A-12345', N'Hyundai', N'Trắng', 2022, 16, '16-seater', 'san_sang', '["AC", "Wifi"]'),
    (N'29A-12346', N'Hyundai', N'Xanh', 2022, 16, '16-seater', 'san_sang', '["AC", "Wifi"]'),
    (N'29A-12347', N'Hyundai', N'Trắng', 2023, 16, '16-seater', 'san_sang', '["AC", "Wifi", "Phone Charger"]');
GO

-- 31. Thêm Phương tiện (35 chỗ - Ngoại thành)
INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch)
VALUES 
    (N'29A-54321', N'Toyota', N'Trắng', 2021, 35, '35-seater', 'san_sang', '["AC", "Wifi", "Phone Charger", "Toilet"]'),
    (N'29A-54322', N'Toyota', N'Bạc', 2021, 35, '35-seater', 'san_sang', '["AC", "Wifi", "Phone Charger"]'),
    (N'29A-54323', N'Hyundai', N'Trắng', 2022, 35, '35-seater', 'san_sang', '["AC", "Wifi", "Pillow & Blanket"]');
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

-- Seed dữ liệu ChuyenXe mẫu cho các ngày
DECLARE @Dates TABLE (Ngay DATE);
INSERT INTO @Dates VALUES ('2024-01-15'), ('2026-05-21'), ('2026-05-22'), ('2026-05-23');

DECLARE @Ngay DATE;
DECLARE date_cursor CURSOR FOR SELECT Ngay FROM @Dates;

OPEN date_cursor;
FETCH NEXT FROM date_cursor INTO @Ngay;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- 1. Tuyến Đà Nẵng -> Hà Nội (maTuyen = 5, maXe = 4, xe 35 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (5, 4, CAST(@Ngay AS DATETIME) + CAST('05:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('14:30:00' AS DATETIME), 250000, 35, 0, 'da_len_lich', '["AC", "Wifi", "Phone Charger"]', 4.5, 12),
    (5, 5, CAST(@Ngay AS DATETIME) + CAST('07:30:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('17:00:00' AS DATETIME), 450000, 35, 0, 'da_len_lich', '["AC", "Wifi", "Phone Charger", "Blanket"]', 4.8, 8),
    (5, 6, CAST(@Ngay AS DATETIME) + CAST('09:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('18:30:00' AS DATETIME), 280000, 35, 0, 'da_len_lich', '["AC", "Wifi", "Phone Charger", "Toilet"]', 4.6, 15);

    -- 2. Tuyến Đà Nẵng -> Sài Gòn (maTuyen = 6, maXe = 5, xe 35 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (6, 5, CAST(@Ngay AS DATETIME) + CAST('14:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('23:30:00' AS DATETIME), 200000, 35, 0, 'da_len_lich', '["AC"]', 4.0, 6),
    (6, 6, CAST(@Ngay AS DATETIME) + CAST('20:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('05:30:00' AS DATETIME) + 1, 520000, 35, 0, 'da_len_lich', '["AC", "Wifi", "Phone Charger", "Blanket", "Toilet"]', 4.9, 21);

    -- 3. Tuyến Đà Nẵng -> Huế (maTuyen = 7, maXe = 6, xe 35 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (7, 6, CAST(@Ngay AS DATETIME) + CAST('08:30:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('10:30:00' AS DATETIME), 120000, 35, 0, 'da_len_lich', '["AC", "Wifi"]', 4.6, 9);

    -- 4. Tuyến Đà Nẵng -> Quảng Nam (maTuyen = 8, maXe = 6, xe 35 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (8, 6, CAST(@Ngay AS DATETIME) + CAST('10:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('11:00:00' AS DATETIME), 170000, 35, 0, 'da_len_lich', '["AC"]', 4.1, 4);

    -- 5. Tuyến Nội thành: Bến xe trung tâm -> Sân bay (maTuyen = 1, maXe = 1, xe 16 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (1, 1, CAST(@Ngay AS DATETIME) + CAST('06:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('06:30:00' AS DATETIME), 50000, 16, 0, 'da_len_lich', '["AC"]', 4.3, 10),
    (1, 2, CAST(@Ngay AS DATETIME) + CAST('12:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('12:30:00' AS DATETIME), 50000, 16, 0, 'da_len_lich', '["AC"]', 4.2, 5);

    -- 6. Tuyến Nội thành: Bến xe trung tâm -> Bãi biển Mỹ Khê (maTuyen = 2, maXe = 2, xe 16 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (2, 2, CAST(@Ngay AS DATETIME) + CAST('07:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('07:20:00' AS DATETIME), 35000, 16, 0, 'da_len_lich', '["AC"]', 4.4, 7);

    -- 7. Tuyến Nội thành: Cầu Rồng -> Phố cổ Hội An (maTuyen = 3, maXe = 3, xe 16 chỗ)
    INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
    VALUES 
    (3, 3, CAST(@Ngay AS DATETIME) + CAST('08:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('08:45:00' AS DATETIME), 60000, 16, 0, 'da_len_lich', '["AC", "Wifi"]', 4.5, 18),
    (3, 1, CAST(@Ngay AS DATETIME) + CAST('14:00:00' AS DATETIME), CAST(@Ngay AS DATETIME) + CAST('14:45:00' AS DATETIME), 60000, 16, 0, 'da_len_lich', '["AC", "Wifi"]', 4.4, 11);

    FETCH NEXT FROM date_cursor INTO @Ngay;
END;

CLOSE date_cursor;
DEALLOCATE date_cursor;
GO

-- Seed thêm một số ghế đã đặt mẫu để kiểm tra sơ đồ ghế của chuyến đầu tiên
DECLARE @maChuyenXe INT;
SELECT TOP 1 @maChuyenXe = maChuyenXe 
FROM ChuyenXe cx
INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
WHERE td.diemDi = N'Đà Nẵng' 
  AND td.diemDen = N'Hà Nội' 
  AND CAST(cx.thoiGianDi AS DATE) = '2024-01-15'
  AND CAST(cx.thoiGianDi AS TIME) = '05:00:00';

IF @maChuyenXe IS NOT NULL
BEGIN
    -- Chèn ghế đã đặt
    INSERT INTO GheNgoi (maChuyenXe, soGhe, loaiGhe, viTriGhe, giaSoGhe, trangThaiGhe)
    VALUES
    (@maChuyenXe, '1', 'standard', 'front', 0, 'da_dat'),
    (@maChuyenXe, '3', 'standard', 'front', 0, 'da_dat'),
    (@maChuyenXe, '5', 'standard', 'middle', 0, 'da_dat'),
    (@maChuyenXe, '10', 'standard', 'middle', 0, 'da_dat'),
    (@maChuyenXe, '15', 'standard', 'middle', 0, 'da_dat'),
    (@maChuyenXe, '20', 'standard', 'back', 0, 'da_dat'),
    (@maChuyenXe, '25', 'standard', 'back', 0, 'da_dat');

    -- Cập nhật số ghế trống tự động
    UPDATE ChuyenXe
    SET soGheConTrong = (SELECT COUNT(*) FROM GheNgoi WHERE maChuyenXe = ChuyenXe.maChuyenXe AND trangThaiGhe = 'trong')
    WHERE maChuyenXe = @maChuyenXe;
END;
GO
