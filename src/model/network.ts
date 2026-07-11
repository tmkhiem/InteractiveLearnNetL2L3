// Network topology data model.
//
// Kept deliberately small and declarative so later lessons (ARP tables,
// routing tables, external networks) can extend it without reshaping the
// foundation. Coordinates are in "stage units" — an abstract 1000 x 600
// canvas that Stage.tsx scales responsively.

export type DeviceKind = 'pc' | 'switch' | 'router'

export interface Point {
  x: number
  y: number
}

export interface Nic {
  id: string
  /** Learner-friendly, non-standard MAC (e.g. "AA:AA:AA"). */
  mac: string
  /** Present once Layer 3 is relevant. */
  ip?: string
  /** Interface name shown on router NICs, e.g. "eth0". */
  ifname?: string
  /** True for a WAN-facing NIC (dimmed; not used until the routing lesson). */
  external?: boolean
}

export interface Device {
  id: string
  kind: DeviceKind
  name: string
  /** Center position on the stage canvas. */
  pos: Point
  nics: Nic[]
}

export interface Link {
  id: string
  /** Device id of endpoint A. */
  a: string
  /** Device id of endpoint B. */
  b: string
}

export interface Topology {
  devices: Device[]
  links: Link[]
  /** The shared local network CIDR, surfaced in narration. */
  localNetwork: string
}

export const STAGE_WIDTH = 1000
export const STAGE_HEIGHT = 600

// --- The foundation topology -------------------------------------------------
// Three PCs on one switch, plus a router with a LAN + WAN NIC. The WAN side and
// the "Internet" are drawn but dimmed: Layer 3 routing is a later lesson.

export const topology: Topology = {
  localNetwork: '10.0.0.0/24',
  devices: [
    {
      id: 'pc-a',
      kind: 'pc',
      name: 'PC-A',
      pos: { x: 180, y: 470 },
      nics: [{ id: 'pc-a-nic', mac: 'AA:AA:AA', ip: '10.0.0.1' }],
    },
    {
      id: 'pc-b',
      kind: 'pc',
      name: 'PC-B',
      pos: { x: 500, y: 470 },
      nics: [{ id: 'pc-b-nic', mac: 'BB:BB:BB', ip: '10.0.0.2' }],
    },
    {
      id: 'pc-c',
      kind: 'pc',
      name: 'PC-C',
      pos: { x: 820, y: 470 },
      nics: [{ id: 'pc-c-nic', mac: 'CC:CC:CC', ip: '10.0.0.3' }],
    },
    {
      id: 'sw1',
      kind: 'switch',
      name: 'SW1',
      pos: { x: 500, y: 270 },
      nics: [], // A switch is transparent at L2 for this lesson.
    },
    {
      id: 'r1',
      kind: 'router',
      name: 'R1',
      // Positioned right of PC-C and above the LAN, so its card straddles the
      // local-network boundary: eth0 (left half) sits inside, eth1 (right
      // half) sits outside — see the .lan-region rect below.
      pos: { x: 910, y: 190 },
      nics: [
        { id: 'r1-lan', ifname: 'eth0', mac: 'RR:RR:R0', ip: '10.0.0.254' },
        {
          id: 'r1-wan',
          ifname: 'eth1',
          mac: 'RR:RR:R1',
          ip: '203.0.113.1',
          external: true,
        },
      ],
    },
  ],
  links: [
    { id: 'l-a', a: 'pc-a', b: 'sw1' },
    { id: 'l-b', a: 'pc-b', b: 'sw1' },
    { id: 'l-c', a: 'pc-c', b: 'sw1' },
    { id: 'l-r', a: 'sw1', b: 'r1' },
  ],
}

// --- Lookups -----------------------------------------------------------------

export function getDevice(id: string): Device {
  const d = topology.devices.find((dev) => dev.id === id)
  if (!d) throw new Error(`Unknown device: ${id}`)
  return d
}

/** The PCs a learner can pick as sender/receiver, in display order. */
export const pcs: Device[] = topology.devices.filter((d) => d.kind === 'pc')

/**
 * Devices a learner can pick as sender/receiver: the PCs plus the router
 * (identified by its eth0/LAN NIC, which is a regular member of the local
 * network — the switch itself has no L3 identity, so it's excluded).
 */
export const endpoints: Device[] = topology.devices.filter(
  (d) => d.kind !== 'switch',
)

/** Primary NIC helper — the PCs' one NIC, or the router's eth0 (LAN) side. */
export function primaryNic(deviceId: string): Nic {
  const d = getDevice(deviceId)
  if (!d.nics[0]) throw new Error(`Device ${deviceId} has no NIC`)
  return d.nics[0]
}
