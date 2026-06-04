import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SeatMap from "../../components/booking/SeatMap";
import PassengerQuantity from "../../components/booking/PassengerQuantity";
import CargoSelector from "../../components/booking/CargoSelector";
import { useCargoPrice } from "../../hooks/useCargoPrice";
import { getTripById } from "../../services/tripService";
import { StorageUtil } from "../../utils/helpers";
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";

export default function BookingPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { calculateCargoPrice, cargoTypes } = useCargoPrice();
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(() => {
    const draft = sessionStorage.getItem("bookingDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      if (String(parsed.tripId) === String(tripId))
        return parsed.selectedSeats || [];
    }
    return [];
  });
  const [passengerQuantity, setPassengerQuantity] = useState(() => {
    const draft = sessionStorage.getItem("bookingDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      if (String(parsed.tripId) === String(tripId))
        return parsed.passengerQuantity || 0;
    }
    return 0;
  });
  const [passengerInfo, setPassengerInfo] = useState(() => {
    const draft = sessionStorage.getItem("bookingDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      if (String(parsed.tripId) === String(tripId) && parsed.passengerInfo)
        return parsed.passengerInfo;
    }

    const user = StorageUtil.getUser();
    if (user) {
      // Tách họ và tên từ fullName nếu có
      const fullName = user.hoTen || user.name || user.fullName || "";
      const nameParts = fullName.trim().split(" ");
      const lastName = nameParts.pop() || "";
      const firstName = nameParts.join(" ") || "";
      return {
        firstName,
        lastName,
        email: user.email || "",
        phone: user.soDienThoai || user.phone || "",
        pickupLocation: "",
        dropoffLocation: "",
      };
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      pickupLocation: "",
      dropoffLocation: "",
    };
  });
  const [cargoInfo, setCargoInfo] = useState(() => {
    const draft = sessionStorage.getItem("bookingDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      if (String(parsed.tripId) === String(tripId) && parsed.cargoInfo)
        return parsed.cargoInfo;
    }
    return {
      type: "none",
      weight: "",
      estimatedPrice: 0,
    };
  });

  // Global Timer State
  const [expireTime, setExpireTime] = useState(() => {
    const saved = sessionStorage.getItem("seatLockExpire");
    return saved ? parseInt(saved, 10) : null;
  });
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // When seat is selected, start timer
  useEffect(() => {
    if (!trip) return;
    const seatsToBook =
      trip.seats <= 16 ? passengerQuantity : selectedSeats.length;
    if (seatsToBook > 0 && !expireTime) {
      const newExpire = Date.now() + 3 * 60 * 1000; // 3 minutes
      setExpireTime(newExpire);
      sessionStorage.setItem("seatLockExpire", newExpire.toString());
    } else if (seatsToBook === 0 && expireTime) {
      setExpireTime(null);
      setTimeLeft(null);
      sessionStorage.removeItem("seatLockExpire");
    }
  }, [selectedSeats, passengerQuantity, expireTime, trip]);

  // Countdown tick
  useEffect(() => {
    if (!expireTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expireTime - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        sessionStorage.removeItem("seatLockExpire");
        sessionStorage.removeItem("bookingDraft");
        setShowTimeoutModal(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expireTime]);

  const formatTimeUI = (seconds) => {
    if (seconds === null) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fetch trip data from API on mount
  useEffect(() => {
    // Clear draft sau khi đã khôi phục xong để tránh dính state cho lần đặt vé sau (hoặc quay lại từ trang khác)
    sessionStorage.removeItem("bookingDraft");

    const fetchTrip = async () => {
      try {
        const data = await getTripById(tripId);
        if (data) {
          setTrip(data);
        } else if (location.state?.trip) {
          setTrip(location.state.trip);
        }
      } catch (err) {
        console.error("Error fetching trip details:", err);
        if (location.state?.trip) {
          setTrip(location.state.trip);
        } else {
          setTrip({
            id: parseInt(tripId) || 1,
            from: "Hà Nội",
            to: "Sài Gòn",
            departureTime: "08:00",
            date: "2024-01-15",
            category: "interCity",
            busType: "35-seater",
            seats: 35,
            price: 250000,
            amenities: ["AC", "Wifi", "Phone Charger"],
            rating: 4.5,
            occupiedSeats: [1, 3, 5, 10, 15, 20, 25],
          });
        }
      }
    };
    fetchTrip();
  }, [tripId, location.state]);

  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handlePassengerChange = (e) => {
    const { name, value } = e.target;
    setPassengerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCargoTypeChange = (e) => {
    const type = e.target.value;
    const price = calculateCargoPrice(type, cargoInfo.weight);
    setCargoInfo((prev) => ({ ...prev, type, estimatedPrice: price }));
  };

  const handleCargoWeightChange = (e) => {
    const weight = e.target.value;
    const price = calculateCargoPrice(cargoInfo.type, weight);
    setCargoInfo((prev) => ({ ...prev, weight, estimatedPrice: price }));
  };

  const seatsToBook = trip
    ? trip.seats <= 16
      ? passengerQuantity
      : selectedSeats.length
    : 0;

  const getTotalPrice = () => {
    if (!trip) return 0;
    return trip.price * seatsToBook + cargoInfo.estimatedPrice;
  };

  const handleBooking = () => {
    if (!trip) {
      alert("Chuyến xe không tìm thấy");
      return;
    }
    if (seatsToBook === 0) {
      alert(
        trip.seats <= 16
          ? "Vui lòng chọn số lượng hành khách"
          : "Vui lòng chọn ít nhất một ghế",
      );
      return;
    }
    if (
      !passengerInfo.firstName ||
      !passengerInfo.lastName ||
      !passengerInfo.email ||
      !passengerInfo.phone
    ) {
      alert("Vui lòng điền đầy đủ thông tin hành khách");
      return;
    }
    if (!passengerInfo.pickupLocation || !passengerInfo.dropoffLocation) {
      alert("Vui lòng nhập điểm đón và điểm trả khách");
      return;
    }

    // Luôn lưu nháp trước khi qua trang thanh toán để phòng trường hợp khách quay lại
    sessionStorage.setItem(
      "bookingDraft",
      JSON.stringify({
        tripId: trip.id,
        selectedSeats: trip.seats <= 16 ? [] : selectedSeats,
        passengerQuantity: trip.seats <= 16 ? passengerQuantity : 0,
        passengerInfo,
        cargoInfo,
      }),
    );

    navigate("/payment", {
      state: {
        trip,
        selectedSeats: trip.seats <= 16 ? [] : selectedSeats,
        passengerQuantity: trip.seats <= 16 ? passengerQuantity : 0,
        passengerInfo,
        cargoInfo,
        totalPrice: getTotalPrice(),
      },
    });
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            Đang tải thông tin chuyến xe...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 md:px-16">
      {/* Sticky Timer Banner */}
      {timeLeft !== null && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-xl font-bold text-base border-2 ${timeLeft <= 60 ? "bg-red-500 text-white border-red-400" : "bg-amber-400 text-slate-900 border-amber-300"}`}
          >
            <FiClock size={20} />
            <span>Thời gian giữ chỗ:</span>
            <span className="text-xl font-black">{formatTimeUI(timeLeft)}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Quay lại kết quả tìm kiếm
          </button>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { n: 1, label: "Chọn ghế" },
              { n: 2, label: "Thông tin" },
              { n: 3, label: "Thanh toán" },
              { n: 4, label: "Hoàn tất" },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${i === 0 ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-200"}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? "bg-white text-blue-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    {step.n}
                  </span>
                  {step.label}
                </div>
                {i < 3 && <div className="w-6 h-px bg-slate-300"></div>}
              </div>
            ))}
          </div>

          {/* Trip Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Chuyến xe đã chọn
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {trip.departureTime}
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {trip.from}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <FiMapPin className="text-blue-500 mb-1" />
                  <div className="h-px w-16 bg-slate-300"></div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {trip.arrivalTime || "---"}
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {trip.to}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Giá/ghế
              </div>
              <div className="text-2xl font-black text-blue-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(trip.price)}
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                {new Date(trip.date).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Main Booking Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section 1: Seat Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                    1
                  </span>
                  {trip.seats <= 16
                    ? "Chọn số lượng hành khách"
                    : "Chọn vị trí ghế"}
                </h2>
              </div>
              <div className="p-6">
                {trip.seats <= 16 ? (
                  <PassengerQuantity
                    trip={trip}
                    quantity={passengerQuantity}
                    onQuantityChange={setPassengerQuantity}
                  />
                ) : (
                  <SeatMap
                    trip={trip}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                  />
                )}
              </div>
            </div>

            {/* Section 2: Passenger Info */}
            <div className="bg-sky-50 rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-sky-100 bg-sky-100/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-sky-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                      2
                    </span>
                    Thông tin hành khách
                  </h2>
                  {StorageUtil.getUser() && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                      <FiInfo size={12} />
                      Đã tự điền từ tài khoản của bạn
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Họ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={passengerInfo.firstName}
                        onChange={handlePassengerChange}
                        placeholder="Nhập họ"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={passengerInfo.lastName}
                        onChange={handlePassengerChange}
                        placeholder="Nhập tên"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={passengerInfo.email}
                        onChange={handlePassengerChange}
                        placeholder="nhap@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={passengerInfo.phone}
                        onChange={handlePassengerChange}
                        placeholder="0912345678"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Điểm đón khách <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="pickupLocation"
                        value={passengerInfo.pickupLocation}
                        onChange={handlePassengerChange}
                        placeholder="Địa chỉ đón khách"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Điểm trả khách <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="dropoffLocation"
                        value={passengerInfo.dropoffLocation}
                        onChange={handlePassengerChange}
                        placeholder="Địa chỉ trả khách"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-medium text-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Cargo */}
            <div className="bg-violet-50 rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-violet-100 bg-violet-100/60">
                <h2 className="text-lg font-bold text-violet-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                    3
                  </span>
                  Hành lý & Hàng hóa{" "}
                  <span className="text-xs font-medium text-slate-400 ml-1">
                    (Tùy chọn)
                  </span>
                </h2>
              </div>
              <div className="p-6">
                <CargoSelector
                  cargoInfo={cargoInfo}
                  onCargoTypeChange={handleCargoTypeChange}
                  onCargoWeightChange={handleCargoWeightChange}
                  cargoTypes={cargoTypes}
                  busType={trip?.busType}
                />
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-100 bg-amber-100/60">
                  <h2 className="text-lg font-bold text-amber-900">
                    Tóm tắt đặt vé
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Trip */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        {trip.from} → {trip.to}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {trip.departureTime} •{" "}
                        {new Date(trip.date).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100"></div>

                  {/* Seats */}
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">
                      Giá vé ({seatsToBook}{" "}
                      {trip.seats <= 16 ? "hành khách" : "ghế"})
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(trip.price * seatsToBook)}
                    </span>
                  </div>

                  {/* Selected seats list */}
                  {selectedSeats.length > 0 && trip.seats > 16 && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs font-medium text-blue-700">
                      Ghế đã chọn:{" "}
                      <span className="font-black">
                        {selectedSeats.sort((a, b) => a - b).join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Cargo */}
                  {cargoInfo.type !== "none" && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        Phí hàng hóa
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {cargoInfo.estimatedPrice > 0
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(cargoInfo.estimatedPrice)
                          : "Miễn phí"}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-slate-100"></div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-black text-blue-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning if not enough info */}
              {seatsToBook === 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700">
                  <FiAlertTriangle className="shrink-0 mt-0.5" />
                  {trip.seats <= 16
                    ? "Vui lòng chọn số lượng hành khách"
                    : "Vui lòng chọn ít nhất một ghế"}
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={seatsToBook === 0}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md ${seatsToBook > 0 ? "bg-slate-900 hover:bg-blue-600 text-white hover:shadow-lg" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                <FiCheck size={20} />
                Tiến hành thanh toán
              </button>

              <p className="text-center text-xs text-slate-400 font-medium">
                🔒 Thông tin của bạn được bảo mật an toàn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FiClock className="text-amber-500" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">
              Hết thời gian giữ chỗ
            </h3>
            <p className="text-slate-600 font-medium mb-8">
              Đã hết thời hạn khóa ghế cho quý khách. Xin quý khách vui lòng đặt
              vé lại.
            </p>
            <button
              onClick={() => {
                setShowTimeoutModal(false);
                window.location.reload();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Xác nhận quay về Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
