import { useEffect, useState } from 'react'
import './App.css'
import { endpoints } from './model/network'
import { Lesson } from './components/Lesson'

function otherEndpoint(exclude: string): string {
  return endpoints.find((d) => d.id !== exclude)?.id ?? exclude
}

function App() {
  const [srcId, setSrcId] = useState('pc-a')
  const [dstId, setDstId] = useState('pc-b')
  const [revealed, setRevealed] = useState(false)

  // Fade the topology in on first paint.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleSrc = (id: string) => {
    setSrcId(id)
    if (id === dstId) setDstId(otherEndpoint(id))
  }
  const handleDst = (id: string) => {
    setDstId(id)
    if (id === srcId) setSrcId(otherEndpoint(id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>How a frame carries a packet across a Layer 2 network</h1>
        <p>
          A <span className="chip chip-frame">frame</span> is a Layer 2 envelope
          addressed by <b>MAC</b>. A{' '}
          <span className="chip chip-packet">packet</span> is a Layer 3 message
          addressed by <b>IP</b>. The packet rides <i>inside</i> the frame.
        </p>
      </header>

      <Lesson
        key={`${srcId}-${dstId}`}
        srcId={srcId}
        dstId={dstId}
        onSrc={handleSrc}
        onDst={handleDst}
        revealed={revealed}
      />
    </div>
  )
}

export default App
