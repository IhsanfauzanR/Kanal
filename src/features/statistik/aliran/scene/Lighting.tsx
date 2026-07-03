// Cold, singular lighting — §5.4. No shadows, no point lights, no warm rim.
// Stage Final: hemisphere colours follow the theme (colours only — intensities
// and positions stay locked). Keyed because hemisphere colours are args.

import { LIGHTING } from '../config/sceneConstants'
import { useScenePalette } from '../config/scenePalette'

export function Lighting() {
  const palette = useScenePalette()
  return (
    <>
      <ambientLight
        intensity={LIGHTING.ambient.intensity}
        color={LIGHTING.ambient.color}
      />
      <directionalLight
        position={LIGHTING.key.position}
        intensity={LIGHTING.key.intensity}
        color={LIGHTING.key.color}
      />
      <hemisphereLight
        key={palette.key}
        args={[palette.hemisphereSky, palette.hemisphereGround, LIGHTING.hemisphere.intensity]}
      />
    </>
  )
}
