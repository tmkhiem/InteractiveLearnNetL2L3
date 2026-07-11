import {
  getDevice,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  topology,
} from '../model/network'
import type { ArpTableView, BroadcastStep, SpriteState } from '../model/scenario'
import { ArpTable } from './ArpTable'
import { BroadcastFrame } from './BroadcastFrame'
import { DeviceCard } from './DeviceCard'
import { FrameSprite } from './FrameSprite'

interface StageProps {
  srcId: string
  dstId: string
  activeDevice?: string
  sprite: SpriteState | null
  travelMs: number
  /** True only during a 'travel' step — enables the sprite's slide. */
  sliding: boolean
  /** Whether the active scenario surfaces IP addressing at all. */
  showLayer3: boolean
  frameLabels: { fromMac: string; toMac: string; fromIp: string; toIp: string }
  /** ARP table to show for the current step, or null to hide it. */
  arpTable: ArpTableView | null
  /** Broadcast fan-out to show for the current step, or null to hide it. */
  broadcast: BroadcastStep | null
  /** Fade the whole topology in on mount. */
  revealed: boolean
}

export function Stage({
  srcId,
  dstId,
  activeDevice,
  sprite,
  travelMs,
  sliding,
  showLayer3,
  frameLabels,
  arpTable,
  broadcast,
  revealed,
}: StageProps) {
  const router = getDevice('r1')
  // WAN link stub coordinates (router -> off-canvas Internet cloud), level
  // with the router and just right of its eth1 (WAN) side.
  const cloud = { x: 985, y: router.pos.y }

  return (
    <div className={`stage ${revealed ? 'is-revealed' : ''}`}>
      <svg
        className="links"
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Shaded local network region: all 3 PCs, the switch, and the
            router's eth0 (LAN) side. The right edge sits exactly at the
            router's center, so the card's left (eth0) half falls inside and
            its right (eth1) half falls outside. */}
        <rect
          className="lan-region"
          x="60"
          y="90"
          width={router.pos.x - 60}
          height="470"
          rx="24"
        />

        {/* All wired links here are local (PC-switch, switch-router/eth0) and
            drawn the same solid style; only the router's WAN stub below is
            external and dashed. */}
        {topology.links.map((link) => {
          const a = getDevice(link.a).pos
          const b = getDevice(link.b).pos
          return (
            <line
              key={link.id}
              className="link"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          )
        })}

        {/* Dimmed WAN stub toward the Internet (not used this lesson). */}
        <line
          className="link link-external"
          x1={router.pos.x}
          y1={router.pos.y}
          x2={cloud.x}
          y2={cloud.y}
        />
      </svg>

      <div className="lan-tag">
        Local network{showLayer3 ? ` · ${topology.localNetwork}` : ''}
      </div>

      <div
        className="cloud"
        style={{
          left: `${(cloud.x / STAGE_WIDTH) * 100}%`,
          top: `${(cloud.y / STAGE_HEIGHT) * 100}%`,
        }}
      >
        Internet
      </div>

      {topology.devices.map((device) => {
        const role =
          device.id === srcId ? 'src' : device.id === dstId ? 'dst' : null
        return (
          <DeviceCard
            key={device.id}
            device={device}
            role={role}
            active={device.id === activeDevice}
            showLayer3={showLayer3}
          />
        )
      })}

      <FrameSprite
        sprite={sprite}
        travelMs={travelMs}
        sliding={sliding}
        showLayer3={showLayer3}
        {...frameLabels}
      />

      {broadcast?.clones.map((clone) => (
        <BroadcastFrame
          key={clone.at}
          originId={broadcast.originId}
          atId={clone.at}
          fromMac={broadcast.fromMac}
          toMac={broadcast.toMac}
          boxTag={broadcast.boxTag}
          payloadText={broadcast.payloadText}
          travelMs={travelMs}
          dropped={clone.dropped}
          matched={clone.matched}
        />
      ))}

      <ArpTable view={arpTable} />
    </div>
  )
}
