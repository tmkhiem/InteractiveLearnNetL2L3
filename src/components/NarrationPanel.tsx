import type { Step } from '../model/scenario'

interface NarrationPanelProps {
  step: Step | null
  stepNumber: number
  totalSteps: number
}

export function NarrationPanel({
  step,
  stepNumber,
  totalSteps,
}: NarrationPanelProps) {
  if (!step) {
    return (
      <div className="narration">
        <p className="narration-idle">
          Pick a sender and a receiver, then press <b>Play</b> to watch a Layer 2
          frame carry a packet across the network.
        </p>
      </div>
    )
  }

  return (
    <div className={`narration ${step.realization ? 'is-realization' : ''}`}>
      <div className="narration-meta">
        {step.realization ? 'Key idea' : `Step ${stepNumber} of ${totalSteps}`}
      </div>
      <p className="narration-main">{step.narration}</p>
      {step.detail && <p className="narration-detail">{step.detail}</p>}
    </div>
  )
}
