// <Canvas> wrapper + scene composition — §8.2.
// Full scene: water river, source prisms, destination ridges, flowing
// particles, lighting/fog, camera. Bloom (PostFx) on the high tier;
// PerfMonitor auto-downgrades DPR/bloom if the framerate drops (§8.1).
//
// Deliberate deviation from §8.2: alpha:true (not false) so the Stage 3B
// canvas gradient backdrop shows through and geometry dissolves into the
// matching #09090b fog.

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Lighting } from './scene/Lighting'
import { Fog } from './scene/Fog'
import { CameraRig } from './scene/CameraRig'
import { SceneFit } from './scene/SceneFit'
import { WaterField } from './scene/WaterField'
import { Sources } from './scene/Sources'
import { Destinations } from './scene/Destinations'
import { Particles } from './scene/Particles'
import { PostFx } from './scene/PostFx'
import { PerfMonitor } from './scene/PerfMonitor'
import { CAMERA, QUALITY } from './config/sceneConstants'
import { useSceneStore } from './hooks/useSceneStore'

export function AliranCanvas() {
  const qualityTier = useSceneStore((s) => s.qualityTier)
  const dpr = qualityTier === 'high' ? QUALITY.high.dpr : 1

  return (
    <Canvas
      dpr={dpr}
      camera={{
        position: CAMERA.position,
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
      }}
      gl={{
        antialias: qualityTier !== 'low',
        powerPreference: 'high-performance',
        alpha: true,
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Fog />
      <Lighting />
      <CameraRig />
      <Suspense fallback={null}>
        <SceneFit>
          <WaterField />
          <Sources />
          <Destinations />
          <Particles />
        </SceneFit>
      </Suspense>
      <PerfMonitor />
      {qualityTier === 'high' && <PostFx />}
    </Canvas>
  )
}
