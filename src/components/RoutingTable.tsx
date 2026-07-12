import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'
import type { RoutingTableView } from '../model/scenario'

interface RoutingTableProps {
  view: RoutingTableView | null
}

// Vertical gap (in stage units, same scale as device positions) between the
// device and the table anchored above it, clearing the device card itself.
const GAP = 100

/**
 * Floating panel anchored just above the device whose routing table it shows
 * (network → gateway). The entry matching the current lookup is highlighted.
 */
export function RoutingTable({ view }: RoutingTableProps) {
  if (!view) return null
  const device = getDevice(view.deviceId)
  const left = `${(device.pos.x / STAGE_WIDTH) * 100}%`
  const top = `${((device.pos.y - GAP) / STAGE_HEIGHT) * 100}%`

  return (
    <div className="routing-table" style={{ left, top }}>
      <div className="routing-table-title">{device.name} · Routing table</div>
      {view.entries.length === 0 ? (
        <div className="routing-table-empty">empty</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Network</th>
              <th>Via</th>
            </tr>
          </thead>
          <tbody>
            {view.entries.map((entry) => (
              <tr key={entry.network} className={entry.isMatch ? 'is-match' : ''}>
                <td className="network">{entry.network}</td>
                <td className="gateway">{entry.gateway}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
