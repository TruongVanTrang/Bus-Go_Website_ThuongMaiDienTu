const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, 'cargo-' + Date.now() + path.extname(file.originalname));
  }
});

// Lọc loại file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Không phải file ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // Giới hạn 20MB
  },
  fileFilter: fileFilter
});

// Endpoint upload ảnh
// Trả về url của ảnh
router.post('/', protect, (req, res, next) => {
  const uploadMiddleware = upload.single('image');
  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: 'Lỗi tải file (kích thước quá lớn hoặc định dạng không đúng).' });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ message: 'Lỗi máy chủ khi tải ảnh.' });
    }
    
    // Everything went fine.
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên.' });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({ url: imageUrl, message: 'Upload thành công!' });
    } catch (error) {
      console.error('Lỗi upload:', error);
      res.status(500).json({ message: 'Lỗi server khi upload ảnh.' });
    }
  });
});

module.exports = router;
