// Sources — 5 income account prisms (§5.6).
// Thin teal-tinted prisms at X=-8 emerging from the river, height ∝ log(total),
// slow breathing emissive pulse (phase-offset per source). Simple label below.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS, SOURCES, heightForTotal } from '../config/sceneConstants'
import { ACCOUNT_LABELS, type AccountId } from '../data/types'
import { useSceneData } from '../hooks/useSceneData'
import { useSceneStore } from '../hooks/useSceneStore'
import { useCameraDolly } from '../hooks/useCameraDolly'

// §5.6 fixed order along Z: BJB, Blue, Tunai, GoPay, Beloved.
const ACCOUNT_ORDER: AccountId[] = ['bjb', 'blue', 'tunai', 'gopay', 'beloved']

export function Sources() {
  const { sources } = useSceneData()
  const selectElement = useSceneStore((s) => s.selectElement)
  const focusOn = useCameraDolly((s) => s.focusOn)
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  const items = useMemo(
    () =>
      ACCOUNT_ORDER.map((id, i) => {
        const total = sources.find((s) => s.accountId === id)?.total ?? 0
        return {
          id,
          z: SOURCES.zOffsets[i],
          height: Math.max(0.3, heightForTotal(total)),
          phase: i * 0.8,
        }
      }),
    [sources],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { min, max, periodSec } = SOURCES.pulse
    for (let i = 0; i < items.length; i++) {
      const m = mats.current[i]
      if (!m) continue
      const k =
        (Math.sin((t / periodSec) * Math.PI * 2 + items[i].phase) + 1) / 2
      m.emissiveIntensity = min + (max - min) * k
    }
  })

  return (
    <group>
      {items.map((it, i) => (
        <group key={it.id} position={[SOURCES.x, 0, it.z]}>
          <mesh
            position={[0, it.height / 2, 0]}
            onClick={(e) => {
              e.stopPropagation()
              selectElement({ type: 'source', accountId: it.id })
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
            <boxGeometry
              args={[SOURCES.prismSize, it.height, SOURCES.prismSize]}
            />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[i] = el
              }}
              color={SOURCES.material.color}
              metalness={SOURCES.material.metalness}
              roughness={SOURCES.material.roughness}
              emissive={SOURCES.material.emissive}
              emissiveIntensity={SOURCES.material.emissiveIntensity}
            />
          </mesh>
          <Billboard position={[0, -0.28, 0]}>
            <Text
              fontSize={0.22}
              color={COLORS.label}
              anchorX="center"
              anchorY="top"
              letterSpacing={0.02}
            >
              {ACCOUNT_LABELS[it.id]}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
