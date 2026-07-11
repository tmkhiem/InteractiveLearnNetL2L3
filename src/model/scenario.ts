// Turns a "PC-X sends to PC-Y" request into an ordered list of narrated,
// animated steps. The player (usePlayer) walks this list; Stage renders
// whatever `sprite` state the current step declares.

import { endpoints, getDevice, primaryNic, topology } from './network'

/** What the traveling box looks like right now. */
export type SpritePhase =
  | 'packet' // green L3 packet only (just created)
  | 'frame' // green packet wrapped in the yellow L2 frame
  | 'decap' // frame peeling away, revealing the packet
  | 'arp' // yellow-only frame carrying an ARP request/reply, no packet

export interface SpriteState {
  /** Device id the box currently sits on/over. */
  at: string
  phase: SpritePhase
  /** Emphasize the destination MAC (used at the switch). */
  highlightTo?: boolean
  /**
   * Per-step FROM/TO MAC override. ARP replies travel in the opposite
   * direction of the scenario's overall src→dst, so they can't reuse the
   * Lesson-level frameLabels — the sprite carries its own addressing.
   */
  fromMac?: string
  toMac?: string
  /** Box header tag override, e.g. "ARP REQUEST" / "ARP REPLY". */
  boxTag?: string
  /** Plain-payload text override (non-L3 scenarios only). */
  payloadText?: string
}

/** One row of a device's ARP cache. */
export interface ArpEntry {
  ip: string
  mac: string
  /** True to render this entry with a pulsing "just learned" highlight. */
  isNew?: boolean
}

/** The ARP table to display (if any) during a step. */
export interface ArpTableView {
  deviceId: string
  entries: ArpEntry[]
}

/** One cloned copy of a broadcast frame, sitting at a single device. */
export interface BroadcastClone {
  /** Device id this clone travels to and sits at. */
  at: string
  /** True once this clone is shown discarding the frame: gray, drop, fade. */
  dropped?: boolean
  /** True to call out that this clone's device is the one the request is for. */
  matched?: boolean
}

/**
 * A broadcast fan-out: several cloned copies of one frame, at different
 * devices simultaneously. Renders instead of `sprite` for the step it's set
 * on — a single anchor doesn't make sense when the same frame is at several
 * places at once (FrameSprite only models one box in one place).
 */
export interface BroadcastStep {
  /** Device id all clones travel from (e.g. the switch, right after flooding). */
  originId: string
  fromMac: string
  toMac: string
  boxTag: string
  payloadText: string
  clones: BroadcastClone[]
}

/** Hint for how the box should transition into this step's state. */
export type StepKind =
  | 'create'
  | 'encap'
  | 'travel'
  | 'inspect'
  | 'decap'
  | 'deliver'
  | 'callout'

export interface Step {
  kind: StepKind
  /** Primary narration line. */
  narration: string
  /** Optional secondary line. */
  detail?: string
  /** Render narration as a highlighted "realization" callout. */
  realization?: boolean
  /** Box state during this step, or null to hide it. */
  sprite: SpriteState | null
  /** Device id to visually emphasize this step. */
  activeDevice?: string
  /** ARP table to display during this step, or null/omitted to hide it. */
  arpTable?: ArpTableView | null
  /** Broadcast fan-out to display during this step, in place of `sprite`. */
  broadcast?: BroadcastStep | null
  /** Base duration in ms (scaled by playback speed). */
  duration: number
}

export interface Scenario {
  srcId: string
  dstId: string
  steps: Step[]
}

/**
 * A named, reusable scenario: metadata plus the function that builds its
 * step list for a given sender/receiver pair. Future lessons (ARP, routing)
 * register alongside these in this same shape.
 */
export interface ScenarioDefinition {
  id: string
  name: string
  /** Whether this scenario surfaces IP addressing (Layer 3) at all. */
  showLayer3: boolean
  build: (srcId: string, dstId: string) => Scenario
}

const CREATE_MS = 1400
const ENCAP_MS = 1400
const TRAVEL_MS = 1800
const INSPECT_MS = 1800
const DECAP_MS = 1400
const HOLD_MS = 1600

// --- Basic L2 transfer -------------------------------------------------------
// Pure Layer 2: a frame carrying an opaque payload, addressed only by MAC.
// No packet, no IP, no encapsulation/decapsulation — Layer 3 hasn't been
// introduced yet at this point in the storyboard.

function buildBasicL2Transfer(srcId: string, dstId: string): Scenario {
  const src = getDevice(srcId)
  const dst = getDevice(dstId)
  const srcNic = primaryNic(srcId)
  const dstNic = primaryNic(dstId)

  const steps: Step[] = [
    {
      kind: 'create',
      narration: `${src.name} wants to send data to ${dst.name}.`,
      detail: `It builds a Layer 2 frame: FROM ${srcNic.mac} → TO ${dstNic.mac}.`,
      sprite: { at: srcId, phase: 'frame' },
      activeDevice: srcId,
      duration: CREATE_MS,
    },
    {
      kind: 'travel',
      narration: `The frame leaves ${src.name} and travels to the switch SW1.`,
      detail: 'It carries a payload, addressed only by MAC.',
      sprite: { at: 'sw1', phase: 'frame' },
      activeDevice: 'sw1',
      duration: TRAVEL_MS,
    },
    {
      kind: 'inspect',
      narration: 'SW1 reads only the destination MAC address.',
      detail: `It sees TO ${dstNic.mac} and forwards toward ${dst.name}. A switch never needs to know what's inside the frame.`,
      sprite: { at: 'sw1', phase: 'frame', highlightTo: true },
      activeDevice: 'sw1',
      duration: INSPECT_MS,
    },
    {
      kind: 'travel',
      narration: `SW1 forwards the frame to ${dst.name}.`,
      detail: 'Same frame, same payload — delivered as one unit.',
      sprite: { at: dstId, phase: 'frame' },
      activeDevice: dstId,
      duration: TRAVEL_MS,
    },
    {
      kind: 'deliver',
      narration: `${dst.name} receives the frame. Delivery complete.`,
      detail: `The destination MAC matched (${dstNic.mac}), so ${dst.name} accepts the frame and reads its payload.`,
      sprite: { at: dstId, phase: 'frame' },
      activeDevice: dstId,
      duration: HOLD_MS,
    },
    {
      kind: 'callout',
      narration: 'The frame never left the local network.',
      detail:
        'Every hop stayed on the same local network. Layer 2 frames only travel within one network — and the switch forwarded it using the MAC address alone.',
      realization: true,
      sprite: null,
      duration: HOLD_MS,
    },
  ]

  return { srcId, dstId, steps }
}

export const basicL2Transfer: ScenarioDefinition = {
  id: 'basic-l2-transfer',
  name: 'Basic L2 transfer',
  showLayer3: false,
  build: buildBasicL2Transfer,
}

// --- Basic L3 transfer -------------------------------------------------------
// The full picture: a Layer 3 packet (addressed by IP) encapsulated inside a
// Layer 2 frame (addressed by MAC), including encapsulation/decapsulation.

function buildBasicL3Transfer(srcId: string, dstId: string): Scenario {
  const src = getDevice(srcId)
  const dst = getDevice(dstId)
  const srcNic = primaryNic(srcId)
  const dstNic = primaryNic(dstId)

  const steps: Step[] = [
    {
      kind: 'create',
      narration: `${src.name} wants to send data to ${dst.name}.`,
      detail: `It builds a Layer 3 packet: FROM ${srcNic.ip} → TO ${dstNic.ip}.`,
      sprite: { at: srcId, phase: 'packet' },
      activeDevice: srcId,
      duration: CREATE_MS,
    },
    {
      kind: 'encap',
      narration: 'Encapsulation: the packet is wrapped in a Layer 2 frame.',
      detail: `The frame is addressed FROM ${srcNic.mac} → TO ${dstNic.mac}. The green packet is now the frame's payload.`,
      sprite: { at: srcId, phase: 'frame' },
      activeDevice: srcId,
      duration: ENCAP_MS,
    },
    {
      kind: 'travel',
      narration: `The frame leaves ${src.name} and travels to the switch SW1.`,
      detail: 'It rides the cable as a single unit — frame on the outside, packet sealed inside.',
      sprite: { at: 'sw1', phase: 'frame' },
      activeDevice: 'sw1',
      duration: TRAVEL_MS,
    },
    {
      kind: 'inspect',
      narration: 'SW1 reads only the destination MAC address.',
      detail: `It sees TO ${dstNic.mac} and forwards toward ${dst.name}. A switch never opens the frame or looks at IP addresses.`,
      sprite: { at: 'sw1', phase: 'frame', highlightTo: true },
      activeDevice: 'sw1',
      duration: INSPECT_MS,
    },
    {
      kind: 'travel',
      narration: `SW1 forwards the frame to ${dst.name}.`,
      detail: 'Same frame, same packet — still travelling as one unit.',
      sprite: { at: dstId, phase: 'frame' },
      activeDevice: dstId,
      duration: TRAVEL_MS,
    },
    {
      kind: 'decap',
      narration: `Decapsulation: ${dst.name} peels off the Layer 2 frame.`,
      detail: `The destination MAC matched (${dstNic.mac}), so the frame is opened and the green packet is revealed.`,
      sprite: { at: dstId, phase: 'decap' },
      activeDevice: dstId,
      duration: DECAP_MS,
    },
    {
      kind: 'deliver',
      narration: `${dst.name} receives the packet. Delivery complete.`,
      detail: `The Layer 3 packet (FROM ${srcNic.ip} → TO ${dstNic.ip}) is handed up to be processed.`,
      sprite: { at: dstId, phase: 'packet' },
      activeDevice: dstId,
      duration: HOLD_MS,
    },
    {
      kind: 'callout',
      narration: 'The frame never left the local network.',
      detail: `Every hop stayed inside ${topology.localNetwork}. Layer 2 frames only travel within one network — and the switch forwarded it using the MAC address alone.`,
      realization: true,
      sprite: null,
      duration: HOLD_MS,
    },
  ]

  return { srcId, dstId, steps }
}

export const basicL3Transfer: ScenarioDefinition = {
  id: 'basic-l3-transfer',
  name: 'Basic L3 transfer',
  showLayer3: true,
  build: buildBasicL3Transfer,
}

// --- ARP learning ------------------------------------------------------------
// How a PC discovers a neighbor's MAC address before it can address a frame
// to it: broadcast an ARP request, get a unicast ARP reply, and cache the
// mapping in an ARP table. ARP is a Layer 2-only exchange — no IP packet is
// ever carried inside it.

const ARP_BROADCAST_MAC = 'FF:FF:FF'

function buildArpLearning(srcId: string, dstId: string): Scenario {
  const src = getDevice(srcId)
  const dst = getDevice(dstId)
  const srcNic = primaryNic(srcId)
  const dstNic = primaryNic(dstId)
  const requestText = `Who has ${dstNic.ip}? Tell ${srcNic.ip}.`
  const replyText = `${dstNic.ip} is at ${dstNic.mac}.`
  // Everyone else on the local network: this is who the broadcast fans out
  // to, and everyone but dst discards it.
  const broadcastTargets = endpoints.filter((d) => d.id !== srcId)
  const nonMatching = broadcastTargets.filter((d) => d.id !== dstId)

  const emptyTable: ArpTableView = { deviceId: srcId, entries: [] }
  const learnedTable: ArpTableView = {
    deviceId: srcId,
    entries: [{ ip: dstNic.ip ?? '', mac: dstNic.mac, isNew: true }],
  }

  const steps: Step[] = [
    {
      kind: 'create',
      narration: `${src.name} wants to send data to ${dst.name} (${dstNic.ip}).`,
      detail: `It checks its ARP table for ${dstNic.ip} — no entry yet, so it can't address a Layer 2 frame.`,
      sprite: null,
      activeDevice: srcId,
      arpTable: emptyTable,
      duration: CREATE_MS,
    },
    {
      kind: 'create',
      narration: `${src.name} broadcasts an ARP request.`,
      detail: `"Who has ${dstNic.ip}? Reply to me." Sent to every device on the local network at once. In practice, the destination MAC address used for broadcast is FF:FF:FF:FF:FF:FF.`,
      sprite: {
        at: srcId,
        phase: 'arp',
        fromMac: srcNic.mac,
        toMac: ARP_BROADCAST_MAC,
        boxTag: 'ARP REQUEST',
        payloadText: requestText,
      },
      activeDevice: srcId,
      arpTable: emptyTable,
      duration: CREATE_MS,
    },
    {
      kind: 'travel',
      narration: `The ARP request reaches the switch SW1.`,
      detail: "It's a broadcast frame, so SW1 floods it out every port instead of forwarding to one.",
      sprite: {
        at: 'sw1',
        phase: 'arp',
        fromMac: srcNic.mac,
        toMac: ARP_BROADCAST_MAC,
        boxTag: 'ARP REQUEST',
        payloadText: requestText,
        highlightTo: true,
      },
      activeDevice: 'sw1',
      arpTable: emptyTable,
      duration: TRAVEL_MS,
    },
    {
      kind: 'travel',
      narration: `SW1 floods the broadcast out every port at once.`,
      detail: `A copy of the frame arrives at ${broadcastTargets.map((d) => d.name).join(', ')} simultaneously — that's what makes it a broadcast.`,
      sprite: null,
      broadcast: {
        originId: 'sw1',
        fromMac: srcNic.mac,
        toMac: ARP_BROADCAST_MAC,
        boxTag: 'ARP REQUEST',
        payloadText: requestText,
        clones: broadcastTargets.map((d) => ({ at: d.id })),
      },
      arpTable: emptyTable,
      duration: TRAVEL_MS,
    },
    {
      kind: 'inspect',
      narration: `Only ${dst.name}'s IP matches the request.`,
      detail:
        nonMatching.length > 0
          ? `${nonMatching.map((d) => d.name).join(' and ')} discard the frame — the IP isn't theirs.`
          : `${dst.name} recognizes the IP as its own.`,
      sprite: null,
      broadcast: {
        originId: 'sw1',
        fromMac: srcNic.mac,
        toMac: ARP_BROADCAST_MAC,
        boxTag: 'ARP REQUEST',
        payloadText: requestText,
        clones: broadcastTargets.map((d) => ({
          at: d.id,
          dropped: d.id !== dstId,
          matched: d.id === dstId,
        })),
      },
      activeDevice: dstId,
      arpTable: emptyTable,
      duration: INSPECT_MS,
    },
    {
      kind: 'create',
      narration: `${dst.name} recognizes its own IP and replies.`,
      detail: `"${dstNic.ip} is at ${dstNic.mac}." Sent directly back to ${src.name} — no broadcast needed this time.`,
      sprite: {
        at: dstId,
        phase: 'arp',
        fromMac: dstNic.mac,
        toMac: srcNic.mac,
        boxTag: 'ARP REPLY',
        payloadText: replyText,
      },
      activeDevice: dstId,
      arpTable: emptyTable,
      duration: CREATE_MS,
    },
    {
      kind: 'travel',
      narration: `The ARP reply travels back through SW1...`,
      detail: 'Unicast this time — addressed to one MAC, not everyone.',
      sprite: {
        at: 'sw1',
        phase: 'arp',
        fromMac: dstNic.mac,
        toMac: srcNic.mac,
        boxTag: 'ARP REPLY',
        payloadText: replyText,
        highlightTo: true,
      },
      activeDevice: 'sw1',
      arpTable: emptyTable,
      duration: TRAVEL_MS,
    },
    {
      kind: 'travel',
      narration: `...and arrives back at ${src.name}.`,
      detail: `${src.name} reads the reply.`,
      sprite: {
        at: srcId,
        phase: 'arp',
        fromMac: dstNic.mac,
        toMac: srcNic.mac,
        boxTag: 'ARP REPLY',
        payloadText: replyText,
      },
      activeDevice: srcId,
      arpTable: emptyTable,
      duration: TRAVEL_MS,
    },
    {
      kind: 'deliver',
      narration: `${src.name} learns the mapping and updates its ARP table.`,
      detail: `${dstNic.ip} → ${dstNic.mac} is now cached. No ARP request will be needed for future frames to ${dst.name}.`,
      sprite: null,
      activeDevice: srcId,
      arpTable: learnedTable,
      duration: HOLD_MS,
    },
    {
      kind: 'callout',
      narration: 'ARP resolves an IP address to a MAC address.',
      detail:
        'ARP is a Layer 2 protocol: the request and reply are addressed by MAC, and no Layer 3 packet is ever carried inside them — only the question and the answer.',
      realization: true,
      sprite: null,
      duration: HOLD_MS,
    },
  ]

  return { srcId, dstId, steps }
}

export const arpLearning: ScenarioDefinition = {
  id: 'arp-learning',
  name: 'ARP learning',
  // IP addresses are shown (device cards, ARP table) since ARP's whole job
  // is resolving one to a MAC — but FrameSprite still never nests an L3
  // packet inside an ARP frame (see its 'arp'-phase check).
  showLayer3: true,
  build: buildArpLearning,
}

/** All registered scenarios, in the order they should appear in a picker. */
export const scenarios: ScenarioDefinition[] = [
  basicL2Transfer,
  basicL3Transfer,
  arpLearning,
]
