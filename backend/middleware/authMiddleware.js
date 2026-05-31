const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lưu thông tin user vào req (để dùng ở controller tiếp theo)
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Không được phép truy cập, token không hợp lệ' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Không được phép truy cập, không có token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép truy cập, yêu cầu quyền quản trị viên' });
  }
};

module.exports = { protect, admin };
