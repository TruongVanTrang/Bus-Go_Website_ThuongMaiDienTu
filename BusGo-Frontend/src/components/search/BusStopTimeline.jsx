import { useState } from 'react'
import { FiMapPin, FiClock, FiChevronDown } from 'react-icons/fi'

export default function BusStopTimeline({ stops = [] }) {
  const [expanded, setExpanded] = useState(false)

  // Mock data if no stops provided
  const mockStops = [
    {
      id: 1,
      name: 'Sài Gòn (Bến Tây)',
      address: 'An Sương, Quận 12, TP. Hồ Chí Minh',
      arrivalTime: '06:00',
      departureTime: '06:00',
      isFirst: true,
      isLast: false,
      waitingTime: null
    },
    {
      id: 2,
      name: 'Trạm Dừng Miền Tây',
      address: 'Quốc lộ 1, Quận 8, TP. Hồ Chí Minh',
      arrivalTime: '06:20',
      departureTime: '06:25',
      isFirst: false,
      isLast: false,
      waitingTime: 5
    },
    {
      id: 3,
      name: 'Trạm Dừng Bến Lức',
      address: 'Thị trấn Bến Lức, Long An',
      arrivalTime: '06:50',
      departureTime: '07:00',
      isFirst: false,
      isLast: false,
      waitingTime: 10
    },
    {
      id: 4,
      name: 'Trạm Dừng Tân Phú',
      address: 'Thị xã Tân An, Long An',
      arrivalTime: '07:35',
      departureTime: '07:40',
      isFirst: false,
      isLast: false,
      waitingTime: 5
    },
    {
      id: 5,
      name: 'Cần Thơ',
      address: 'Bến Tây Ngô, Ninh Kiều, Cần Thơ',
      arrivalTime: '09:30',
      departureTime: '09:30',
      isFirst: false,
      isLast: true,
      waitingTime: null
    }
  ]

  const displayStops = stops.length > 0 ? stops : mockStops
  const visibleStops = expanded ? displayStops : displayStops.slice(0, 3)
  const hasHiddenStops = displayStops.length > 3

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Không rõ'
    try {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const startMins = startH * 60 + startM
      let endMins = endH * 60 + endM
      if (endMins < startMins) endMins += 24 * 60 // Qua ngày
      
      const duration = endMins - startMins
      if (duration === 0) return 'Tại đây'
      
      const hours = Math.floor(duration / 60)
      const mins = duration % 60
      if (hours === 0) return `${mins}p`
      return `${hours}h ${mins}p`
    } catch {
      return ''
    }
  }

  const totalDuration = displayStops[0]?.departureTime && displayStops[displayStops.length - 1]?.arrivalTime
    ? calculateDuration(displayStops[0].departureTime, displayStops[displayStops.length - 1].arrivalTime)
    : ''

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMapPin className="text-blue-500 text-lg" />
          <h3 className="font-bold text-slate-800 text-sm">Lộ Trình Chi Tiết</h3>
        </div>
        {totalDuration && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            <FiClock size={14} />
            {totalDuration}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-5 relative">
        <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

        <div className="space-y-6">
          {visibleStops.map((stop, index) => (
            <div key={stop.id || index} className="relative flex gap-4 items-start group">
              
              {/* Node */}
              <div className="relative z-10 w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center">
                {stop.isFirst || index === 0 ? (
                  <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                ) : stop.isLast || index === displayStops.length - 1 ? (
                  <div className="w-5 h-5 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-400 transition-colors"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{stop.name}</h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                    (stop.isFirst || index === 0) ? 'bg-blue-50 text-blue-600' :
                    (stop.isLast || index === displayStops.length - 1) ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {(stop.isFirst || index === 0) ? 'Điểm đầu' : (stop.isLast || index === displayStops.length - 1) ? 'Điểm cuối' : 'Dừng lại'}
                  </span>
                </div>
                
                {stop.address && <p className="text-xs text-slate-500 mb-2">{stop.address}</p>}

                <div className="flex items-center gap-3 text-xs font-semibold bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 w-fit">
                  <div className="text-slate-600">
                    <span className="text-slate-400 mr-1.5">Đến</span>
                    {stop.arrivalTime || stop.time}
                  </div>
                  
                  {!(stop.isLast || index === displayStops.length - 1) && stop.departureTime && (
                    <>
                      <span className="text-slate-300">→</span>
                      <div className="text-slate-600">
                        <span className="text-slate-400 mr-1.5">Rời</span>
                        {stop.departureTime}
                      </div>
                    </>
                  )}
                </div>

                {/* Show segment duration to next stop if we can */}
                {index < visibleStops.length - 1 && visibleStops[index + 1]?.arrivalTime && stop.departureTime && (
                  <div className="mt-3 mb-1 ml-2 border-l-2 border-dashed border-slate-200 pl-3">
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      ~ {calculateDuration(stop.departureTime, visibleStops[index + 1].arrivalTime)} di chuyển
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {hasHiddenStops && (
        <button
          className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Thu gọn lộ trình' : `Xem thêm ${displayStops.length - 3} điểm dừng`}
          <FiChevronDown className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

    </div>
  )
}
