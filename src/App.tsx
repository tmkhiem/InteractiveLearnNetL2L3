import { useEffect, useState } from 'react'
import './App.css'
import { routablePcs, subnet1Endpoints, subnetOf } from './model/network'
import { scenarios, type ScenarioDefinition } from './model/scenario'
import { Lesson } from './components/Lesson'

function poolFor(def: ScenarioDefinition) {
  return def.crossSubnet ? routablePcs : subnet1Endpoints
}

/** True if a pair can't be used together under this scenario's constraint. */
function conflicts(def: ScenarioDefinition, aId: string, bId: string): boolean {
  return aId === bId || (!!def.crossSubnet && subnetOf(aId).cidr === subnetOf(bId).cidr)
}

function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [srcId, setSrcId] = useState('pc-a')
  const [dstId, setDstId] = useState('pc-b')
  const [revealed, setRevealed] = useState(false)
  // Only meaningful for the 4 subnet-1-only lessons — the routing lesson
  // always shows every subnet regardless of this flag (see Lesson.tsx).
  const [showOtherSubnets, setShowOtherSubnets] = useState(false)
  // The narration panel took over the header's old spot for visibility, so
  // the header itself (title/description) is now optional and off by default.
  const [showHeader, setShowHeader] = useState(false)

  const scenarioDef = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]

  // Fade the topology in on first paint.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleScenario = (id: string) => {
    setScenarioId(id)
    const def = scenarios.find((s) => s.id === id) ?? scenarios[0]
    const pool = poolFor(def)
    const nextSrc = pool.some((d) => d.id === srcId) ? srcId : pool[0].id
    const nextDst =
      pool.some((d) => d.id === dstId) && !conflicts(def, nextSrc, dstId)
        ? dstId
        : (pool.find((d) => !conflicts(def, nextSrc, d.id))?.id ?? nextSrc)
    setSrcId(nextSrc)
    setDstId(nextDst)
  }

  const handleSrc = (id: string) => {
    setSrcId(id)
    if (conflicts(scenarioDef, id, dstId)) {
      const pool = poolFor(scenarioDef)
      setDstId(pool.find((d) => !conflicts(scenarioDef, id, d.id))?.id ?? id)
    }
  }
  const handleDst = (id: string) => {
    setDstId(id)
    if (conflicts(scenarioDef, srcId, id)) {
      const pool = poolFor(scenarioDef)
      setSrcId(pool.find((d) => !conflicts(scenarioDef, id, d.id))?.id ?? id)
    }
  }

  return (
    <div className="app">
      {showHeader && (
        <header className="app-header">
          <p className="scenario-label">Scenario · {scenarioDef.name}</p>
          <h1>How a frame carries a packet across a Layer 2 network</h1>
          {scenarioDef.showLayer3 ? (
            <p>
              A <span className="chip chip-frame">frame</span> is a Layer 2
              envelope addressed by <b>MAC</b>. A{' '}
              <span className="chip chip-packet">packet</span> is a Layer 3
              message addressed by <b>IP</b>. The packet rides <i>inside</i> the
              frame.
            </p>
          ) : (
            <p>
              A <span className="chip chip-frame">frame</span> is a Layer 2
              envelope addressed by <b>MAC</b>. This view deals only with MAC
              addresses — Layer 3 (IP) comes later.
            </p>
          )}
        </header>
      )}

      <Lesson
        key={`${scenarioId}-${srcId}-${dstId}`}
        scenarioId={scenarioId}
        onScenario={handleScenario}
        srcId={srcId}
        dstId={dstId}
        onSrc={handleSrc}
        onDst={handleDst}
        revealed={revealed}
        showOtherSubnets={showOtherSubnets}
        onToggleOtherSubnets={setShowOtherSubnets}
        showHeader={showHeader}
        onToggleHeader={setShowHeader}
      />
    </div>
  )
}

export default App
