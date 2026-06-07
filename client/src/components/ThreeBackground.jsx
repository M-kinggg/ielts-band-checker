import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 100;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Create Particles (representing nodes of vocabulary/grammar ideas)
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const shifts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random coordinates in space
      positions[i * 3] = (Math.random() - 0.5) * 200; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150; // z

      speeds[i] = 0.02 + Math.random() * 0.05;
      shifts[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create a circular particle texture using canvas
    const createCircleTexture = () => {
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(202, 138, 4, 0.5)'); // Gold glow
      grad.addColorStop(0.5, 'rgba(202, 138, 4, 0.15)'); // Gold halo
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.PointsMaterial({
      size: 4,
      transparent: true,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 5. Connect lines between close particles (creating a network)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xca8a04,
      transparent: true,
      opacity: 0.15,
    });

    let lineGeometry = new THREE.BufferGeometry();
    let linePositions = [];
    const lineIndices = [];
    
    // Static connections helper
    const maxConnections = 120;
    const connectionDist = 35;
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // 6. Interactive Mouse Movement
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (event) => {
      targetX = (event.clientX - window.innerWidth / 2) * 0.08;
      targetY = (event.clientY - window.innerHeight / 2) * 0.08;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Window Resizing
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const posArr = geometry.attributes.position.array;

      // Drift and animate individual particles
      for (let i = 0; i < count; i++) {
        // Wave motion on y coordinate
        posArr[i * 3 + 1] += Math.sin(elapsedTime * speeds[i] + shifts[i]) * 0.05;
        // Slow rotation around y
        const x = posArr[i * 3];
        const z = posArr[i * 3 + 2];
        const angle = 0.001 * (i % 2 === 0 ? 1 : -1);
        posArr[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
        posArr[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
      }
      geometry.attributes.position.needsUpdate = true;

      // Update interactive lines
      linePositions = [];
      let connectionsCount = 0;
      for (let i = 0; i < count; i++) {
        if (connectionsCount >= maxConnections) break;
        const x1 = posArr[i * 3];
        const y1 = posArr[i * 3 + 1];
        const z1 = posArr[i * 3 + 2];

        for (let j = i + 1; j < count; j++) {
          const x2 = posArr[j * 3];
          const y2 = posArr[j * 3 + 1];
          const z2 = posArr[j * 3 + 2];

          const dist = Math.sqrt((x1-x2)**2 + (y1-y2)**2 + (z1-z2)**2);
          if (dist < connectionDist) {
            linePositions.push(x1, y1, z1);
            linePositions.push(x2, y2, z2);
            connectionsCount++;
          }
        }
      }

      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeometry.attributes.position.needsUpdate = true;

      // Smooth camera interpolation (ease mouse reaction)
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      camera.position.x = currentX;
      camera.position.y = -currentY; // invert y
      camera.lookAt(scene.position);

      // Rotate group slightly
      particles.rotation.y = elapsedTime * 0.015;
      lines.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
