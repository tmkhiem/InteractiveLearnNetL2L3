import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'
import type { ArpTableView } from '../model/scenario'

interface ArpTableProps {
  view: ArpTableView | null
}

// Vertical gap (in stage units, same scale as device positions) between the
// device and the table anchored above it, clearing the device card itself.
const GAP = 100

/**
 * Floating panel anchored just above the device whose ARP cache it shows
 * (IP → MAC). A newly learned entry pulses briefly so the mapping that was
 * just resolved stands out.
 */
export function ArpTable({ view }: ArpTableProps) {
  if (!view) return null
  const device = getDevice(view.deviceId)
  const left = `${(device.pos.x / STAGE_WIDTH) * 100}%`
  const top = `${((device.pos.y - GAP) / STAGE_HEIGHT) * 100}%`

  return (
    <div className="arp-table" style={{ left, top }}>
      <div className="arp-table-title">{device.name} · ARP table</div>
      {view.entries.length === 0 ? (
        <div className="arp-table-empty">empty</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>MAC</th>
            </tr>
          </thead>
          <tbody>
            {view.entries.map((entry) => (
              <tr key={entry.ip} className={entry.isNew ? 'is-new' : ''}>
                <td className="ip">{entry.ip}</td>
                <td className="mac">{entry.mac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
