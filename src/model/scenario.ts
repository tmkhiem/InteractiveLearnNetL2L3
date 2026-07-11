// Turns a "PC-X sends to PC-Y" request into an ordered list of narrated,
// animated steps. The player (usePlayer) walks this list; Stage renders
// whatever `sprite` state the current step declares.

import { getDevice, primaryNic, topology } from './network'

/** What the traveling box looks like right now. */
export type SpritePhase =
  | 'packet' // green L3 packet only (just created)
  | 'frame' // green packet wrapped in the yellow L2 frame
  | 'decap' // frame peeling away, revealing the packet

export interface SpriteState {
  /** Device id the box currently sits on/over. */
  at: string
  phase: SpritePhase
  /** Emphasize the destination MAC (used at the switch). */
  highlightTo?: boolean
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
  /** Base duration in ms (scaled by playback speed). */
  duration: number
}

export interface Scenario {
  srcId: string
  dstId: string
  steps: Step[]
}

const CREATE_MS = 1400
const ENCAP_MS = 1400
const TRAVEL_MS = 1800
const INSPECT_MS = 1800
const DECAP_MS = 1400
const HOLD_MS = 1600

export function buildL2Scenario(srcId: string, dstId: string): Scenario {
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
