// Water field — the whole visible floor (§5.8, revised).
// One bounded, high-subdivision plane with GPU wave displacement. Lives inside
// SceneFit (scene-space units). Flow speed follows the scrubber; idle still
// undulates. Scrubber state is read non-reactively (§6.1).

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../shaders/water.vert?raw'
import fragmentShader from '../shaders/water.frag?raw'
import { FOG, KEY_LIGHT_DIR, WATER } from '../config/sceneConstants'
import { useSceneStore } from '../hooks/useSceneStore'

export function WaterField() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: WATER.amplitude },
      uColorDeep: { value: new THREE.Color(WATER.colorDeep) },
      uColorCrest: { value: new THREE.Color(WATER.colorCrest) },
      uSpec: { value: new THREE.Color(WATER.spec) },
      uLightDir: { value: new THREE.Vector3(...KEY_LIGHT_DIR).normalize() },
      uFogColor: { value: new THREE.Color(FOG.color) },
      uFogNear: { value: FOG.near },
      uFogFar: { value: FOG.far },
      uHalfSize: { value: WATER.size / 2 },
      uEdgeStart: { value: WATER.edgeStartFraction },
    }),
    [],
  )

  useFrame((_, delta) => {
    const u = matRef.current?.uniforms
    if (!u) return
    const s = useSceneStore.getState()
    const flow = s.isPlaying ? s.playbackSpeed : 1
    u.uTime.value += delta * flow
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER.y, 0]}
      frustumCulled={false}
    >
      <planeGeometry
        args={[WATER.size, WATER.size, WATER.segments, WATER.segments]}
      />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite
      />
    </mesh>
  )
}
