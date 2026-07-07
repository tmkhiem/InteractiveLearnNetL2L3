import type { DeviceData, Position, PduSpec, TableDisplay } from '../types';
import { LINKS, CANVAS_W, CANVAS_H, getNodeCenter } from '../topology';
import { DeviceNode } from './DeviceNode';
import { PduToken } from './PduToken';
import { TableOverlay } from './TableOverlay';

interface ActivePdu {
  key: string;
  spec: PduSpec;
  segmentMs: number;
  onDone: () => void;
}

interface Props {
  devices: DeviceData[];
  positions: Record<string, Position>;
  visibleDevices: string[];
  showIp: boolean;
  activePdu: ActivePdu | null;
  activeTable: TableDisplay | null;
  onPositionChange: (id: string, pos: Position) => void;
}

export function Canvas({
  devices,
  positions,
  visibleDevices,
  showIp,
  activePdu,
  activeTable,
  onPositionChange,
}: Props) {
  return (
    <div className="network-canvas">
      {/* SVG link layer */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#4a5568" />
          </marker>
        </defs>
        {LINKS.map(link => {
          const aVis = visibleDevices.includes(link.endpointA);
          const bVis = visibleDevices.includes(link.endpointB);
          if (!aVis || !bVis) return null;

          const a = getNodeCenter(link.endpointA, positions);
          const b = getNodeCenter(link.endpointB, positions);

          return (
            <line
              key={link.id}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="#4a5568"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Device nodes */}
      {devices
        .filter(d => visibleDevices.includes(d.id))
        .map(device => (
          <DeviceNode
            key={device.id}
            device={device}
            position={positions[device.id] ?? { x: 0, y: 0 }}
            showIp={showIp}
            onDragStop={onPositionChange}
          />
        ))}

      {/* Active PDU animation */}
      {activePdu && (
        <PduToken
          key={activePdu.key}
          spec={activePdu.spec}
          positions={positions}
          segmentMs={activePdu.segmentMs}
          onDone={activePdu.onDone}
        />
      )}

      {/* Contextual table overlay */}
      <TableOverlay
        tableDisplay={activeTable}
        devices={devices}
        positions={positions}
      />
    </div>
  );
}
