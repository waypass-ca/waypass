export function ProgressTrack({ steps, currentStep }) {
  return (
    <div className="w-full">
      {/* Nodes + connectors row */}
      <div className="flex items-center">
        {steps.map((label, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep

          const nodeClass = isDone
            ? 'w-5 h-5 rounded-full bg-sage flex items-center justify-center flex-shrink-0'
            : isActive
            ? 'w-5 h-5 rounded-full bg-charcoal flex-shrink-0'
            : 'w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex-shrink-0'

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className={nodeClass}>
                {isDone && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {/* Connector line — rendered after each node except last */}
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-sage' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      {/* Labels row */}
      <div className="flex mt-2">
        {steps.map((label, i) => (
          <div
            key={i}
            className={`flex-1 last:flex-none text-left text-xs font-sans ${
              i < currentStep
                ? 'text-sage'
                : i === currentStep
                ? 'text-charcoal font-medium'
                : 'text-muted'
            }`}
            style={{ minWidth: 0 }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
