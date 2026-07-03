// Sources — income account prisms (§5.6), now one per account that has income
// in the active period (count is dynamic). Thin teal-tinted prisms at X=-8,
// height ∝ log(total), slow breathing emissive pulse, label below.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { SOURCES } from '../config/sceneConstants'
import { useScenePalette } from '../config/scenePalette'
import { accountLabel } from '../data/types'
import { useSceneData } from '../hooks/useSceneData'
import { useSceneStore } from '../hooks/useSceneStore'
import { useCameraDolly } from '../hooks/useCameraDolly'

export function Sources() {
  const { sources } = useSceneData()
  const palette = useScenePalette()
  const selectElement = useSceneStore((s) => s.selectElement)
  const focusOn = useCameraDolly((s) => s.focusOn)
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { min, max, periodSec } = SOURCES.pulse
    for (let i = 0; i < sources.length; i++) {
      const m = mats.current[i]
      if (!m) continue
      const k = (Math.sin((t / periodSec) * Math.PI * 2 + i * 0.8) + 1) / 2
      m.emissiveIntensity = min + (max - min) * k
    }
  })

  return (
    <group>
      {sources.map((it, i) => (
        <group key={it.key} position={[it.x, 0, it.z]}>
          <mesh
            position={[0, it.height / 2, 0]}
            onClick={(e) => {
              e.stopPropagation()
              selectElement({ type: 'source', accountId: it.key })
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
            <boxGeometry args={[SOURCES.prismSize, it.height, SOURCES.prismSize]} />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[i] = el
              }}
              color={palette.sourcePrism}
              metalness={SOURCES.material.metalness}
              roughness={SOURCES.material.roughness}
              emissive={SOURCES.material.emissive}
              emissiveIntensity={SOURCES.material.emissiveIntensity}
            />
          </mesh>
          <Billboard position={[0, -0.28, 0]}>
            <Text
              fontSize={0.2}
              color={palette.label}
              anchorX="center"
              anchorY="top"
              letterSpacing={0.02}
              maxWidth={2.2}
              textAlign="center"
            >
              {accountLabel(it.key)}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
