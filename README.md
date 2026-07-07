# InteractiveLearnNetL2L3

An interactive **React + TypeScript** learning tool for visualising:

- Layer 2 MAC addressing and switching
- Layer 3 IP addressing and routing
- Encapsulation and decapsulation
- ARP lookup and ARP learning
- Routing table lookup

Lessons start with pre-populated ARP and routing tables so learners grasp the core delivery concepts first, then explore how the tables are populated.

## Live site

Deployed to GitHub Pages via the Actions workflow on every push to `main`.

## Development

```bash
npm install
npm run dev       # http://localhost:5173/InteractiveLearnNetL2L3/
npm run build     # produces dist/
npm run preview   # preview the built site
```

## Technology

- **Vite** (build tool)
- **React 18** + **TypeScript**
- **framer-motion** — animated PDU tokens (nested L2/L3 boxes)
- **react-rnd** — draggable device nodes

## Controls

| Button | Action |
|--------|--------|
| ▶      | Play (auto-advance through all steps) |
| ⏸      | Pause |
| ‹ ›    | Step backward / forward |
| ↺      | Reset to start |
| 🐢 ▷ ⚡ | Speed: Slow / Normal / Fast |
| ← Lesson / Lesson → | Jump to previous / next lesson |

Device nodes are draggable — rearrange the topology to suit your screen.
