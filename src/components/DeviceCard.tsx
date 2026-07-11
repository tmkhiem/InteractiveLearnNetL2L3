import type { Device } from '../model/network'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../model/network'

interface DeviceCardProps {
  device: Device
  /** Role in the current scenario, for highlighting. */
  role: 'src' | 'dst' | null
  /** True when the step engine is emphasizing this device. */
  active: boolean
  /** Whether the active scenario surfaces IP addressing at all. */
  showLayer3: boolean
}

function Icon({ kind }: { kind: Device['kind'] }) {
  if (kind === 'pc') {
    return (
      <svg viewBox="0 0 24 24" className="device-icon" aria-hidden>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M9 20h6M12 16v4" />
      </svg>
    )
  }
  if (kind === 'switch') {
    return (
      <svg viewBox="0 0 24 24" className="device-icon" aria-hidden>
        <rect x="2" y="8" width="20" height="8" rx="1.5" />
        <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="device-icon" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10M12 7l5 5-5 5M12 7L7 12l5 5" />
    </svg>
  )
}

export function DeviceCard({
  device,
  role,
  active,
  showLayer3,
}: DeviceCardProps) {
  const left = `${(device.pos.x / STAGE_WIDTH) * 100}%`
  const top = `${(device.pos.y / STAGE_HEIGHT) * 100}%`

  const classes = [
    'device-card',
    `kind-${device.kind}`,
    role ? `role-${role}` : '',
    active ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} style={{ left, top }}>
      <div className="device-badge">
        <Icon kind={device.kind} />
      </div>
      <div className="device-name">{device.name}</div>

      {device.kind === 'pc' && (
        <dl className="device-addrs">
          <div>
            <dt>MAC</dt>
            <dd className="mac">{device.nics[0].mac}</dd>
          </div>
          {showLayer3 && (
            <div>
              <dt>IP</dt>
              <dd className="ip">{device.nics[0].ip}</dd>
            </div>
          )}
        </dl>
      )}

      {device.kind === 'switch' && (
        <div className="device-sub">Layer 2 switch</div>
      )}

      {device.kind === 'router' && (
        <dl className="device-addrs router-nics">
          {device.nics.map((nic) => (
            <div key={nic.id} className={nic.external ? 'nic-wan' : ''}>
              <dt>{nic.ifname}</dt>
              <dd className="mac">{nic.mac}</dd>
              {showLayer3 && <dd className="ip">{nic.ip}</dd>}
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
