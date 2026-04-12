import { useState } from 'react'
import { FiMapPin, FiClock, FiChevronDown } from 'react-icons/fi'
import './BusStopTimeline.css'

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
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM
    const duration = endMins - startMins
    if (duration === 0) return 'Tại đây'
    const hours = Math.floor(duration / 60)
    const mins = duration % 60
    if (hours === 0) return `${mins}p`
    return `${hours}h ${mins}p`
  }

  const totalDuration = calculateDuration(
    displayStops[0].departureTime,
    displayStops[displayStops.length - 1].arrivalTime
  )

  return (
    <div className="bus-stop-timeline">
      <div className="timeline-header">
        <div className="timeline-title">
          <FiMapPin size={20} className="title-icon" />
          <h3>Lộ Trình Chi Tiết</h3>
        </div>
        <div className="timeline-stats">
          <span className="stat-item">
            <FiClock size={16} />
            {totalDuration}
          </span>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-path">
          {visibleStops.length > 1 && (
            <div className="timeline-connector" style={{
              height: `calc((${visibleStops.length - 1}) * 120px + 60px)`,
              left: '24px'
            }}></div>
          )}

          {visibleStops.map((stop, index) => (
            <div key={stop.id} className="timeline-item">
              {/* Node */}
              <div className={`timeline-node ${stop.isFirst ? 'node-first' : ''} ${stop.isLast ? 'node-last' : ''}`}>
                <div className="node-inner">
                  {stop.isFirst && <span className="node-icon">🚌</span>}
                  {stop.isLast && <span className="node-icon">🏁</span>}
                  {!stop.isFirst && !stop.isLast && (
                    <span className="node-circle"></span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="timeline-content">
                <div className="stop-header">
                  <h4 className="stop-name">{stop.name}</h4>
                  <span className={`stop-badge ${stop.isFirst ? 'badge-start' : stop.isLast ? 'badge-end' : 'badge-middle'}`}>
                    {stop.isFirst ? '🚆 Điểm đầu' : stop.isLast ? '🎯 Điểm cuối' : '🛑 Dừng lại'}
                  </span>
                </div>

                <p className="stop-address">{stop.address}</p>

                <div className="stop-times">
                  <div className="time-item">
                    <span className="time-label">
                      {stop.isFirst ? '🚗 Khởi hành' : '📍 Đến'}
                    </span>
                    <span className="time-value">{stop.arrivalTime}</span>
                  </div>

                  {!stop.isFirst && (
                    <>
                      <span className="time-separator">→</span>
                      <div className="time-item">
                        <span className="time-label">
                          {stop.isLast ? '🏁 Kết thúc' : '🚗 Rời'}
                        </span>
                        <span className="time-value">{stop.departureTime}</span>
                      </div>
                    </>
                  )}
                </div>

                {stop.waitingTime && (
                  <div className="stop-duration">
                    ⏱️ Dừng {stop.waitingTime} phút
                  </div>
                )}

                {/* Show segment duration */}
                {index < visibleStops.length - 1 && (
                  <div className="segment-duration">
                    ➜ Đến điểm tiếp theo: {calculateDuration(stop.departureTime, visibleStops[index + 1].arrivalTime)}
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
          className="timeline-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          <FiChevronDown size={18} style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease'
          }} />
          {expanded ? 'Thu gọn' : `Xem thêm (${displayStops.length - 3} điểm dừng)`}
        </button>
      )}

      {/* Route Summary */}
      <div className="route-summary">
        <div className="summary-item">
          <span className="summary-label">Số điểm dừng:</span>
          <span className="summary-value">{displayStops.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Thời gian chuyến:</span>
          <span className="summary-value">{totalDuration}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tuyến đường:</span>
          <span className="summary-value">
            {displayStops[0].name} → {displayStops[displayStops.length - 1].name}
          </span>
        </div>
      </div>
    </div>
  )
}
