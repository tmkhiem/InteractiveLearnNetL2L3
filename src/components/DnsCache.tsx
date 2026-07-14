import { getDevice, STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'
import type { DnsCacheView } from '../model/scenario'

interface DnsCacheProps {
  view: DnsCacheView | null
}

const GAP = 100

/**
 * Floating panel anchored just above the device whose DNS cache it shows
 * (hostname → IP). A newly cached entry pulses briefly to mark the fresh mapping.
 */
export function DnsCache({ view }: DnsCacheProps) {
  if (!view) return null
  const device = getDevice(view.deviceId)
  const left = `${(device.pos.x / STAGE_WIDTH) * 100}%`
  const top = `${((device.pos.y - GAP) / STAGE_HEIGHT) * 100}%`

  return (
    <div className="dns-cache" style={{ left, top }}>
      <div className="dns-cache-title">{device.name} · DNS cache</div>
      {view.entries.length === 0 ? (
        <div className="dns-cache-empty">empty</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Hostname</th>
              <th>IP</th>
              <th>TTL</th>
            </tr>
          </thead>
          <tbody>
            {view.entries.map((entry) => (
              <tr key={entry.hostname} className={entry.isNew ? 'is-new' : ''}>
                <td className="hostname">{entry.hostname}</td>
                <td className="ip">{entry.ip}</td>
                <td className="ttl">{entry.ttl}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
