// Destinations — expense category ridges (§5.7), now one per category with
// spending in the active period (count is dynamic). Stepped achromatic mounds at
// X=+8, height ∝ log(total), biggest at centre. Ridge width shrinks for busy
// months (widthScale) so the banks stay distinct. Label below.

import { Billboard, Text } from '@react-three/drei'
import { DESTINATIONS } from '../config/sceneConstants'
import { useScenePalette } from '../config/scenePalette'
import { categoryLabel } from '../data/types'
import { useSceneData } from '../hooks/useSceneData'
import { useSceneStore } from '../hooks/useSceneStore'
import { useCameraDolly } from '../hooks/useCameraDolly'

function Ridge({
  height,
  widthScale,
  color,
}: {
  height: number
  widthScale: number
  color: string
}) {
  const { step } = DESTINATIONS
  const w = (base: number) => base * widthScale
  const midH = Math.max(0.1, 0.5 * height - 0.3)
  const topH = Math.max(0.1, 0.5 * height - 0.3)
  const baseY = step.baseH / 2
  const midY = step.baseH + midH / 2
  const topY = step.baseH + midH + topH / 2

  const mat = (
    <meshStandardMaterial
      color={color}
      metalness={DESTINATIONS.material.metalness}
      roughness={DESTINATIONS.material.roughness}
    />
  )

  return (
    <group>
      <mesh position={[0, baseY, 0]}>
        <boxGeometry args={[step.baseD, step.baseH, w(step.baseW)]} />
        {mat}
      </mesh>
      <mesh position={[0, midY, 0]}>
        <boxGeometry args={[step.midD, midH, w(step.midW)]} />
        {mat}
      </mesh>
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[step.topD, topH, w(step.topW)]} />
        {mat}
      </mesh>
    </group>
  )
}

export function Destinations() {
  const { destinations } = useSceneData()
  const palette = useScenePalette()
  const selectElement = useSceneStore((s) => s.selectElement)
  const focusOn = useCameraDolly((s) => s.focusOn)
  const showLabels = destinations.length <= 9

  return (
    <group>
      {destinations.map((it) => (
        <group key={it.key} position={[it.x, 0, it.z]}>
          <group
            onClick={(e) => {
              e.stopPropagation()
              selectElement({ type: 'destination', categoryId: it.key })
              focusOn([e.point.x, e.point.y, e.point.z])
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          >
            <Ridge height={it.height} widthScale={it.widthScale} color={palette.destRidge} />
          </group>
          {showLabels && (
            <Billboard position={[0, -0.28, 0]}>
              <Text
                fontSize={0.16}
                color={palette.label}
                anchorX="center"
                anchorY="top"
                maxWidth={2.2}
                textAlign="center"
              >
                {categoryLabel(it.key)}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  )
}
