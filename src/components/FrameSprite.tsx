import { useState } from 'react'
import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'
import type { SpriteState } from '../model/scenario'

interface FrameSpriteProps {
  sprite: SpriteState | null
  /** Transition duration in ms for movement, from the player. */
  travelMs: number
  /** True only during a 'travel' step — enables the left/top slide. */
  sliding: boolean
  /** Whether to show the nested green L3 packet, or a plain payload. */
  showLayer3: boolean
  fromMac: string
  toMac: string
  fromIp?: string
  toIp?: string
}

/**
 * The single animated box: a yellow Layer 2 frame, always addressed by MAC.
 * When `showLayer3` is true, it wraps a green Layer 3 packet (addressed by
 * IP); wrapping/unwrapping is revealed via CSS so encapsulation and
 * decapsulation read as one shell opening and closing. When false, or during
 * an ARP request/reply (phase 'arp' — ARP never carries an L3 packet, even
 * in scenarios where IP addresses are otherwise shown), the frame carries a
 * plain payload placeholder instead.
 */
export function FrameSprite({
  sprite,
  travelMs,
  sliding,
  showLayer3,
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

  const framed = sprite?.phase === 'frame' || sprite?.phase === 'arp'
  const decap = sprite?.phase === 'decap'

  // ARP steps address the box themselves (request/reply travel in opposite
  // directions), overriding the Lesson-level from/to computed once for the
  // scenario's overall src→dst.
  const displayFromMac = sprite?.fromMac ?? fromMac
  const displayToMac = sprite?.toMac ?? toMac
  const boxTag = sprite?.boxTag ?? 'L2 FRAME'
  const payloadText = sprite?.payloadText ?? 'Payload'

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
          <span className="box-tag">{boxTag}</span>
          <span className="addr">
            FROM <b>{displayFromMac}</b>
          </span>
          <span className="addr to-mac">
            TO <b>{displayToMac}</b>
          </span>
        </div>

        {showLayer3 && !!sprite && sprite.phase !== 'arp' ? (
          // Green Layer 3 packet — the payload inside.
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
        ) : (
          // No packet at this point in the storyboard — just an opaque
          // payload, addressed only by the frame's MAC headers above.
          <div className="frame-payload">{payloadText}</div>
        )}
      </div>
    </div>
  )
}
