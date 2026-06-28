// Destinations — 7 expense category ridges (§5.7).
// Stepped achromatic mounds at X=+8 emerging from the river, height ∝ log(total).
// Sorted by magnitude, largest at centre, decreasing outward. Simple label below.

import { useMemo } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { COLORS, DESTINATIONS, heightForTotal } from '../config/sceneConstants'
import { CATEGORY_LABELS, type CategoryId } from '../data/types'
import { useSceneData } from '../hooks/useSceneData'
import { useSceneStore } from '../hooks/useSceneStore'
import { useCameraDolly } from '../hooks/useCameraDolly'

// 7 evenly-spread Z anchors across the river depth.
const DEST_Z = [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7]

// Place sorted[0] at centre, then alternate outward: [3,2,4,1,5,0,6].
function centerOutPositions(n: number): number[] {
  const center = Math.floor(n / 2)
  const pos: number[] = [center]
  for (let k = 1; k < n; k++) {
    const off = Math.ceil(k / 2)
    pos[k] = center + (k % 2 === 1 ? -off : off)
  }
  return pos
}

function Ridge({ height }: { height: number }) {
  const { step } = DESTINATIONS
  const midH = Math.max(0.1, 0.5 * height - 0.3)
  const topH = Math.max(0.1, 0.5 * height - 0.3)
  const baseY = step.baseH / 2
  const midY = step.baseH + midH / 2
  const topY = step.baseH + midH + topH / 2

  const mat = (
    <meshStandardMaterial
      color={DESTINATIONS.material.color}
      metalness={DESTINATIONS.material.metalness}
      roughness={DESTINATIONS.material.roughness}
    />
  )

  return (
    <group>
      <mesh position={[0, baseY, 0]}>
        <boxGeometry args={[step.baseD, step.baseH, step.baseW]} />
        {mat}
      </mesh>
      <mesh position={[0, midY, 0]}>
        <boxGeometry args={[step.midD, midH, step.midW]} />
        {mat}
      </mesh>
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[step.topD, topH, step.topW]} />
        {mat}
      </mesh>
    </group>
  )
}

export function Destinations() {
  const { destinations } = useSceneData()
  const selectElement = useSceneStore((s) => s.selectElement)
  const focusOn = useCameraDolly((s) => s.focusOn)

  const items = useMemo(() => {
    const sorted = [...destinations].sort((a, b) => b.total - a.total)
    const positions = centerOutPositions(sorted.length)
    return sorted.map((bucket, rank) => ({
      id: bucket.categoryId as CategoryId,
      z: DEST_Z[positions[rank]] ?? 0,
      height: Math.max(0.4, heightForTotal(bucket.total)),
    }))
  }, [destinations])

  return (
    <group>
      {items.map((it) => (
        <group key={it.id} position={[DESTINATIONS.x, 0, it.z]}>
          <group
            onClick={(e) => {
              e.stopPropagation()
              selectElement({ type: 'destination', categoryId: it.id })
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
            <Ridge height={it.height} />
          </group>
          <Billboard position={[0, -0.28, 0]}>
            <Text
              fontSize={0.17}
              color={COLORS.label}
              anchorX="center"
              anchorY="top"
              maxWidth={2.4}
              textAlign="center"
            >
              {CATEGORY_LABELS[it.id]}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
