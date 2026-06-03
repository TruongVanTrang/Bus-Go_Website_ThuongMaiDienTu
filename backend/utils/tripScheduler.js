/**
 * Trip Scheduler - Automatically generate trips for the next 7 days
 * This scheduler runs daily to ensure trips are always available for booking
 */

const { sql, getPool } = require('../config/db');
const schedule = require('node-schedule');

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getUTCMonth() + 1);
  let day = '' + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

/**
 * Generate trips for all routes for the next 7 days
 */
const generateDailyTrips = async () => {
  let pool;
  try {
    pool = getPool();
    console.log('[TripScheduler] Starting daily trip generation...');

    // Get all routes
    const routesResult = await pool.request().query(`
      SELECT maTuyenDuong, diemDi, diemDen, loaiDichVu
      FROM TuyenDuong
      ORDER BY maTuyenDuong
    `);

    const routes = routesResult.recordset;
    let tripCount = 0;

    // For each route, generate trips for the next 7 days
    for (const route of routes) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const tripDate = new Date();
        tripDate.setDate(tripDate.getDate() + dayOffset);
        const dateStr = formatDate(tripDate);

        // Check if trips already exist for this route and date
        const existingTripsResult = await pool.request()
          .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
          .input('date', sql.Date, dateStr)
          .query(`
            SELECT COUNT(*) as count
            FROM ChuyenXe
            WHERE maTuyenDuong = @maTuyenDuong 
            AND CAST(thoiGianDi AS DATE) = @date
          `);

        const existingCount = existingTripsResult.recordset[0].count;

        // If no trips exist for this route on this date, create them
        if (existingCount === 0) {
          // Find suitable vehicle
          const vehicleResult = await pool.request()
            .input('loaiDichVu', sql.NVarChar, route.loaiDichVu)
            .query(`
              SELECT TOP 1 maPhuongTien, tongSoGhe, loaiXe
              FROM PhuongTien
              WHERE (loaiXe = '16-seater' AND @loaiDichVu = 'city')
                 OR (loaiXe = '35-seater' AND @loaiDichVu = 'interCity')
                 OR (loaiXe = 'sleeper_36' AND @loaiDichVu = 'interCity')
              ORDER BY maPhuongTien ASC
            `);

          const vehicle = vehicleResult.recordset[0];
          if (!vehicle) {
            console.warn(`[TripScheduler] No suitable vehicle found for route ${route.maTuyenDuong}`);
            continue;
          }

          // Define trip times based on service type
          const tripTimes = route.loaiDichVu === 'city'
            ? [
                { dep: '06:00:00', arr: '06:45:00', price: 50000 },
                { dep: '08:00:00', arr: '08:45:00', price: 50000 },
                { dep: '10:00:00', arr: '10:45:00', price: 60000 },
                { dep: '14:00:00', arr: '14:45:00', price: 60000 },
                { dep: '16:00:00', arr: '16:45:00', price: 70000 }
              ]
            : [
                { dep: '06:00:00', arr: '14:00:00', price: 120000 },
                { dep: '09:30:00', arr: '17:30:00', price: 120000 },
                { dep: '13:00:00', arr: '21:00:00', price: 120000 },
                { dep: '16:30:00', arr: '23:59:00', price: 130000 }
              ];

          // Insert trips
          for (const time of tripTimes) {
            const thoiGianDi = `${dateStr} ${time.dep}`;
            const thoiGianDen = `${dateStr} ${time.arr}`;

            await pool.request()
              .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
              .input('maPhuongTien', sql.Int, vehicle.maPhuongTien)
              .input('thoiGianDi', sql.DateTime, thoiGianDi)
              .input('thoiGianDen', sql.DateTime, thoiGianDen)
              .input('giaCoBan', sql.Decimal(18, 2), time.price)
              .input('soGheConTrong', sql.Int, vehicle.tongSoGhe)
              .query(`
                INSERT INTO ChuyenXe 
                (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet, diemDanhGia, soLuotDanhGia)
                VALUES 
                (@maTuyenDuong, @maPhuongTien, @thoiGianDi, @thoiGianDen, @giaCoBan, @soGheConTrong, 0, 'da_len_lich', '["AC", "Wifi", "Phone Charger"]', 4.5, 0)
              `);

            tripCount++;
          }
        }
      }
    }

    console.log(`[TripScheduler] Successfully generated ${tripCount} trips for the next 7 days`);
    return tripCount;
  } catch (error) {
    console.error('[TripScheduler] Error generating daily trips:', error);
    throw error;
  }
};

/**
 * Clean up old/completed trips (older than 1 day)
 * Optional: Archive completed trips instead of deleting
 */
const cleanupOldTrips = async () => {
  let pool;
  try {
    pool = getPool();
    console.log('[TripScheduler] Starting cleanup of old trips...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatDate(yesterday);

    // Archive completed trips (instead of deleting)
    const result = await pool.request()
      .input('date', sql.Date, dateStr)
      .query(`
        SELECT COUNT(*) as count
        FROM ChuyenXe
        WHERE CAST(thoiGianDi AS DATE) < @date
        AND trangThaiChuyen IN ('da_hoan_thanh', 'da_huy')
      `);

    const cleanedCount = result.recordset[0].count;
    console.log(`[TripScheduler] Found ${cleanedCount} completed/cancelled trips older than 1 day`);

    return cleanedCount;
  } catch (error) {
    console.error('[TripScheduler] Error cleaning up old trips:', error);
    throw error;
  }
};

/**
 * Initialize the trip scheduler
 * Runs daily at 2:00 AM to generate trips for the next 7 days
 */
const initializeTripScheduler = () => {
  try {
    // Schedule daily job at 2:00 AM
    schedule.scheduleJob('0 2 * * *', async () => {
      console.log('[TripScheduler] Executing scheduled daily trip generation...');
      await generateDailyTrips();
      await cleanupOldTrips();
    });

    console.log('[TripScheduler] Trip scheduler initialized. Will run daily at 02:00 AM');

    // Also run once when server starts (after 10 seconds delay to ensure DB is ready)
    setTimeout(async () => {
      console.log('[TripScheduler] Running initial trip generation on server startup...');
      await generateDailyTrips();
    }, 10000);

  } catch (error) {
    console.error('[TripScheduler] Failed to initialize trip scheduler:', error);
  }
};

module.exports = {
  initializeTripScheduler,
  generateDailyTrips,
  cleanupOldTrips
};
