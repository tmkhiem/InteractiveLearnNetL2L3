import type { StepDef, DeviceData } from './types';

export const LESSONS: string[] = [
  'Lesson 1: Layer 2 — The Frame',
  'Lesson 2: Layer 3 — Adding IP',
  'Lesson 3: ARP — Discovering MACs',
  'Lesson 4: The Router',
  'Lesson 5: Reaching External Networks',
  'Lesson 6: Router Processing & Re-Encapsulation',
];

function cloneDevices(devices: DeviceData[]): DeviceData[] {
  return JSON.parse(JSON.stringify(devices)) as DeviceData[];
}

export const STEPS: StepDef[] = [
  // ── LESSON 1: Layer 2 ────────────────────────────────────────────────────
  {
    lessonIndex: 0,
    title: 'The Local Network',
    explanation:
      'Three PCs connect through a Layer 2 switch. At Layer 2 only MAC addresses matter — IP addresses do not exist here.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: false,
  },
  {
    lessonIndex: 0,
    title: 'Building a Frame',
    explanation:
      'PC-1 wraps its data in a Layer 2 frame. It sets source MAC to its own (:11) and destination MAC to PC-2\'s (:22).',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: false,
    pdus: [
      { path: ['pc1'], frame: { srcMac: '00:11:22:33:44:11', dstMac: '00:11:22:33:44:22' } },
    ],
  },
  {
    lessonIndex: 0,
    title: 'Unicast Delivery',
    explanation:
      'The frame travels to SW-1. The switch sees dst MAC :22, matches it to port 2 (PC-2), and forwards only there.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: false,
    pdus: [
      { path: ['pc1', 'sw1', 'pc2'], frame: { srcMac: '00:11:22:33:44:11', dstMac: '00:11:22:33:44:22' } },
    ],
  },
  {
    lessonIndex: 0,
    title: 'Broadcast',
    explanation:
      'Dst MAC FF:FF:FF:FF:FF:FF is a broadcast. The switch floods this frame out every port — PC-2 and PC-3 both receive it.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: false,
    pdus: [
      { path: ['pc1', 'sw1', 'pc2'], frame: { srcMac: '00:11:22:33:44:11', dstMac: 'FF:FF:FF:FF:FF:FF', note: 'Broadcast' } },
      { path: ['pc1', 'sw1', 'pc3'], frame: { srcMac: '00:11:22:33:44:11', dstMac: 'FF:FF:FF:FF:FF:FF', note: 'Broadcast' } },
    ],
  },

  // ── LESSON 2: Layer 3 ────────────────────────────────────────────────────
  {
    lessonIndex: 1,
    title: 'Layer 3 Arrives',
    explanation:
      'We zoom out and add IP addresses. Each PC and router interface has both a MAC and an IP address. A router connects the local network to the internet.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
  },
  {
    lessonIndex: 1,
    title: 'Encapsulation',
    explanation:
      'PC-1 creates an L3 packet (src .10, dst .20) and places it inside an L2 frame. The outer L2 frame handles local delivery; the inner L3 packet carries end-to-end addressing.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      {
        path: ['pc1'],
        frame:  { srcMac: '00:11:22:33:44:11', dstMac: '00:11:22:33:44:22' },
        packet: { srcIp: '192.168.1.10', dstIp: '192.168.1.20' },
      },
    ],
  },
  {
    lessonIndex: 1,
    title: 'Encapsulated Delivery',
    explanation:
      'The encapsulated frame travels via SW-1 to PC-2. PC-2 strips the L2 frame (decapsulation) to reveal and process the L3 packet inside.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      {
        path: ['pc1', 'sw1', 'pc2'],
        frame:  { srcMac: '00:11:22:33:44:11', dstMac: '00:11:22:33:44:22' },
        packet: { srcIp: '192.168.1.10', dstIp: '192.168.1.20', note: 'ping' },
      },
    ],
  },

  // ── LESSON 3: ARP ────────────────────────────────────────────────────────
  {
    lessonIndex: 2,
    title: 'The ARP Table',
    explanation:
      'To build an L2 frame PC-1 needs PC-2\'s MAC. It looks it up in its ARP table (IP → MAC mapping). Here the tables are pre-populated so we can focus on delivery first.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: true,
    tableDisplay: { deviceId: 'pc1', showArp: true, showRouting: false },
    note: 'Assumption: ARP tables start pre-populated.',
  },
  {
    lessonIndex: 2,
    title: 'Missing ARP Entry',
    explanation:
      'Suppose PC-1 has never talked to PC-3 — its ARP entry for 192.168.1.30 is absent. It must run ARP to discover PC-3\'s MAC.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: true,
    stateUpdate: (devices) => {
      const next = cloneDevices(devices);
      const pc1 = next.find(d => d.id === 'pc1');
      if (pc1?.arpTable) {
        pc1.arpTable = pc1.arpTable.filter(e => e.ipAddress !== '192.168.1.30');
      }
      return next;
    },
    tableDisplay: { deviceId: 'pc1', showArp: true, showRouting: false },
  },
  {
    lessonIndex: 2,
    title: 'ARP Request',
    explanation:
      'PC-1 broadcasts: "Who has 192.168.1.30? Tell me your MAC." The switch floods it to all ports. Only PC-3 recognises its own IP.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: true,
    pdus: [
      { path: ['pc1', 'sw1', 'pc2'], frame: { srcMac: '00:11:22:33:44:11', dstMac: 'FF:FF:FF:FF:FF:FF', note: 'ARP: Who has .30?' } },
      { path: ['pc1', 'sw1', 'pc3'], frame: { srcMac: '00:11:22:33:44:11', dstMac: 'FF:FF:FF:FF:FF:FF', note: 'ARP: Who has .30?' } },
    ],
  },
  {
    lessonIndex: 2,
    title: 'ARP Reply — Table Updated',
    explanation:
      'PC-3 unicasts a reply: ".30 is at :33." PC-1 stores this mapping in its ARP table and can now encapsulate frames to PC-3.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1'],
    showIp: true,
    stateUpdate: (devices) => {
      const next = cloneDevices(devices);
      const pc1 = next.find(d => d.id === 'pc1');
      if (pc1) {
        if (!pc1.arpTable) pc1.arpTable = [];
        const existing = pc1.arpTable.find(e => e.ipAddress === '192.168.1.30');
        if (existing) existing.macAddress = '00:11:22:33:44:33';
        else pc1.arpTable.push({ ipAddress: '192.168.1.30', macAddress: '00:11:22:33:44:33' });
      }
      return next;
    },
    pdus: [
      { path: ['pc3', 'sw1', 'pc1'], frame: { srcMac: '00:11:22:33:44:33', dstMac: '00:11:22:33:44:11', note: 'ARP Reply: .30 → :33' } },
    ],
    tableDisplay: { deviceId: 'pc1', showArp: true, showRouting: false },
  },

  // ── LESSON 4: Router ─────────────────────────────────────────────────────
  {
    lessonIndex: 3,
    title: 'Introducing the Router',
    explanation:
      'R1 is a Layer 3 router with two interfaces. eth0 (192.168.1.1) faces the local LAN; eth1 (203.0.113.1) faces the internet. Routers forward packets between different networks.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
  },
  {
    lessonIndex: 3,
    title: 'PC Knows the Router',
    explanation:
      'PC-1\'s ARP table has R1\'s local MAC (192.168.1.1 → :01) and its routing table has a default route via 192.168.1.1. Both are pre-populated.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    tableDisplay: { deviceId: 'pc1', showArp: true, showRouting: true },
    note: 'Assumption: routing and ARP tables pre-populated.',
  },

  // ── LESSON 5: External ───────────────────────────────────────────────────
  {
    lessonIndex: 4,
    title: 'Ping to the Internet',
    explanation:
      'PC-1 pings 203.0.113.88. It creates an L3 packet: src IP 192.168.1.10, dst IP 203.0.113.88.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      { path: ['pc1'], packet: { srcIp: '192.168.1.10', dstIp: '203.0.113.88', note: 'ping' } },
    ],
  },
  {
    lessonIndex: 4,
    title: 'Routing Table Lookup',
    explanation:
      'Is 203.0.113.88 on my subnet 192.168.1.0/24? No. PC-1 consults its routing table and finds the default route: next hop = 192.168.1.1 (R1).',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    tableDisplay: { deviceId: 'pc1', showArp: false, showRouting: true },
    note: 'Not local → use default gateway 192.168.1.1',
  },
  {
    lessonIndex: 4,
    title: 'Encapsulate for the Router',
    explanation:
      'PC-1 encapsulates: L2 src MAC = :11, L2 dst MAC = R1\'s local MAC (:01). The L3 packet inside is untouched: src IP .10, dst IP 203.0.113.88.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      {
        path: ['pc1', 'sw1', 'r1'],
        frame:  { srcMac: '00:11:22:33:44:11', dstMac: 'aa:bb:cc:00:00:01', note: 'To Router' },
        packet: { srcIp: '192.168.1.10', dstIp: '203.0.113.88', note: 'ping' },
      },
    ],
  },
  {
    lessonIndex: 4,
    title: '⚡ Key Observation',
    explanation:
      'L2 destination is the router (aa:bb:cc:00:00:01). L3 destination is the remote host (203.0.113.88). They are different — the L2 frame handles the local hop only; the L3 packet carries the final destination.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    note: 'L2 dst = Router MAC ≠ L3 dst = Remote IP. Same packet, different addressing layers!',
  },

  // ── LESSON 6: Router Processing ─────────────────────────────────────────
  {
    lessonIndex: 5,
    title: 'Router Decapsulates',
    explanation:
      'R1 receives the frame because its eth0 MAC matches the dst MAC. It strips the L2 frame and reads the L3 dst IP: 203.0.113.88.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    tableDisplay: { deviceId: 'r1', showArp: false, showRouting: true },
  },
  {
    lessonIndex: 5,
    title: 'Route Lookup & Re-Encapsulation',
    explanation:
      'R1 looks up 203.0.113.88 → default route → send via eth1. It wraps the original L3 packet in a brand-new L2 frame with new MAC addresses for this link.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      {
        path: ['r1'],
        frame:  { srcMac: 'aa:bb:cc:00:00:02', dstMac: 'de:ad:be:ef:00:88', note: 'New L2 frame' },
        packet: { srcIp: '192.168.1.10', dstIp: '203.0.113.88', note: 'ping — unchanged' },
      },
    ],
    tableDisplay: { deviceId: 'r1', showArp: false, showRouting: true },
  },
  {
    lessonIndex: 5,
    title: 'L3 Unchanged — L2 Changed',
    explanation:
      'R1 sends the frame out eth1. The L3 src/dst IPs are preserved (192.168.1.10 → 203.0.113.88). The L2 MACs are completely new for this link. Every router hop changes L2; L3 never changes.',
    visibleDevices: ['pc1', 'pc2', 'pc3', 'sw1', 'r1', 'ext1'],
    showIp: true,
    pdus: [
      {
        path: ['r1', 'ext1'],
        frame:  { srcMac: 'aa:bb:cc:00:00:02', dstMac: 'de:ad:be:ef:00:88', note: 'New L2 for this link' },
        packet: { srcIp: '192.168.1.10', dstIp: '203.0.113.88', note: 'L3 unchanged' },
      },
    ],
    note: 'L3 src/dst IPs never change. L2 src/dst MACs change at every router hop.',
  },
];

/** Index of the first step that belongs to each lesson. */
export const LESSON_START_STEPS: number[] = LESSONS.map((_, li) =>
  STEPS.findIndex(s => s.lessonIndex === li),
);
