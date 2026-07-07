import type { DeviceData, Position } from '../types';
import { NODE_DIMS } from '../topology';
import { Rnd } from 'react-rnd';

interface Props {
  device: DeviceData;
  position: Position;
  showIp: boolean;
  onDragStop: (id: string, pos: Position) => void;
}

const KIND_COLOR: Record<string, string> = {
  pc:       '#3b82f6',
  switch:   '#f59e0b',
  router:   '#10b981',
  external: '#8b5cf6',
};

const KIND_ICON: Record<string, string> = {
  pc:       '▧',
  switch:   '⇄',
  router:   '⊕',
  external: '🌐',
};

export function DeviceNode({ device, position, showIp, onDragStop }: Props) {
  const dims = NODE_DIMS[device.id] ?? { w: 140, h: 88 };
  const color = KIND_COLOR[device.kind] ?? '#64748b';
  const icon  = KIND_ICON[device.kind] ?? '▪';

  return (
    <Rnd
      position={position}
      size={{ width: dims.w, height: dims.h }}
      enableResizing={false}
      onDragStop={(_, d) => onDragStop(device.id, { x: d.x, y: d.y })}
      style={{ zIndex: 10 }}
      bounds="parent"
    >
      <div
        className={`device-card device-card--${device.kind}`}
        style={{
          borderColor: color,
          borderLeftColor: color,
        }}
      >
        <div className="device-card__title" style={{ color }}>
          {icon} {device.displayName}
        </div>

        {device.nics?.map(nic => (
          <div key={nic.id}>
            <div className="device-card__field">
              MAC <span>…{nic.macAddress.slice(-5)}</span>
            </div>
            {showIp && nic.ipAddress && (
              <div className="device-card__field">
                IP&nbsp;&nbsp; <span>{nic.ipAddress}{nic.prefix}</span>
              </div>
            )}
          </div>
        ))}

        {device.ports && (
          <div className="device-card__field" style={{ marginTop: 3 }}>
            Layer 2 — forwards by MAC
          </div>
        )}
      </div>
    </Rnd>
  );
}
