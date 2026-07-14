import {
  routablePcs,
  subnet1Endpoints,
  subnet1Pcs,
  subnetOf,
} from '../model/network'
import { scenarios } from '../model/scenario'
import type { Player, Speed } from '../hooks/usePlayer'

interface ControlsProps {
  scenarioId: string
  onScenario: (id: string) => void
  srcId: string
  dstId: string
  onSrc: (id: string) => void
  onDst: (id: string) => void
  player: Player
  showOtherSubnets: boolean
  onToggleOtherSubnets: (value: boolean) => void
  showHeader: boolean
  onToggleHeader: (value: boolean) => void
}

const SPEEDS: Speed[] = ['slow', 'normal', 'fast']

export function Controls({
  scenarioId,
  onScenario,
  srcId,
  dstId,
  onSrc,
  onDst,
  player,
  showOtherSubnets,
  onToggleOtherSubnets,
  showHeader,
  onToggleHeader,
}: ControlsProps) {
  const scenarioDef = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]
  const defaultPool = scenarioDef.crossSubnet ? routablePcs : subnet1Endpoints
  // DNS scenarios: sender is a local subnet-1 PC; receiver can be any PC
  // (local or on another subnet).
  const senderPool = scenarioDef.usesDns ? subnet1Pcs : defaultPool
  const receiverPool = scenarioDef.usesDns ? routablePcs : defaultPool
  const conflicts = (aId: string, bId: string) =>
    scenarioDef.crossSubnet && subnetOf(aId).cidr === subnetOf(bId).cidr

  return (
    <div className="controls">
      <div className="picker-group">
        <label className="picker">
          <span>Scenario</span>
          <select
            value={scenarioId}
            onChange={(e) => onScenario(e.target.value)}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="picker">
          <span>Sender</span>
          <select value={srcId} onChange={(e) => onSrc(e.target.value)}>
            {senderPool.map((d) => (
              <option
                key={d.id}
                value={d.id}
                disabled={d.id === dstId || conflicts(d.id, dstId)}
              >
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <span className="picker-arrow" aria-hidden>
          →
        </span>

        <label className="picker">
          <span>Receiver</span>
          <select value={dstId} onChange={(e) => onDst(e.target.value)}>
            {receiverPool.map((d) => (
              <option
                key={d.id}
                value={d.id}
                disabled={d.id === srcId || conflicts(d.id, srcId)}
              >
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="picker toggle" title={scenarioDef.crossSubnet || scenarioDef.usesDns ? 'Always shown for this lesson' : undefined}>
          <input
            type="checkbox"
            checked={!!scenarioDef.crossSubnet || !!scenarioDef.usesDns || showOtherSubnets}
            disabled={!!scenarioDef.crossSubnet || !!scenarioDef.usesDns}
            onChange={(e) => onToggleOtherSubnets(e.target.checked)}
          />
          <span>Show other subnets</span>
        </label>

        <label className="picker toggle">
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => onToggleHeader(e.target.checked)}
          />
          <span>Show app header</span>
        </label>
      </div>

      <div className="button-group">
        {player.isPlaying ? (
          <button type="button" onClick={player.pause}>
            Pause
          </button>
        ) : (
          <button type="button" className="primary" onClick={player.play}>
            {player.isFinished ? 'Replay' : 'Play'}
          </button>
        )}
        <button
          type="button"
          onClick={player.step}
          disabled={player.isFinished}
        >
          Step
        </button>
        <button type="button" onClick={player.reset}>
          Reset
        </button>
      </div>

      <div className="speed-group" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={player.speed === s ? 'is-selected' : ''}
            onClick={() => player.setSpeed(s)}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
