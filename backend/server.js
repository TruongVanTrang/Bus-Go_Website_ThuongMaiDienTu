const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Parse JSON body with 10mb limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parse URL-encoded bodies with 10mb limit

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('BusGo API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi server nội bộ', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
