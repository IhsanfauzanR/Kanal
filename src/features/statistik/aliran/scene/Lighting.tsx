// Cold, singular lighting — §5.4. No shadows, no point lights, no warm rim.

import { LIGHTING } from '../config/sceneConstants'

export function Lighting() {
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
        args={[
          LIGHTING.hemisphere.sky,
          LIGHTING.hemisphere.ground,
          LIGHTING.hemisphere.intensity,
        ]}
      />
    </>
  )
}
