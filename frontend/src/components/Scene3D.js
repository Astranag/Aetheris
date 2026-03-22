import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/* Vanilla Three.js renderer — bypasses R3F reconciler completely to avoid React 19 conflict */
const useThreeScene = (containerRef, { shape, color, showParticles }) => {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const meshGroupRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0.3, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    scene.add(directional);
    const pointCyan = new THREE.PointLight(0x00F0FF, 0.5, 20);
    pointCyan.position.set(-3, 2, -3);
    scene.add(pointCyan);
    const pointMagenta = new THREE.PointLight(0xFF0055, 0.3, 20);
    pointMagenta.position.set(3, -1, 3);
    scene.add(pointMagenta);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x030303, transparent: true, opacity: 0.5 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    scene.add(ground);

    // Particles
    if (showParticles) {
      const particleGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(50 * 3);
      for (let i = 0; i < 50; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.02, color: 0x00F0FF, transparent: true, opacity: 0.4, sizeAttenuation: true });
      const particles = new THREE.Points(particleGeo, particleMat);
      particlesRef.current = particles;
      scene.add(particles);
    }

    // Animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y += 0.005;
      }
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0003;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [containerRef, showParticles]);

  // Update shape
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (meshGroupRef.current) {
      scene.remove(meshGroupRef.current);
      meshGroupRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const colorVal = new THREE.Color(color);
    const group = new THREE.Group();
    const mainMat = new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.2, metalness: 0.8 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });

    switch (shape) {
      case 'desk': {
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), mainMat);
        top.position.y = 0.6;
        group.add(top);
        [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), legMat);
          leg.position.set(x, 0, z);
          group.add(leg);
        });
        break;
      }
      case 'chair': {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.3, metalness: 0.6 }));
        seat.position.y = 0.4;
        group.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.08), new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.3, metalness: 0.6 }));
        back.position.set(0, 0.88, -0.36);
        group.add(back);
        [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), legMat);
          leg.position.set(x, 0, z);
          group.add(leg);
        });
        break;
      }
      case 'panel': {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.2, 0.06),
          new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.1, metalness: 0.8, emissive: colorVal, emissiveIntensity: 0.1 })
        );
        group.add(panel);
        break;
      }
      case 'hexagon': {
        [
          { pos: [0, 0, 0], opacity: 1 },
          { pos: [1.05, 0, 0], opacity: 0.7 },
          { pos: [0.525, 0.91, 0], opacity: 0.5 }
        ].forEach(({ pos, opacity }) => {
          const hex = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 0.3, 6),
            new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.2, metalness: 0.7, transparent: opacity < 1, opacity })
          );
          hex.position.set(...pos);
          group.add(hex);
        });
        break;
      }
      case 'pod': {
        const pod = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.7, 0.6, 16, 32),
          new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.1, metalness: 0.6 })
        );
        group.add(pod);
        break;
      }
      case 'cylinder': {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.6, 0.9, 32),
          new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.4, metalness: 0.5 })
        );
        group.add(pot);
        const plant = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 })
        );
        plant.position.y = 0.55;
        group.add(plant);
        break;
      }
      default: {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mainMat);
        group.add(box);
      }
    }

    meshGroupRef.current = group;
    scene.add(group);
  }, [shape, color]);
};

export const Scene3D = ({ shape = 'desk', color = '#00F0FF', height = '100%', showParticles = true }) => {
  const containerRef = useRef(null);
  useThreeScene(containerRef, { shape, color, showParticles });

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height, position: 'relative' }}
      role="img"
      aria-label={`3D preview of ${shape} product`}
    />
  );
};
