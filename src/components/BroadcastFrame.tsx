import { useEffect, useState } from 'react'
import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'

interface BroadcastFrameProps {
  /** Device id this clone starts from (e.g. the switch, right after flooding). */
  originId: string
  /** Device id this clone travels to and sits at. */
  atId: string
  fromMac: string
  toMac: string
  boxTag: string
  payloadText: string
  /** Transition duration in ms for the initial travel, from the player. */
  travelMs: number
  /** True to show this clone discarding the frame: gray, drop, fade. */
  dropped?: boolean
  /** True to call out that this clone's device is the one the request is for. */
  matched?: boolean
}

/**
 * One cloned copy of a broadcast frame: mounts at `originId` and transitions
 * to `atId` shortly after, so several instances rendered together fan a
 * single frame out to many devices at once — something the singleton
 * FrameSprite can't do, since it only models one box in one place.
 */
export function BroadcastFrame({
  originId,
  atId,
  fromMac,
  toMac,
  boxTag,
  payloadText,
  travelMs,
  dropped,
  matched,
}: BroadcastFrameProps) {
  const [pos, setPos] = useState(originId)

  useEffect(() => {
    const t = setTimeout(() => setPos(atId), 40)
    return () => clearTimeout(t)
  }, [atId])

  const { x, y } = getDevice(pos).pos
  const left = `${(x / STAGE_WIDTH) * 100}%`
  const top = `${(y / STAGE_HEIGHT) * 100}%`

  const classes = [
    'broadcast-frame',
    dropped ? 'is-dropped' : '',
    matched ? 'is-matched' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ left, top, ['--travel-ms' as string]: `${travelMs}ms` }}
      aria-hidden
    >
      <div className="box-header">
        <span className="box-tag">{boxTag}</span>
        <span className="addr">
          FROM <b>{fromMac}</b>
        </span>
        <span className="addr">
          TO <b>{toMac}</b>
        </span>
      </div>
      <div className="frame-payload">{payloadText}</div>
    </div>
  )
}
