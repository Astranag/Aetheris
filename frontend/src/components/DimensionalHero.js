import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/*
  DimensionalHero — Abstract visualization of dimensional progression
  Particles morph from 1D (line) → 2D (grid) → 3D (cube lattice) → 4D (tesseract projection)
  in a continuous loop. Pure Vanilla Three.js.
*/
export const DimensionalHero = ({ height = '100vh' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── Generate dimensional target positions ───
    const PARTICLE_COUNT = 512;
    const spread = 2.0;

    // 1D: points along a line
    const pos1D = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos1D[i * 3] = (i / PARTICLE_COUNT - 0.5) * spread * 3;
      pos1D[i * 3 + 1] = 0;
      pos1D[i * 3 + 2] = 0;
    }

    // 2D: points on a grid plane
    const pos2D = new Float32Array(PARTICLE_COUNT * 3);
    const gridSize = Math.ceil(Math.sqrt(PARTICLE_COUNT));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const gx = (i % gridSize) / gridSize - 0.5;
      const gy = Math.floor(i / gridSize) / gridSize - 0.5;
      pos2D[i * 3] = gx * spread * 2.5;
      pos2D[i * 3 + 1] = gy * spread * 2.5;
      pos2D[i * 3 + 2] = 0;
    }

    // 3D: points on a cube lattice
    const pos3D = new Float32Array(PARTICLE_COUNT * 3);
    const cubeEdge = Math.ceil(Math.cbrt(PARTICLE_COUNT));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const cx = (i % cubeEdge) / cubeEdge - 0.5;
      const cy = (Math.floor(i / cubeEdge) % cubeEdge) / cubeEdge - 0.5;
      const cz = Math.floor(i / (cubeEdge * cubeEdge)) / cubeEdge - 0.5;
      pos3D[i * 3] = cx * spread * 2;
      pos3D[i * 3 + 1] = cy * spread * 2;
      pos3D[i * 3 + 2] = cz * spread * 2;
    }

    // 4D: tesseract projection (hypercube vertices + interpolated edges)
    const pos4D = new Float32Array(PARTICLE_COUNT * 3);
    // Generate hypercube wireframe points
    const hyperVerts = [];
    for (let w = -1; w <= 1; w += 2) {
      for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
          for (let z = -1; z <= 1; z += 2) {
            hyperVerts.push([x, y, z, w]);
          }
        }
      }
    }
    // Stereographic projection from 4D to 3D
    const project4D = (v, angle) => {
      const cw = Math.cos(angle), sw = Math.sin(angle);
      const rx = v[0] * cw - v[3] * sw;
      const rw = v[0] * sw + v[3] * cw;
      const scale = 1.6 / (2.5 - rw);
      return [rx * scale, v[1] * scale, v[2] * scale];
    };
    // Distribute particles along hypercube edges
    const hyperEdges = [];
    for (let i = 0; i < hyperVerts.length; i++) {
      for (let j = i + 1; j < hyperVerts.length; j++) {
        let diff = 0;
        for (let d = 0; d < 4; d++) diff += Math.abs(hyperVerts[i][d] - hyperVerts[j][d]);
        if (diff === 2) hyperEdges.push([i, j]); // connected if differ by exactly one axis
      }
    }
    const ptsPerEdge = Math.floor(PARTICLE_COUNT / hyperEdges.length);
    let idx4 = 0;
    for (const [a, b] of hyperEdges) {
      for (let t = 0; t < ptsPerEdge && idx4 < PARTICLE_COUNT; t++) {
        const frac = t / ptsPerEdge;
        const v = hyperVerts[a].map((va, d) => va + (hyperVerts[b][d] - va) * frac);
        const p = project4D(v, 0);
        pos4D[idx4 * 3] = p[0] * spread * 0.9;
        pos4D[idx4 * 3 + 1] = p[1] * spread * 0.9;
        pos4D[idx4 * 3 + 2] = p[2] * spread * 0.9;
        idx4++;
      }
    }
    // Fill remaining with vertex positions
    while (idx4 < PARTICLE_COUNT) {
      const v = hyperVerts[idx4 % hyperVerts.length];
      const p = project4D(v, 0);
      pos4D[idx4 * 3] = p[0] * spread * 0.9;
      pos4D[idx4 * 3 + 1] = p[1] * spread * 0.9;
      pos4D[idx4 * 3 + 2] = p[2] * spread * 0.9;
      idx4++;
    }

    const stages = [pos1D, pos2D, pos3D, pos4D];
    const stageColors = [
      new THREE.Color('#00F0FF'),
      new THREE.Color('#E0FF00'),
      new THREE.Color('#FF0055'),
      new THREE.Color('#0066FF'),
    ];

    // ─── Particle System ───
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    // Start from scattered random
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.94;
      colors[i * 3 + 2] = 1;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ─── Connecting Lines (sparse) ───
    const lineGeo = new THREE.BufferGeometry();
    const lineCount = 200;
    const linePositions = new Float32Array(lineCount * 2 * 3);
    const lineColors = new Float32Array(lineCount * 2 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ─── Ambient glow sphere ───
    const glowGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.3 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // ─── Animation Loop ───
    const STAGE_DURATION = 4.0; // seconds per stage
    const TRANSITION_DURATION = 2.0; // seconds for morph
    const TOTAL_CYCLE = (STAGE_DURATION + TRANSITION_DURATION) * stages.length;
    let startTime = performance.now();
    let frameId;

    const tempColor = new THREE.Color();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      const cycleTime = elapsed % TOTAL_CYCLE;

      // Determine current stage and transition progress
      const stageBlock = STAGE_DURATION + TRANSITION_DURATION;
      const stageIdx = Math.floor(cycleTime / stageBlock) % stages.length;
      const stageElapsed = cycleTime - stageIdx * stageBlock;
      const nextStageIdx = (stageIdx + 1) % stages.length;

      let morphT = 0;
      if (stageElapsed > STAGE_DURATION) {
        morphT = (stageElapsed - STAGE_DURATION) / TRANSITION_DURATION;
        morphT = morphT * morphT * (3 - 2 * morphT); // smoothstep
      }

      const fromPositions = stages[stageIdx];
      const toPositions = stages[nextStageIdx];
      const fromColor = stageColors[stageIdx];
      const toColor = stageColors[nextStageIdx];
      const posAttr = geometry.attributes.position;
      const colAttr = geometry.attributes.color;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Lerp positions
        posAttr.array[i3] = fromPositions[i3] + (toPositions[i3] - fromPositions[i3]) * morphT;
        posAttr.array[i3 + 1] = fromPositions[i3 + 1] + (toPositions[i3 + 1] - fromPositions[i3 + 1]) * morphT;
        posAttr.array[i3 + 2] = fromPositions[i3 + 2] + (toPositions[i3 + 2] - fromPositions[i3 + 2]) * morphT;
        // Add slight floating motion
        posAttr.array[i3 + 1] += Math.sin(elapsed * 0.5 + i * 0.1) * 0.02;
        // Lerp colors
        tempColor.copy(fromColor).lerp(toColor, morphT);
        colAttr.array[i3] = tempColor.r;
        colAttr.array[i3 + 1] = tempColor.g;
        colAttr.array[i3 + 2] = tempColor.b;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Update connecting lines between nearby particles
      const lPos = lineGeo.attributes.position;
      const lCol = lineGeo.attributes.color;
      let li = 0;
      const threshold = 0.8;
      outerLoop:
      for (let a = 0; a < PARTICLE_COUNT && li < lineCount; a += 4) {
        for (let b = a + 4; b < PARTICLE_COUNT && li < lineCount; b += 4) {
          const dx = posAttr.array[a * 3] - posAttr.array[b * 3];
          const dy = posAttr.array[a * 3 + 1] - posAttr.array[b * 3 + 1];
          const dz = posAttr.array[a * 3 + 2] - posAttr.array[b * 3 + 2];
          const dist = dx * dx + dy * dy + dz * dz;
          if (dist < threshold) {
            const li6 = li * 6;
            lPos.array[li6] = posAttr.array[a * 3];
            lPos.array[li6 + 1] = posAttr.array[a * 3 + 1];
            lPos.array[li6 + 2] = posAttr.array[a * 3 + 2];
            lPos.array[li6 + 3] = posAttr.array[b * 3];
            lPos.array[li6 + 4] = posAttr.array[b * 3 + 1];
            lPos.array[li6 + 5] = posAttr.array[b * 3 + 2];
            lCol.array[li6] = colAttr.array[a * 3] * 0.5;
            lCol.array[li6 + 1] = colAttr.array[a * 3 + 1] * 0.5;
            lCol.array[li6 + 2] = colAttr.array[a * 3 + 2] * 0.5;
            lCol.array[li6 + 3] = colAttr.array[b * 3] * 0.5;
            lCol.array[li6 + 4] = colAttr.array[b * 3 + 1] * 0.5;
            lCol.array[li6 + 5] = colAttr.array[b * 3 + 2] * 0.5;
            li++;
          }
        }
      }
      // Zero out unused lines
      for (let i = li; i < lineCount; i++) {
        const i6 = i * 6;
        lPos.array[i6] = lPos.array[i6 + 1] = lPos.array[i6 + 2] = 0;
        lPos.array[i6 + 3] = lPos.array[i6 + 4] = lPos.array[i6 + 5] = 0;
      }
      lPos.needsUpdate = true;
      lCol.needsUpdate = true;

      // Glow pulse
      glow.material.opacity = 0.15 + Math.sin(elapsed * 2) * 0.1;
      glow.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.3);
      tempColor.copy(fromColor).lerp(toColor, morphT);
      glow.material.color.copy(tempColor);

      // Gentle orbit
      points.rotation.y = elapsed * 0.08;
      points.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
      lines.rotation.y = elapsed * 0.08;
      lines.rotation.x = Math.sin(elapsed * 0.05) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height, position: 'relative' }}
      role="img"
      aria-label="Dimensional progression visualization — particles morphing from 1D through 4D"
    />
  );
};
