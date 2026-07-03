// Particles — transactions flowing along the river (§5.9).
// Continuous ambient flow: every particle always travels its cubic-Bezier arc
// (the river is alive even when paused), fading in at the source and out as it
// is absorbed so the loop never pops. Play speeds the current up; pausing keeps
// a calm baseline drift. Kept few/slow per the user's "tenang" preference.
//   expense (keluar): source account (left) → category ridge (right), red
//   income (masuk):   off-stream left → source account (left), teal
// depthTest is OFF so particles read from ANY camera angle (never occluded by
// the water/banks). Positions/sizes update in place; no per-frame allocation.

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../shaders/particle.vert?raw'
import fragmentShader from '../shaders/particle.frag?raw'
import { PARTICLES, particleSize } from '../config/sceneConstants'
import { useScenePalette } from '../config/scenePalette'
import { useSceneData, type AliranScene } from '../hooks/useSceneData'
import { useSceneStore } from '../hooks/useSceneStore'

interface Flow {
  p0: THREE.Vector3
  p1: THREE.Vector3
  p2: THREE.Vector3
  p3: THREE.Vector3
  income: boolean
  baseSize: number // point-size factor
}

const COPIES = 2 // particles per transaction → calm but continuous stream
const DUR_MIN = 11 // seconds for a full traversal (slow, contemplative)
const DUR_MAX = 17

function cubicBezier(
  out: THREE.Vector3,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  out.set(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    a * p0.z + b * p1.z + c * p2.z + d * p3.z,
  )
}

// Sample at most this many transactions of each kind so a 1800-row real dataset
// doesn't spawn thousands of particles — keep the stream calm (§5.9 hardCap).
const MAX_FLOWS = 64

function buildFlows(scene: AliranScene): Flow[] {
  const sizeSpan = PARTICLES.sizeMax - PARTICLES.sizeMin
  const flows: Flow[] = []

  // Largest transactions first, so the visible stream favours meaningful moves.
  const txns = [...scene.transactions]
    .filter((t) => t.type === 'masuk' || (t.type === 'keluar' && t.category))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, MAX_FLOWS)

  for (const t of txns) {
    const sz = Math.min(
      PARTICLES.sizeMax,
      Math.max(PARTICLES.sizeMin, particleSize(t.amount)),
    )
    const baseSize = 0.9 + ((sz - PARTICLES.sizeMin) / sizeSpan) * 1.0

    if (t.type === 'masuk') {
      const acc = scene.sourceByKey.get(t.account)
      if (!acc) continue
      const peak = acc.y + 0.9
      flows.push({
        income: true,
        baseSize,
        p0: new THREE.Vector3(acc.x - 3.5, acc.y * 0.5, acc.z),
        p1: new THREE.Vector3(acc.x - 2.2, peak, acc.z),
        p2: new THREE.Vector3(acc.x - 0.8, peak, acc.z),
        p3: new THREE.Vector3(acc.x, acc.y, acc.z),
      })
    } else if (t.category) {
      const acc = scene.sourceByKey.get(t.account)
      const cat = scene.destByKey.get(t.category)
      if (!acc || !cat) continue
      const dx = cat.x - acc.x
      const peak = Math.max(acc.y, cat.y) + 1.7
      flows.push({
        income: false,
        baseSize,
        p0: new THREE.Vector3(acc.x, acc.y, acc.z),
        p1: new THREE.Vector3(acc.x + dx * 0.28, peak, acc.z * 0.55),
        p2: new THREE.Vector3(acc.x + dx * 0.72, peak, cat.z * 0.55),
        p3: new THREE.Vector3(cat.x, cat.y, cat.z),
      })
    }
  }
  return flows
}

export function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const tmp = useRef(new THREE.Vector3())
  const scene = useSceneData()
  const palette = useScenePalette()

  const { flows, geometry, count, phases, durations, flowIndex } =
    useMemo(() => {
      const flows = buildFlows(scene)
      const count = flows.length * COPIES
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const phases = new Float32Array(count)
      const durations = new Float32Array(count)
      const flowIndex = new Int32Array(count)

      const income = new THREE.Color(palette.particleIncome)
      const expense = new THREE.Color(palette.particleExpense)

      for (let i = 0; i < count; i++) {
        const fi = i % flows.length
        const copy = Math.floor(i / flows.length)
        const f = flows[fi]
        flowIndex[i] = fi
        // Stagger copies + per-flow offset so the stream is evenly spread.
        phases[i] = (copy / COPIES + (fi / flows.length) * 0.13) % 1
        durations[i] = DUR_MIN + (((fi * 131) % 100) / 100) * (DUR_MAX - DUR_MIN)
        const c = f.income ? income : expense
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      return { flows, geometry, count, phases, durations, flowIndex }
    }, [scene, palette])

  // Dispose the previous GPU buffer when the period (scene) changes.
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const g = pointsRef.current?.geometry
    if (!g) return
    const posAttr = g.getAttribute('position') as THREE.BufferAttribute
    const sizeAttr = g.getAttribute('aSize') as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array
    const sizes = sizeAttr.array as Float32Array
    const v = tmp.current

    // Always flowing; play speeds the current up, pause keeps a calm drift.
    const s = useSceneStore.getState()
    const speed = s.isPlaying ? s.playbackSpeed : 1
    const dt = Math.min(delta, 0.05) // guard against tab-switch jumps

    for (let i = 0; i < count; i++) {
      let ph = phases[i] + (dt * speed) / durations[i]
      if (ph >= 1) ph -= 1
      phases[i] = ph

      const f = flows[flowIndex[i]]
      cubicBezier(v, f.p0, f.p1, f.p2, f.p3, ph)
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z

      // Fade in at spawn, out as absorbed → seamless loop.
      const fade =
        Math.min(1, ph / 0.12) * Math.min(1, (1 - ph) / 0.12)
      sizes[i] = f.baseSize * fade
    }
    posAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  })

  return (
    // renderOrder so particles draw AFTER the transparent water (which writes
    // depth) — otherwise the water plane paints over them ("cut off by water").
    // depthTest true so the prisms/ridges correctly occlude particles behind
    // them (no more particles floating on the bars from rotated angles).
    <points ref={pointsRef} geometry={geometry} frustumCulled={false} renderOrder={10}>
      {/* Additive glow on dark; normal blending on light (additive washes out
          to white on a bright field). Colour/blending change only. */}
      <shaderMaterial
        key={palette.key}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        depthTest={true}
        blending={palette.additiveParticles ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  )
}
