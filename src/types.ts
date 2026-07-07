export type DeviceKind = 'pc' | 'switch' | 'router' | 'external';
export type Speed = 'slow' | 'normal' | 'fast';

export interface NicData {
  id: string;
  macAddress: string;
  ipAddress?: string;
  prefix?: string;
}

export interface ArpEntry {
  ipAddress: string;
  macAddress: string;
}

export interface RouteEntry {
  destinationNetwork: string;
  nextHopIp: string;
  outgoingInterface: string;
}

export interface DeviceData {
  id: string;
  kind: DeviceKind;
  displayName: string;
  nics?: NicData[];
  ports?: string[];
  arpTable?: ArpEntry[];
  routingTable?: RouteEntry[];
}

export interface LinkData {
  id: string;
  endpointA: string;
  endpointB: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface FrameHeader {
  srcMac: string;
  dstMac: string;
  note?: string;
}

export interface PacketHeader {
  srcIp: string;
  dstIp: string;
  note?: string;
}

/** A PDU animation spec. path = ordered list of node IDs to travel through. */
export interface PduSpec {
  path: string[];
  frame?: FrameHeader;
  packet?: PacketHeader;
}

export interface TableDisplay {
  deviceId: string;
  showArp: boolean;
  showRouting: boolean;
}

export interface StepDef {
  lessonIndex: number;
  title: string;
  explanation: string;
  note?: string;
  visibleDevices?: string[];
  showIp?: boolean;
  tableDisplay?: TableDisplay;
  stateUpdate?: (devices: DeviceData[]) => DeviceData[];
  pdus?: PduSpec[];
}
