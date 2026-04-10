import './Stepper.css'

export default function Stepper({ currentStep, steps }) {
  return (
    <div className="stepper-container">
      <div className="stepper-wrapper">
        {steps.map((step, index) => (
          <div key={index} className="stepper-item">
            {/* Step Circle */}
            <div
              className={`stepper-circle ${
                index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'
              }`}
            >
              {index < currentStep ? (
                <span className="stepper-icon">✓</span>
              ) : (
                <span className="stepper-number">{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <div className="stepper-label">
              <div className="stepper-title">{step.title}</div>
              <div className="stepper-description">{step.description}</div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`stepper-line ${index < currentStep ? 'completed' : 'pending'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
