// Zinc-950 atmospheric fog — §5.5. Hides scene edges, builds depth.
// Attaches to the scene; uses linear fog (near → far).

import { FOG } from '../config/sceneConstants'

export function Fog() {
  return <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
}
