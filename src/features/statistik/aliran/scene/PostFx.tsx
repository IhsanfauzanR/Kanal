// Post-processing — subtle bloom (§5.10).
// Built on three-stdlib's EffectComposer + UnrealBloomPass (matched to three
// 0.160 via drei) rather than @react-three/postprocessing, whose peer wants
// three ≥0.168. Mounting this takes over the render loop (useFrame priority 1);
// unmounting it (medium/low tiers) restores R3F's default render.

import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib'
import { BLOOM } from '../config/sceneConstants'

export function PostFx() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const composer = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      BLOOM.strength,
      BLOOM.radius,
      BLOOM.threshold,
    )
    bloom.renderToScreen = true
    c.addPass(bloom)
    return c
    // size handled in the effect below so we don't rebuild the composer on resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setSize(size.width, size.height)
    composer.setPixelRatio(gl.getPixelRatio())
  }, [composer, gl, size])

  useEffect(() => () => composer.dispose(), [composer])

  // Priority > 0 → we own the render loop while bloom is active.
  useFrame(() => {
    composer.render()
  }, 1)

  return null
}
