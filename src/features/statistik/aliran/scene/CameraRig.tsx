// Camera + OrbitControls — §5.2 / §5.3.
// Constrained orbit, animated dolly (reset-to-default + tap-to-focus), and a
// gentle idle drift once the user has been still.

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { CAMERA, CAMERA_RIG, ORBIT } from '../config/sceneConstants'
import { easeInOutCubic, useCameraDolly } from '../hooks/useCameraDolly'

// The perspective camera is provided by the <Canvas camera={…}> prop (§8.2),
// a single stable default. We intentionally do NOT also mount drei's
// <PerspectiveCamera makeDefault>: two makeDefault cameras race, and the
// camera swap re-runs OrbitControls' effect whose cleanup restores
// state.controls to null — leaving orbit silently dead.

const DEFAULT_POS = new THREE.Vector3(...CAMERA.position)
const DEFAULT_TARGET = new THREE.Vector3(...CAMERA.target)
const FOCUS_DIST = 7 // how close the camera dollies when focusing an element
const _dir = new THREE.Vector3()

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const nonce = useCameraDolly((s) => s.nonce)

  const lastInteraction = useRef(performance.now())

  const anim = useRef({
    active: false,
    start: 0,
    fromPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  })

  // Kick off a dolly (reset or focus) when the nonce changes.
  useEffect(() => {
    if (nonce === 0 || !controls.current) return
    const { mode, focusPoint } = useCameraDolly.getState()
    const a = anim.current
    a.fromPos.copy(camera.position)
    a.fromTarget.copy(controls.current.target)

    if (mode === 'reset') {
      a.toPos.copy(DEFAULT_POS)
      a.toTarget.copy(DEFAULT_TARGET)
    } else {
      a.toTarget.set(focusPoint[0], focusPoint[1], focusPoint[2])
      // keep the current view direction, just glide in and recentre
      _dir.copy(camera.position).sub(controls.current.target).normalize()
      a.toPos.copy(a.toTarget).addScaledVector(_dir, FOCUS_DIST)
    }

    a.active = true
    a.start = performance.now()
    lastInteraction.current = performance.now()
    invalidate()
  }, [nonce, camera, invalidate])

  useFrame(() => {
    const c = controls.current
    if (!c) return

    const a = anim.current
    // Idle drift once still (and not mid-dolly).
    const idle =
      performance.now() - lastInteraction.current > CAMERA_RIG.idleDelay * 1000
    c.autoRotate = idle && !a.active

    if (a.active) {
      const t = Math.min(1, (performance.now() - a.start) / CAMERA_RIG.dollyDurationMs)
      const k = easeInOutCubic(t)
      camera.position.lerpVectors(a.fromPos, a.toPos, k)
      c.target.lerpVectors(a.fromTarget, a.toTarget, k)
      if (t >= 1) a.active = false
      invalidate()
    }

    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={CAMERA.target}
      enableDamping={ORBIT.enableDamping}
      dampingFactor={ORBIT.dampingFactor}
      enablePan={ORBIT.enablePan}
      minDistance={ORBIT.minDistance}
      maxDistance={ORBIT.maxDistance}
      minPolarAngle={ORBIT.minPolarAngle}
      maxPolarAngle={ORBIT.maxPolarAngle}
      rotateSpeed={ORBIT.rotateSpeed}
      autoRotateSpeed={0.3}
      onStart={() => {
        lastInteraction.current = performance.now()
      }}
    />
  )
}
