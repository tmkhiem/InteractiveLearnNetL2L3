import type { DeviceData, LinkData, Position } from './types';

export const CANVAS_W = 900;
export const CANVAS_H = 520;

export interface NodeDims {
  w: number;
  h: number;
}

export const NODE_DIMS: Record<string, NodeDims> = {
  pc1:  { w: 140, h: 88 },
  pc2:  { w: 140, h: 88 },
  pc3:  { w: 140, h: 88 },
  sw1:  { w: 152, h: 82 },
  r1:   { w: 158, h: 112 },
  ext1: { w: 140, h: 88 },
};

export function getNodeCenter(id: string, positions: Record<string, Position>): Position {
  const pos = positions[id];
  const dims = NODE_DIMS[id] ?? { w: 140, h: 88 };
  if (!pos) return { x: 0, y: 0 };
  return { x: pos.x + dims.w / 2, y: pos.y + dims.h / 2 };
}

export const INITIAL_POSITIONS: Record<string, Position> = {
  pc1:  { x: 60,  y: 55  },
  pc2:  { x: 60,  y: 210 },
  pc3:  { x: 60,  y: 365 },
  sw1:  { x: 330, y: 215 },
  r1:   { x: 555, y: 200 },
  ext1: { x: 760, y: 55  },
};

export const DEVICES: DeviceData[] = [
  {
    id: 'pc1',
    kind: 'pc',
    displayName: 'PC-1',
    nics: [{ id: 'pc1-eth0', macAddress: '00:11:22:33:44:11', ipAddress: '192.168.1.10', prefix: '/24' }],
    arpTable: [
      { ipAddress: '192.168.1.20', macAddress: '00:11:22:33:44:22' },
      { ipAddress: '192.168.1.30', macAddress: '00:11:22:33:44:33' },
      { ipAddress: '192.168.1.1',  macAddress: 'aa:bb:cc:00:00:01' },
    ],
    routingTable: [
      { destinationNetwork: '192.168.1.0/24', nextHopIp: '—',            outgoingInterface: 'eth0' },
      { destinationNetwork: '0.0.0.0/0',       nextHopIp: '192.168.1.1', outgoingInterface: 'eth0' },
    ],
  },
  {
    id: 'pc2',
    kind: 'pc',
    displayName: 'PC-2',
    nics: [{ id: 'pc2-eth0', macAddress: '00:11:22:33:44:22', ipAddress: '192.168.1.20', prefix: '/24' }],
    arpTable: [
      { ipAddress: '192.168.1.10', macAddress: '00:11:22:33:44:11' },
      { ipAddress: '192.168.1.30', macAddress: '00:11:22:33:44:33' },
      { ipAddress: '192.168.1.1',  macAddress: 'aa:bb:cc:00:00:01' },
    ],
    routingTable: [
      { destinationNetwork: '192.168.1.0/24', nextHopIp: '—',            outgoingInterface: 'eth0' },
      { destinationNetwork: '0.0.0.0/0',       nextHopIp: '192.168.1.1', outgoingInterface: 'eth0' },
    ],
  },
  {
    id: 'pc3',
    kind: 'pc',
    displayName: 'PC-3',
    nics: [{ id: 'pc3-eth0', macAddress: '00:11:22:33:44:33', ipAddress: '192.168.1.30', prefix: '/24' }],
    arpTable: [
      { ipAddress: '192.168.1.10', macAddress: '00:11:22:33:44:11' },
      { ipAddress: '192.168.1.20', macAddress: '00:11:22:33:44:22' },
      { ipAddress: '192.168.1.1',  macAddress: 'aa:bb:cc:00:00:01' },
    ],
    routingTable: [
      { destinationNetwork: '192.168.1.0/24', nextHopIp: '—',            outgoingInterface: 'eth0' },
      { destinationNetwork: '0.0.0.0/0',       nextHopIp: '192.168.1.1', outgoingInterface: 'eth0' },
    ],
  },
  {
    id: 'sw1',
    kind: 'switch',
    displayName: 'SW-1',
    ports: ['Port 1 → PC-1', 'Port 2 → PC-2', 'Port 3 → PC-3', 'Port 4 → R1'],
  },
  {
    id: 'r1',
    kind: 'router',
    displayName: 'R1 (Router)',
    nics: [
      { id: 'r1-eth0', macAddress: 'aa:bb:cc:00:00:01', ipAddress: '192.168.1.1',  prefix: '/24' },
      { id: 'r1-eth1', macAddress: 'aa:bb:cc:00:00:02', ipAddress: '203.0.113.1',  prefix: '/24' },
    ],
    arpTable: [
      { ipAddress: '192.168.1.10', macAddress: '00:11:22:33:44:11' },
      { ipAddress: '192.168.1.20', macAddress: '00:11:22:33:44:22' },
      { ipAddress: '192.168.1.30', macAddress: '00:11:22:33:44:33' },
    ],
    routingTable: [
      { destinationNetwork: '192.168.1.0/24', nextHopIp: '—',             outgoingInterface: 'eth0' },
      { destinationNetwork: '203.0.113.0/24', nextHopIp: '—',             outgoingInterface: 'eth1' },
      { destinationNetwork: '0.0.0.0/0',       nextHopIp: '203.0.113.254', outgoingInterface: 'eth1' },
    ],
  },
  {
    id: 'ext1',
    kind: 'external',
    displayName: 'Internet',
    nics: [{ id: 'ext1-eth0', macAddress: 'de:ad:be:ef:00:88', ipAddress: '203.0.113.88', prefix: '/24' }],
  },
];

export const LINKS: LinkData[] = [
  { id: 'l1', endpointA: 'pc1',  endpointB: 'sw1'  },
  { id: 'l2', endpointA: 'pc2',  endpointB: 'sw1'  },
  { id: 'l3', endpointA: 'pc3',  endpointB: 'sw1'  },
  { id: 'l4', endpointA: 'sw1',  endpointB: 'r1'   },
  { id: 'l5', endpointA: 'r1',   endpointB: 'ext1' },
];
