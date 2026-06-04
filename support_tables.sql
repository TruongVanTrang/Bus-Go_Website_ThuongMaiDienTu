-- ============================================================================
-- BusGo - Support Staff Feature Tables
-- Chạy script này SAU KHI đã chạy BusGo_DB_Updated.sql
-- Tạo bảng: ChatSession, ChatMessage, CancellationRequest
-- Chính sách hoàn tiền:
--   > 24h  : 95% (100% - 5% phí HC)
--   12-24h : 70% (75%  - 5% phí HC)
--   1-12h  : 45% (50%  - 5% phí HC)
--   < 1h   : 0%  (không hoàn)
--   Đã KH  : 0%  (không hoàn)
-- ============================================================================

USE BusGoDBs;
GO

-- ============================================================================
-- 1. Bảng Phiên Chat (ChatSession)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatSession')
BEGIN
    CREATE TABLE ChatSession (
        maChatSession   INT IDENTITY(1,1) PRIMARY KEY,
        maNhanVienHT    INT FOREIGN KEY REFERENCES NhanVien(maNhanVien),  -- Support Agent (nullable initially)
        maKhachHang     INT FOREIGN KEY REFERENCES KhachHang(maKhachHang),         -- Khách hàng (NULL nếu chưa gán)
        tenKhachHang    NVARCHAR(100),          -- Tên khách (nếu không có tài khoản)
        emailKhach      VARCHAR(100),
        trangThai       NVARCHAR(20) DEFAULT 'active',  -- active, inactive, closed
        chuDeChat       NVARCHAR(255),          -- Chủ đề / vấn đề ban đầu
        thoiGianBatDau  DATETIME DEFAULT GETDATE(),
        thoiGianKetThuc DATETIME NULL,
        thoiGianCapNhat DATETIME DEFAULT GETDATE()
    );
    PRINT N'Đã tạo bảng ChatSession';
END
GO

-- ============================================================================
-- 2. Bảng Tin Nhắn Chat (ChatMessage)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessage')
BEGIN
    CREATE TABLE ChatMessage (
        maTinNhan       INT IDENTITY(1,1) PRIMARY KEY,
        maChatSession   INT NOT NULL FOREIGN KEY REFERENCES ChatSession(maChatSession),
        nguoiGui        NVARCHAR(20) NOT NULL,  -- 'agent' | 'customer'
        maNguoiGui      INT NOT NULL,            -- ID của NhanVien hoặc KhachHang
        noiDung         NVARCHAR(MAX) NOT NULL,
        trangThaiDoc    NVARCHAR(20) DEFAULT 'sent',  -- sent, delivered, read
        thoiGianGui     DATETIME DEFAULT GETDATE()
    );
    PRINT N'Đã tạo bảng ChatMessage';
END
GO

-- ============================================================================
-- 3. Bảng Yêu Cầu Hoàn/Hủy Vé (CancellationRequest)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CancellationRequest')
BEGIN
    CREATE TABLE CancellationRequest (
        maYeuCau            INT IDENTITY(1,1) PRIMARY KEY,
        maVe                INT NOT NULL FOREIGN KEY REFERENCES VeDienTu(maVe),
        maKhachHang         INT FOREIGN KEY REFERENCES KhachHang(maKhachHang),
        maNhanVienXuLy      INT FOREIGN KEY REFERENCES NhanVien(maNhanVien),   -- Support Agent xử lý

        -- Thông tin yêu cầu
        lyDoHuy             NVARCHAR(MAX),              -- Lý do khách hủy
        trangThai           NVARCHAR(30) DEFAULT 'pending',  -- pending, approved, rejected, processing, completed, failed

        -- Thông tin hoàn tiền
        giaVeGoc            DECIMAL(18,2),              -- Giá vé gốc
        phanTramHoan        DECIMAL(5,2),               -- % hoàn (95, 70, 45, 0)
        soTienHoan          DECIMAL(18,2) DEFAULT 0,    -- Số tiền thực hoàn
        phuongThucHoan      NVARCHAR(50),               -- Phương thức hoàn (cùng phương thức thanh toán)

        -- Refund status
        trangThaiHoan       NVARCHAR(30) DEFAULT 'pending',  -- pending, approved, rejected, processing, completed, failed
        soLanThuLai         INT DEFAULT 0,

        -- Ghi chú xử lý
        lyDoTuChoi          NVARCHAR(MAX),
        ghiChuXuLy          NVARCHAR(MAX),

        -- Timestamps
        thoiGianYeuCau      DATETIME DEFAULT GETDATE(),
        thoiGianXuLy        DATETIME NULL,
        thoiGianHoanThanh   DATETIME NULL,
        thoiGianCapNhat     DATETIME DEFAULT GETDATE()
    );
    PRINT N'Đã tạo bảng CancellationRequest';
END
GO

-- ============================================================================
-- 4. Index tối ưu
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_ChatSession_NhanVien')
    CREATE NONCLUSTERED INDEX IDX_ChatSession_NhanVien ON ChatSession(maNhanVienHT, trangThai);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_ChatSession_KhachHang')
    CREATE NONCLUSTERED INDEX IDX_ChatSession_KhachHang ON ChatSession(maKhachHang);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_ChatMessage_Session')
    CREATE NONCLUSTERED INDEX IDX_ChatMessage_Session ON ChatMessage(maChatSession, thoiGianGui);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_CancellationRequest_Ve')
    CREATE NONCLUSTERED INDEX IDX_CancellationRequest_Ve ON CancellationRequest(maVe);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_CancellationRequest_Status')
    CREATE NONCLUSTERED INDEX IDX_CancellationRequest_Status ON CancellationRequest(trangThai, thoiGianYeuCau);
GO

-- ============================================================================
-- 5. Dữ liệu mẫu demo (cho tài khoản support@busgo.com - maNhanVien = 7)
-- ============================================================================

-- Tạo một phiên chat demo
IF NOT EXISTS (SELECT 1 FROM ChatSession WHERE maNhanVienHT = 7)
BEGIN
    INSERT INTO ChatSession (maNhanVienHT, maKhachHang, tenKhachHang, emailKhach, trangThai, chuDeChat)
    VALUES 
        (7, 2, N'Khách hàng mẫu', 'customer@busgo.vn', 'active', N'Hỏi về chính sách hủy vé'),
        (7, 8, N'Khách hàng', 'user@gmail.com', 'closed', N'Yêu cầu hoàn tiền vé');

    -- Thêm tin nhắn demo cho phiên chat đầu tiên
    DECLARE @sessionId INT = SCOPE_IDENTITY() - 1;
    IF @sessionId IS NOT NULL
    BEGIN
        INSERT INTO ChatMessage (maChatSession, nguoiGui, maNguoiGui, noiDung)
        VALUES 
            (@sessionId, 'customer', 2, N'Xin chào, tôi muốn hỏi về chính sách hủy vé.'),
            (@sessionId, 'agent',    7, N'Xin chào! Tôi có thể giúp gì cho bạn về chính sách hủy vé?'),
            (@sessionId, 'customer', 2, N'Nếu tôi hủy vé trước 24 giờ thì được hoàn bao nhiêu %?'),
            (@sessionId, 'agent',    7, N'Nếu hủy trước 24 giờ, bạn sẽ được hoàn 95% giá vé (100% trừ 5% phí hành chính). Xin lỗi vì sự bất tiện này.');
    END

    PRINT N'Đã thêm dữ liệu mẫu ChatSession & ChatMessage';
END
GO

PRINT N'============================================';
PRINT N'Support tables created successfully!';
PRINT N'============================================';
