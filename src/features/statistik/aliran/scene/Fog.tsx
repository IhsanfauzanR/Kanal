// Atmospheric fog — §5.5. Hides scene edges, builds depth. Colour follows the
// app theme (Zinc-950 in dark, Zinc-100 in light); near/far stay locked.
// Keyed by theme because fog colour is a constructor arg.

import { FOG } from '../config/sceneConstants'
import { useScenePalette } from '../config/scenePalette'

export function Fog() {
  const palette = useScenePalette()
  return <fog key={palette.key} attach="fog" args={[palette.fog, FOG.near, FOG.far]} />
}
