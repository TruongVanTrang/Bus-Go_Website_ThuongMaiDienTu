import { useState } from 'react'
import { FiX, FiStar } from 'react-icons/fi'
import './FeedbackForm.css'

export default function FeedbackForm({ isOpen, onClose, bookingId }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [uiRating, setUiRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      alert('Vui lòng chọn đánh giá tổng thể')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const feedbackData = {
        bookingId,
        overallRating: rating,
        serviceRating: serviceRating || rating,
        uiRating: uiRating || rating,
        comment,
        timestamp: new Date().toISOString()
      }

      // Store in localStorage (mock)
      const feedbacks = JSON.parse(localStorage.getItem('busgo_feedbacks') || '[]')
      feedbacks.push(feedbackData)
      localStorage.setItem('busgo_feedbacks', JSON.stringify(feedbacks))

      setIsSubmitting(false)
      setSubmitted(true)

      // Close after 2 seconds
      setTimeout(() => {
        onClose()
        setRating(0)
        setServiceRating(0)
        setUiRating(0)
        setComment('')
        setSubmitted(false)
      }, 2000)
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="feedback-header">
          <h3 className="feedback-title">Đánh giá trải nghiệm</h3>
          <button
            className="feedback-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-body">
              {/* Overall Rating */}
              <div className="feedback-section">
                <label className="feedback-label">
                  <span className="feedback-label-text">Đánh giá tổng thể</span>
                  <span className="feedback-required">*</span>
                </label>
                <div className="feedback-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`feedback-star ${
                        star <= (hoverRating || rating) ? 'active' : ''
                      }`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <FiStar size={32} />
                    </button>
                  ))}
                </div>
                <div className="feedback-rating-text">
                  {rating > 0 && (
                    <span>
                      {rating === 1 && 'Rất không hài lòng'}
                      {rating === 2 && 'Không hài lòng'}
                      {rating === 3 && 'Bình thường'}
                      {rating === 4 && 'Hài lòng'}
                      {rating === 5 && 'Rất hài lòng'}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Rating */}
              <div className="feedback-section">
                <label className="feedback-label">
                  <span className="feedback-label-text">Điểm phục vụ</span>
                </label>
                <div className="feedback-stars-small">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`feedback-star-small ${
                        star <= serviceRating ? 'active' : ''
                      }`}
                      onClick={() => setServiceRating(star)}
                    >
                      <FiStar size={20} />
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Rating */}
              <div className="feedback-section">
                <label className="feedback-label">
                  <span className="feedback-label-text">Điểm giao diện</span>
                </label>
                <div className="feedback-stars-small">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`feedback-star-small ${
                        star <= uiRating ? 'active' : ''
                      }`}
                      onClick={() => setUiRating(star)}
                    >
                      <FiStar size={20} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="feedback-section">
                <label className="feedback-label">
                  <span className="feedback-label-text">Nội dung nhận xét</span>
                </label>
                <textarea
                  className="feedback-textarea"
                  placeholder="Chia sẻ trải nghiệm của bạn với chúng tôi..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                />
                <div className="feedback-char-count">
                  {comment.length}/500 ký tự
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="feedback-footer">
              <button
                type="button"
                className="feedback-btn-cancel"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="feedback-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đánh giá'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success Message */
          <div className="feedback-success">
            <div className="feedback-success-icon">✓</div>
            <h4 className="feedback-success-title">Cảm ơn bạn!</h4>
            <p className="feedback-success-text">
              Đánh giá của bạn đã được ghi nhận. Chúng tôi sẽ tiếp tục cải thiện dịch vụ.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
