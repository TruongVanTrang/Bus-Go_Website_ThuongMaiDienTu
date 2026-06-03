import QRCode from 'qrcode.react'
import { FiClock } from 'react-icons/fi'
import './TicketCard.css'

export default function TicketCard({ bookingId, ticketData }) {
  // Sử dụng bookingId đơn giản để tạo QR code - dễ quét và có thể dùng lại
  const qrValue = bookingId

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Boarding Pass Container */}
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden relative print-color-adjust-exact">
        
        {/* Left Section - Trip Details (75%) */}
        <div className="w-full md:w-[75%] p-6 md:p-8 bg-white relative">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-2xl font-black tracking-tight">
              <span className="text-blue-600">Bus</span>
              <span className="text-orange-500">Go</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-Ticket / Vé điện tử</div>
              <div className="text-xl font-black text-slate-800">{bookingId}</div>
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center w-1/3">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{ticketData.trip.departureTime || '08:00'}</div>
              <div className="text-sm font-bold text-slate-500">{ticketData.trip.from}</div>
            </div>
            
            <div className="flex-1 flex flex-col items-center px-4 relative">
              <div className="w-full border-t-2 border-dashed border-slate-300 absolute top-1/2 -translate-y-1/2"></div>
              <div className="bg-white px-3 relative z-10 text-slate-400">
                <FiClock size={24} />
              </div>
              <div className="text-xs font-bold text-slate-400 mt-2 relative z-10 bg-white px-2">{ticketData.trip.duration || '9h 30m'}</div>
            </div>

            <div className="text-center w-1/3">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{ticketData.trip.arrivalTime || '17:30'}</div>
              <div className="text-sm font-bold text-slate-500">{ticketData.trip.to}</div>
            </div>
          </div>

          {/* Passenger Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ngày đi</div>
              <div className="font-bold text-slate-800">{ticketData.trip.date}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Hãng xe</div>
              <div className="font-bold text-slate-800">{ticketData.trip.operator}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ghế</div>
              <div className="font-black text-blue-600 text-lg leading-tight">{ticketData.selectedSeats.join(', ')}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Hành khách</div>
              <div className="font-bold text-slate-800 truncate">{ticketData.passengerInfo.firstName} {ticketData.passengerInfo.lastName}</div>
            </div>
          </div>
        </div>

        {/* Divider / Perforated Edge for Desktop */}
        <div className="hidden md:flex flex-col items-center justify-center relative w-8 bg-white border-l-2 border-dashed border-slate-300">
          <div className="absolute -top-4 w-8 h-8 bg-slate-50 rounded-full border-b-2 border-slate-200"></div>
          <div className="absolute -bottom-4 w-8 h-8 bg-slate-50 rounded-full border-t-2 border-slate-200"></div>
        </div>

        {/* Divider / Perforated Edge for Mobile */}
        <div className="md:hidden flex items-center justify-center relative h-8 bg-white border-t-2 border-dashed border-slate-300">
          <div className="absolute -left-4 w-8 h-8 bg-slate-50 rounded-full border-r-2 border-slate-200"></div>
          <div className="absolute -right-4 w-8 h-8 bg-slate-50 rounded-full border-l-2 border-slate-200"></div>
        </div>

        {/* Right Section - QR Code (25%) */}
        <div className="w-full md:w-[25%] bg-blue-600 text-white p-6 flex flex-col items-center justify-center relative min-h-[300px]">
          <div className="text-center mb-5">
            <div className="text-sm font-bold opacity-90 uppercase tracking-widest mb-1">Mã đặt chỗ</div>
            <div className="text-2xl font-black tracking-wide">{bookingId}</div>
          </div>
          
          <div className="bg-white p-3 rounded-2xl ticket-qr shadow-lg w-40 h-40 flex items-center justify-center">
            <QRCode
              value={qrValue}
              size={140}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          
          <div className="text-center mt-5 text-xs font-medium opacity-90 max-w-[150px] leading-relaxed">
            Quét mã QR này khi lên xe hoặc tại quầy vé
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-col md:flex-row gap-4 mt-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 print-hide">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">1</div>
          <div>
            <div className="font-bold text-slate-800">Lưu mã QR</div>
            <div className="text-sm text-slate-500 font-medium">Chụp ảnh hoặc tải mã QR này</div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">2</div>
          <div>
            <div className="font-bold text-slate-800">Tại quầy</div>
            <div className="text-sm text-slate-500 font-medium">Đến trước 30 phút khởi hành</div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">3</div>
          <div>
            <div className="font-bold text-slate-800">Lên xe</div>
            <div className="text-sm text-slate-500 font-medium">Xuất trình QR & CMND/CCCD</div>
          </div>
        </div>
      </div>
    </div>
  )
}
