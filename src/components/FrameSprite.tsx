import { useState } from 'react'
import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'
import type { SpriteState } from '../model/scenario'

interface FrameSpriteProps {
  sprite: SpriteState | null
  /** Transition duration in ms for movement, from the player. */
  travelMs: number
  /** True only during a 'travel' step — enables the left/top slide. */
  sliding: boolean
  fromMac: string
  toMac: string
  fromIp: string
  toIp: string
}

/**
 * The single animated box. The green Layer 3 packet is always in the DOM; the
 * yellow Layer 2 frame wraps around it and is revealed/hidden via CSS so that
 * encapsulation and decapsulation read as one shell opening and closing.
 */
export function FrameSprite({
  sprite,
  travelMs,
  sliding,
  fromMac,
  toMac,
  fromIp,
  toIp,
}: FrameSpriteProps) {
  // Anchor to the current device. When hidden (sprite null, e.g. the final
  // callout step), keep rendering at the last real position instead of
  // snapping to a hardcoded default — otherwise the box would flash there
  // while its opacity fades out. Plain state (not a ref) so the read during
  // render stays compiler-safe; this is the standard "derive state from a
  // changed prop, during render" pattern.
  const [lastAnchorId, setLastAnchorId] = useState(sprite?.at ?? 'sw1')
  if (sprite && sprite.at !== lastAnchorId) {
    setLastAnchorId(sprite.at)
  }
  const anchorId = sprite?.at ?? lastAnchorId
  const pos = getDevice(anchorId).pos
  const left = `${(pos.x / STAGE_WIDTH) * 100}%`
  const top = `${(pos.y / STAGE_HEIGHT) * 100}%`

  const framed = sprite?.phase === 'frame'
  const decap = sprite?.phase === 'decap'

  const classes = [
    'frame-sprite',
    sprite ? 'is-visible' : 'is-hidden',
    framed ? 'is-framed' : '',
    decap ? 'is-decap' : '',
    sprite?.highlightTo ? 'highlight-to' : '',
    // Only a 'travel' step slides between devices; every other step (create,
    // encap, inspect, decap, deliver) should snap to position and only
    // animate its opacity/box styling — e.g. step 1 must fade in at the
    // source PC, not slide in from wherever the sprite was last parked.
    sliding ? 'is-sliding' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ left, top, ['--travel-ms' as string]: `${travelMs}ms` }}
      aria-hidden={!sprite}
    >
      {/* Yellow Layer 2 frame — the outer shell. */}
      <div className="l2-frame">
        <div className="box-header">
          <span className="box-tag">L2 FRAME</span>
          <span className="addr">
            FROM <b>{fromMac}</b>
          </span>
          <span className="addr to-mac">
            TO <b>{toMac}</b>
          </span>
        </div>

        {/* Green Layer 3 packet — the payload inside. */}
        <div className="l3-packet">
          <div className="box-header">
            <span className="box-tag">L3 PACKET</span>
            <span className="addr">
              FROM <b>{fromIp}</b>
            </span>
            <span className="addr">
              TO <b>{toIp}</b>
            </span>
          </div>
          <div className="packet-payload">App data</div>
        </div>
      </div>
    </div>
  )
}
