import { useMemo } from 'react'
import { primaryNic } from '../model/network'
import { buildL2Scenario } from '../model/scenario'
import { usePlayer } from '../hooks/usePlayer'
import { Stage } from './Stage'
import { NarrationPanel } from './NarrationPanel'
import { Controls } from './Controls'

interface LessonProps {
  srcId: string
  dstId: string
  onSrc: (id: string) => void
  onDst: (id: string) => void
  /** Whether the stage has faded in (owned by App so it happens once). */
  revealed: boolean
}

/**
 * One run of the Layer 2 delivery lesson. Mounted with a key of
 * `${srcId}-${dstId}`, so picking a new sender/receiver remounts it and the
 * player state resets cleanly — no manual reset logic required.
 */
export function Lesson({ srcId, dstId, onSrc, onDst, revealed }: LessonProps) {
  const scenario = useMemo(() => buildL2Scenario(srcId, dstId), [srcId, dstId])
  const player = usePlayer(scenario)

  const currentStep = player.index >= 0 ? scenario.steps[player.index] : null

  const srcNic = primaryNic(srcId)
  const dstNic = primaryNic(dstId)
  const frameLabels = {
    fromMac: srcNic.mac,
    toMac: dstNic.mac,
    fromIp: srcNic.ip ?? '',
    toIp: dstNic.ip ?? '',
  }

  return (
    <>
      <main className="app-main">
        <Stage
          srcId={srcId}
          dstId={dstId}
          activeDevice={currentStep?.activeDevice}
          sprite={currentStep?.sprite ?? null}
          travelMs={player.currentDuration || 600}
          sliding={currentStep?.kind === 'travel'}
          frameLabels={frameLabels}
          revealed={revealed}
        />
      </main>

      <NarrationPanel
        step={currentStep}
        stepNumber={player.index + 1}
        totalSteps={scenario.steps.length}
      />

      <Controls
        srcId={srcId}
        dstId={dstId}
        onSrc={onSrc}
        onDst={onDst}
        player={player}
      />
    </>
  )
}
