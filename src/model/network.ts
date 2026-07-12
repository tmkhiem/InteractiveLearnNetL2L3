// Network topology data model.
//
// Kept deliberately small and declarative so later lessons (ARP tables,
// routing tables, external networks) can extend it without reshaping the
// foundation. Coordinates are in "stage units" — an abstract 1180 x 1180
// canvas that Stage.tsx scales responsively. Desktop-only: no mobile layout
// is maintained.

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

export interface Subnet {
  cidr: string
  switchId: string
  /** The r1 Nic.id serving this subnet. */
  routerNicId: string
}

export interface Topology {
  devices: Device[]
  links: Link[]
  /** The shared local network CIDR, surfaced in narration. */
  localNetwork: string
  /** Every subnet r1 routes between, used by the routing scenario and Stage. */
  subnets: Subnet[]
}

export const STAGE_WIDTH = 1657
export const STAGE_HEIGHT = 1495

// --- The foundation topology -------------------------------------------------
// Three subnets, each with its own switch and 3 PCs, all routed by r1 (one
// NIC per subnet), arranged as a triangle with r1 at the center and one arm
// per subnet: subnet 1 straight up, subnet 2 to the lower-left, subnet 3 to
// the lower-right. Each switch sits at the midpoint of the visual gap between
// r1's own card edge and its PC row (not the mathematical center of the full
// region rect, which reaches all the way to r1's center — hitting that exact
// point would put the switch's card on top of a PC's, since PC/switch cards
// are a fixed pixel size while this coordinate space is just scaled to fit
// the layout). This keeps the switch clearly nearer the middle of its region
// than before while leaving real clearance on every side. Subnet 1
// (sw1 / pc-a/b/c / r1's eth0) is the original single-subnet foundation the
// first four lessons are built on; subnets 2-3 exist only for the
// routing-between-subnets lesson (hidden by default in the other four — see
// Stage.tsx's "show other subnets" handling).

export const topology: Topology = {
  localNetwork: '10.0.0.0/24',
  subnets: [
    { cidr: '10.0.0.0/24', switchId: 'sw1', routerNicId: 'r1-lan' },
    { cidr: '172.16.61.0/24', switchId: 'sw2', routerNicId: 'r1-net2' },
    { cidr: '192.168.1.0/24', switchId: 'sw3', routerNicId: 'r1-net3' },
  ],
  devices: [
    {
      id: 'pc-a',
      kind: 'pc',
      name: 'PC-A',
      pos: { x: 588, y: 130 },
      nics: [{ id: 'pc-a-nic', mac: 'AA:AA:AA', ip: '10.0.0.1' }],
    },
    {
      id: 'pc-b',
      kind: 'pc',
      name: 'PC-B',
      pos: { x: 828, y: 130 },
      nics: [{ id: 'pc-b-nic', mac: 'BB:BB:BB', ip: '10.0.0.2' }],
    },
    {
      id: 'pc-c',
      kind: 'pc',
      name: 'PC-C',
      pos: { x: 1068, y: 130 },
      nics: [{ id: 'pc-c-nic', mac: 'CC:CC:CC', ip: '10.0.0.3' }],
    },
    {
      id: 'sw1',
      kind: 'switch',
      name: 'SW1',
      pos: { x: 828, y: 460 },
      nics: [], // A switch is transparent at L2 for this lesson.
    },
    {
      id: 'pc-d',
      kind: 'pc',
      name: 'PC-D',
      pos: { x: 150, y: 972 },
      nics: [{ id: 'pc-d-nic', mac: 'DD:DD:DD', ip: '172.16.61.1' }],
    },
    {
      id: 'pc-e',
      kind: 'pc',
      name: 'PC-E',
      pos: { x: 288, y: 1169 },
      nics: [{ id: 'pc-e-nic', mac: 'EE:EE:EE', ip: '172.16.61.2' }],
    },
    {
      id: 'pc-f',
      kind: 'pc',
      name: 'PC-F',
      pos: { x: 425, y: 1365 },
      nics: [{ id: 'pc-f-nic', mac: 'FF:FF:FF', ip: '172.16.61.3' }],
    },
    {
      id: 'sw2',
      kind: 'switch',
      name: 'SW2',
      pos: { x: 525, y: 1002 },
      nics: [],
    },
    {
      id: 'pc-g',
      kind: 'pc',
      name: 'PC-G',
      pos: { x: 1507, y: 972 },
      nics: [{ id: 'pc-g-nic', mac: '11:11:11', ip: '192.168.1.1' }],
    },
    {
      id: 'pc-h',
      kind: 'pc',
      name: 'PC-H',
      pos: { x: 1369, y: 1169 },
      nics: [{ id: 'pc-h-nic', mac: '22:22:22', ip: '192.168.1.2' }],
    },
    {
      id: 'pc-i',
      kind: 'pc',
      name: 'PC-I',
      pos: { x: 1231, y: 1365 },
      nics: [{ id: 'pc-i-nic', mac: '33:33:33', ip: '192.168.1.3' }],
    },
    {
      id: 'sw3',
      kind: 'switch',
      name: 'SW3',
      pos: { x: 1132, y: 1002 },
      nics: [],
    },
    {
      id: 'r1',
      kind: 'router',
      name: 'R1',
      // The hub at the center of the triangle, equidistant from all 3
      // switches.
      pos: { x: 828, y: 790 },
      nics: [
        { id: 'r1-lan', ifname: 'eth0', mac: 'RR:RR:R0', ip: '10.0.0.254' },
        {
          id: 'r1-net2',
          ifname: 'eth1',
          mac: 'RR:RR:R1',
          ip: '172.16.61.254',
        },
        {
          id: 'r1-net3',
          ifname: 'eth2',
          mac: 'RR:RR:R2',
          ip: '192.168.1.254',
        },
      ],
    },
  ],
  links: [
    { id: 'l-a', a: 'pc-a', b: 'sw1' },
    { id: 'l-b', a: 'pc-b', b: 'sw1' },
    { id: 'l-c', a: 'pc-c', b: 'sw1' },
    { id: 'l-r', a: 'sw1', b: 'r1' },
    { id: 'l-d', a: 'pc-d', b: 'sw2' },
    { id: 'l-e', a: 'pc-e', b: 'sw2' },
    { id: 'l-f', a: 'pc-f', b: 'sw2' },
    { id: 'l-r2', a: 'sw2', b: 'r1' },
    { id: 'l-g', a: 'pc-g', b: 'sw3' },
    { id: 'l-h', a: 'pc-h', b: 'sw3' },
    { id: 'l-i', a: 'pc-i', b: 'sw3' },
    { id: 'l-r3', a: 'sw3', b: 'r1' },
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

/** Primary NIC helper — the PCs' one NIC, or the router's eth0 (LAN) side. */
export function primaryNic(deviceId: string): Nic {
  const d = getDevice(deviceId)
  if (!d.nics[0]) throw new Error(`Device ${deviceId} has no NIC`)
  return d.nics[0]
}

/** Devices directly linked to the given device. */
export function neighborsOf(deviceId: string): Device[] {
  return topology.links
    .filter((l) => l.a === deviceId || l.b === deviceId)
    .map((l) => getDevice(l.a === deviceId ? l.b : l.a))
}

/** The one switch a PC connects to. */
export function switchFor(pcId: string): Device {
  const sw = neighborsOf(pcId).find((d) => d.kind === 'switch')
  if (!sw) throw new Error(`PC ${pcId} has no switch`)
  return sw
}

/** The subnet a PC belongs to, via the switch it connects to. */
export function subnetOf(pcId: string): Subnet {
  const switchId = switchFor(pcId).id
  const subnet = topology.subnets.find((s) => s.switchId === switchId)
  if (!subnet) throw new Error(`No subnet for switch ${switchId}`)
  return subnet
}

/** r1's NIC serving the subnet a given PC belongs to — its default gateway. */
export function gatewayNic(pcId: string): Nic {
  const routerNicId = subnetOf(pcId).routerNicId
  const nic = getDevice('r1').nics.find((n) => n.id === routerNicId)
  if (!nic) throw new Error(`No router NIC ${routerNicId}`)
  return nic
}

/** r1's NIC that connects to a given switch — for labeling the r1-switch link. */
export function routerNicForSwitch(switchId: string): Nic {
  const subnet = topology.subnets.find((s) => s.switchId === switchId)
  if (!subnet) throw new Error(`No subnet for switch ${switchId}`)
  const nic = getDevice('r1').nics.find((n) => n.id === subnet.routerNicId)
  if (!nic) throw new Error(`No router NIC ${subnet.routerNicId}`)
  return nic
}

/** All PCs across every subnet — the picker pool for the routing scenario. */
export const routablePcs: Device[] = pcs

/**
 * The original single-subnet endpoint set (pc-a/b/c plus r1's eth0 side) —
 * the picker pool for the four subnet-1-only lessons, unchanged from before
 * the other subnets existed.
 */
export const subnet1Endpoints: Device[] = neighborsOf('sw1')
