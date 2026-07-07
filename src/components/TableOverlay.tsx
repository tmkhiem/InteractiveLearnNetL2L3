import { AnimatePresence, motion } from 'framer-motion';
import type { TableDisplay, DeviceData, Position } from '../types';
import { NODE_DIMS, CANVAS_W } from '../topology';

interface Props {
  tableDisplay: TableDisplay | null;
  devices: DeviceData[];
  positions: Record<string, Position>;
}

export function TableOverlay({ tableDisplay, devices, positions }: Props) {
  return (
    <AnimatePresence>
      {tableDisplay && (
        <TableOverlayInner
          key={`${tableDisplay.deviceId}-${tableDisplay.showArp}-${tableDisplay.showRouting}`}
          tableDisplay={tableDisplay}
          devices={devices}
          positions={positions}
        />
      )}
    </AnimatePresence>
  );
}

const TABLE_W = 240;

function TableOverlayInner({
  tableDisplay,
  devices,
  positions,
}: {
  tableDisplay: TableDisplay;
  devices: DeviceData[];
  positions: Record<string, Position>;
}) {
  const device = devices.find(d => d.id === tableDisplay.deviceId);
  if (!device) return null;

  const pos  = positions[tableDisplay.deviceId] ?? { x: 0, y: 0 };
  const dims = NODE_DIMS[tableDisplay.deviceId] ?? { w: 140, h: 88 };

  // Place to the right; fall back to left if near right edge
  let left = pos.x + dims.w + 10;
  if (left + TABLE_W > CANVAS_W - 8) {
    left = pos.x - TABLE_W - 10;
  }
  const top = pos.y;

  return (
    <motion.div
      className="table-overlay"
      style={{ left, top }}
      initial={{ opacity: 0, x: -10, scale: 0.93 }}
      animate={{ opacity: 1, x: 0,   scale: 1 }}
      exit={{    opacity: 0, x: -10, scale: 0.93 }}
      transition={{ duration: 0.22 }}
    >
      <div className="table-overlay__title">{device.displayName}</div>

      {tableDisplay.showArp && device.arpTable !== undefined && (
        <div className="table-overlay__section">
          <div className="table-overlay__section-title" style={{ color: '#3b82f6' }}>
            ARP Table
          </div>
          <table className="table-overlay__table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>MAC</th>
              </tr>
            </thead>
            <tbody>
              {device.arpTable.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                    Empty
                  </td>
                </tr>
              ) : (
                device.arpTable.map((e, i) => (
                  <tr key={i}>
                    <td>{e.ipAddress}</td>
                    <td>…{e.macAddress.slice(-5)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tableDisplay.showRouting && device.routingTable !== undefined && (
        <div className="table-overlay__section">
          <div className="table-overlay__section-title" style={{ color: '#10b981' }}>
            Routing Table
          </div>
          <table className="table-overlay__table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Next Hop</th>
                <th>If</th>
              </tr>
            </thead>
            <tbody>
              {device.routingTable.map((r, i) => (
                <tr key={i}>
                  <td>{r.destinationNetwork}</td>
                  <td>{r.nextHopIp}</td>
                  <td>{r.outgoingInterface}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
