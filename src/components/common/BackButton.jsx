import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import './BackButton.css'

export default function BackButton({ label = 'Quay lại', className = '' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <button
      onClick={handleBack}
      className={`back-button ${className}`}
      title="Quay lại trang trước"
    >
      <FiArrowLeft size={18} />
      <span>{label}</span>
    </button>
  )
}
