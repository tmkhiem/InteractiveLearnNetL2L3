import { useRef, useState } from 'react'
import {
  getDevice,
  neighborsOf,
  routerNicForSwitch,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  topology,
} from '../model/network'
import type {
  ArpTableView,
  BroadcastStep,
  DnsCacheView,
  RoutingTableView,
  SpriteState,
} from '../model/scenario'
import { ArpTable } from './ArpTable'
import { BroadcastFrame } from './BroadcastFrame'
import { DeviceCard } from './DeviceCard'
import { DnsCache } from './DnsCache'
import { FrameSprite } from './FrameSprite'
import { RoutingTable } from './RoutingTable'

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
  /** Routing table to show for the current step, or null to hide it. */
  routingTable: RoutingTableView | null
  /** DNS cache to show for the current step, or null to hide it. */
  dnsCache: DnsCacheView | null
  /** Broadcast fan-out to show for the current step, or null to hide it. */
  broadcast: BroadcastStep | null
  /** Fade the whole topology in on mount. */
  revealed: boolean
  /** Whether subnets 2 and 3 (and r1's eth1/eth2) are drawn at all. */
  showOtherSubnets: boolean
  /** Whether the DNS Server device is drawn (only for DNS scenarios). */
  showDnsServer: boolean
}

// r1's card is the same size as a PC/switch card (132px wide — see
// .device-card in App.css; its NIC breakdown now lives on the links instead
// of on the card, so there's nothing router-specific widening it). Height is
// a generous approximation — a few px of slack just means the line starts a
// hair inside or outside the card, which the card itself paints over anyway.
const R1_HALF_WIDTH = 66
const R1_HALF_HEIGHT = 48

/** How far along the link (0 = at r1's border, 1 = at the switch) the NIC label sits. */
const LABEL_T = 0.3

/** Where a straight ray from `center` toward `target` exits a centered rectangle. */
function rectBorderPoint(
  center: { x: number; y: number },
  halfWidth: number,
  halfHeight: number,
  target: { x: number; y: number },
) {
  const dx = target.x - center.x
  const dy = target.y - center.y
  if (dx === 0 && dy === 0) return { ...center }
  const scale = Math.min(
    dx !== 0 ? halfWidth / Math.abs(dx) : Infinity,
    dy !== 0 ? halfHeight / Math.abs(dy) : Infinity,
  )
  return { x: center.x + dx * scale, y: center.y + dy * scale }
}

function lerp(p0: { x: number; y: number }, p1: { x: number; y: number }, t: number) {
  return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t }
}

/** How far beyond the viewport's edge the canvas can be dragged, as a
 * fraction of the viewport's own size — generous enough to reach any corner
 * of the diagram (or an off-screen table) from any starting focus point. */
const PAN_CLAMP_FRACTION = 0.85

function clampPan(
  pan: { x: number; y: number },
  viewport: { width: number; height: number },
) {
  const maxX = viewport.width * PAN_CLAMP_FRACTION
  const maxY = viewport.height * PAN_CLAMP_FRACTION
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  }
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
  routingTable,
  dnsCache,
  broadcast,
  revealed,
  showOtherSubnets,
  showDnsServer,
}: StageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startPan: { x: number; y: number }
  } | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Capture so the drag keeps tracking even if the pointer leaves the
    // element mid-move; if the browser won't capture this pointer for some
    // reason, dragging still works via normal event bubbling.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignored — see above
    }
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startPan: pan }
    setIsDragging(true)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const rect = viewportRef.current?.getBoundingClientRect()
    const next = {
      x: drag.startPan.x + (e.clientX - drag.startX),
      y: drag.startPan.y + (e.clientY - drag.startY),
    }
    setPan(rect ? clampPan(next, rect) : next)
  }
  const endDrag = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  // Subnets 2 and 3 (and r1's NICs onto them) are hidden by default — the
  // four subnet-1-only lessons have no use for them, and showing 9 PCs when
  // only 3 are relevant just adds clutter. The routing lesson always passes
  // showOtherSubnets=true (see Lesson.tsx).
  const visibleSubnets = topology.subnets.filter(
    (s) => s.switchId === 'sw1' || showOtherSubnets,
  )
  const visibleSubnetCidrs = new Set(visibleSubnets.map((s) => s.cidr))
  const hiddenDeviceIds = new Set(
    topology.subnets
      .filter((s) => !visibleSubnetCidrs.has(s.cidr))
      .flatMap((s) => [
        s.switchId,
        ...neighborsOf(s.switchId).filter((d) => d.kind === 'pc').map((d) => d.id),
      ]),
  )
  // The DNS Server sits in subnet 1 (always visible) but is only relevant to
  // DNS scenarios — hide it everywhere else so it doesn't clutter the diagram.
  if (!showDnsServer) hiddenDeviceIds.add('dns-srv')
  const visibleDevices = topology.devices
    .filter((d) => !hiddenDeviceIds.has(d.id))
    .map((d) =>
      d.id === 'r1'
        ? {
            ...d,
            nics: d.nics.filter((n) => {
              const subnet = topology.subnets.find((s) => s.routerNicId === n.id)
              return !subnet || visibleSubnetCidrs.has(subnet.cidr)
            }),
          }
        : d,
    )
  const visibleLinks = topology.links.filter(
    (l) => !hiddenDeviceIds.has(l.a) && !hiddenDeviceIds.has(l.b),
  )
  const plainLinks = visibleLinks.filter((l) => l.a !== 'r1' && l.b !== 'r1')

  // r1-switch links are straight, starting at the point where each one exits
  // r1's card border (not r1's center) — so the 3 links visibly separate
  // right from the router's edge instead of overlapping under its card.
  const r1Pos = getDevice('r1').pos
  const routerLinks = visibleLinks
    .filter((l) => l.a === 'r1' || l.b === 'r1')
    .map((l) => {
      const switchId = l.a === 'r1' ? l.b : l.a
      const switchDevice = getDevice(switchId)
      const p2 = switchDevice.pos
      const border = rectBorderPoint(r1Pos, R1_HALF_WIDTH, R1_HALF_HEIGHT, p2)
      return {
        id: l.id,
        nic: routerNicForSwitch(switchId),
        path: `M ${border.x} ${border.y} L ${p2.x} ${p2.y}`,
        labelPoint: lerp(border, p2, LABEL_T),
      }
    })

  // One shaded region per visible subnet, bounding its switch and PCs with
  // generous padding on their outward side, then extended — on whichever
  // edge actually faces the router — to reach exactly r1's center. Since
  // that stopping point is shared, each region only reaches the one quadrant
  // of r1 it's actually responsible for (e.g. subnet 1 stops at r1's
  // vertical center, so it only overlaps r1's upper half) and never crosses
  // into another subnet's region.
  const PAD_X = 110
  const PAD_TOP = 90
  const PAD_BOTTOM = 90
  const regions = visibleSubnets.map((subnet) => {
    const switchDevice = getDevice(subnet.switchId)
    const members = [
      switchDevice,
      ...neighborsOf(subnet.switchId).filter(
        (d) => d.kind === 'pc' && !hiddenDeviceIds.has(d.id),
      ),
    ]
    const xs = members.map((d) => d.pos.x)
    const ys = members.map((d) => d.pos.y)
    const x0 = Math.min(Math.min(...xs) - PAD_X, r1Pos.x)
    const y0 = Math.min(Math.min(...ys) - PAD_TOP, r1Pos.y)
    const x1 = Math.max(Math.max(...xs) + PAD_X, r1Pos.x)
    const y1 = Math.max(Math.max(...ys) + PAD_BOTTOM, r1Pos.y)
    return {
      cidr: subnet.cidr,
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
    }
  })

  return (
    <div
      ref={viewportRef}
      className={`stage ${revealed ? 'is-revealed' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
    <div
      className={`stage-canvas ${isDragging ? '' : 'is-animated'}`}
      style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
    >
      <svg
        className="links"
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Shaded region per subnet: its switch and PCs. */}
        {regions.map((region) => (
          <rect
            key={region.cidr}
            className="lan-region"
            x={region.x}
            y={region.y}
            width={region.width}
            height={region.height}
            rx="24"
          />
        ))}

        {/* PC-switch links: drawn straight. */}
        {plainLinks.map((link) => {
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

        {/* r1-switch links: straight, from r1's border (see routerLinks above). */}
        {routerLinks.map(({ id, path }) => (
          <path key={id} className="link" fill="none" d={path} />
        ))}
      </svg>

      {regions.map((region) => {
        // Each region stretches inward to r1's center, so its top-INNER corner
        // sits right on the router. Anchor the label on the OUTER horizontal
        // side (away from r1) so it never lands on R1's card. Regions centered
        // above r1 (subnet 1) fall through to the left/default anchor.
        const anchorRight = region.x + region.width / 2 > r1Pos.x + 1
        const anchorX = anchorRight ? region.x + region.width : region.x
        return (
          <div
            key={region.cidr}
            className={`lan-tag ${anchorRight ? 'lan-tag-right' : ''}`}
            style={{
              left: `${(anchorX / STAGE_WIDTH) * 100}%`,
              top: `${(region.y / STAGE_HEIGHT) * 100}%`,
            }}
          >
            {showLayer3 ? region.cidr : 'Local network'}
          </div>
        )
      })}

      {/* r1 NIC labels, positioned on top of their link so it's clear which
          physical link each interface belongs to. */}
      {routerLinks.map(({ id, nic, labelPoint }) => (
        <div
          key={id}
          className="nic-link-label"
          style={{
            left: `${(labelPoint.x / STAGE_WIDTH) * 100}%`,
            top: `${(labelPoint.y / STAGE_HEIGHT) * 100}%`,
          }}
        >
          <div className="nic-link-label-line">
            {nic.ifname} · {nic.mac}
          </div>
          {showLayer3 && <div className="nic-link-label-line">{nic.ip}</div>}
        </div>
      ))}

      {visibleDevices.map((device) => {
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
      <RoutingTable view={routingTable} />
      <DnsCache view={dnsCache} />
    </div>
    </div>
  )
}
