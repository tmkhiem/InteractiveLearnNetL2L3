import { endpoints } from '../model/network'
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
}: ControlsProps) {
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
            {endpoints.map((d) => (
              <option key={d.id} value={d.id} disabled={d.id === dstId}>
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
            {endpoints.map((d) => (
              <option key={d.id} value={d.id} disabled={d.id === srcId}>
                {d.name}
              </option>
            ))}
          </select>
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
