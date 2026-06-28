// Responsive fit — frames the full river within the locked camera (§5.2).
//
// The brief fixes both the camera ([0,4.5,9], fov 45, maxDistance 14) and the
// river span (X ∈ [-8,8], §5.1). On a portrait phone those are mutually
// unsatisfiable: fov-45 from ≤14 units only shows ~±2.5 X. Rather than break a
// locked value, we treat *scene scale* (unspecified) as the free parameter and
// shrink world content to the visible half-width for the current aspect. All
// authored coordinates, heights and relationships are preserved exactly.

import { useMemo, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, RIVER } from '../config/sceneConstants'

const RIVER_HALF_WIDTH = RIVER.maxX // 8
// Banks sit at ~0.78 of the visible half-width, leaving room for the labels
// (which extend horizontally beyond the geometry) to stay on-screen.
const FRAME_USAGE = 0.78
const MIN_SCALE = 0.28
const MAX_SCALE = 1

export function SceneFit({ children }: { children: ReactNode }) {
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  const scale = useMemo(() => {
    const aspect = width / Math.max(1, height)
    const vFov = (camera.fov * Math.PI) / 180
    const hHalfAngle = Math.atan(Math.tan(vFov / 2) * aspect)
    const dist = camera.position.distanceTo(new THREE.Vector3(...CAMERA.target))
    const visibleHalfWidth = dist * Math.tan(hHalfAngle)
    const s = (visibleHalfWidth * FRAME_USAGE) / RIVER_HALF_WIDTH
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))
  }, [width, height, camera])

  return <group scale={scale}>{children}</group>
}
