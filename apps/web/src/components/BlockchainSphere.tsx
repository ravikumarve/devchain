import { useEffect, useRef } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
}

export default function BlockchainSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    const nodes: Node3D[] = [];

    function init() {
      width = canvas!.width = window.innerWidth;
      height = canvas!.height = window.innerHeight;
      nodes.length = 0;

      const numNodes = Math.floor((width * height) / 10000);
      const phi = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < numNodes; i++) {
        const y = 1 - (i / (numNodes - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const sphereRadius = 380;

        nodes.push({
          x: x * sphereRadius,
          y: y * sphereRadius,
          z: z * sphereRadius,
          originalX: x * sphereRadius,
          originalY: y * sphereRadius,
          originalZ: z * sphereRadius,
        });
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = (e.clientX - width / 2) * 0.0005;
      mouseY = (e.clientY - height / 2) * 0.0005;
    }

    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      ctx!.clearRect(0, 0, width, height);

      time += 0.002;
      const rotX = time + mouseY;
      const rotY = time + mouseX;

      const centerX = width / 2;
      const centerY = height / 2;
      const fov = 800;

      const projected = nodes.map((n) => {
        const y1 = n.originalY * Math.cos(rotX) - n.originalZ * Math.sin(rotX);
        const z1 = n.originalY * Math.sin(rotX) + n.originalZ * Math.cos(rotX);
        const x2 = n.originalX * Math.cos(rotY) + z1 * Math.sin(rotY);
        const z2 = -n.originalX * Math.sin(rotY) + z1 * Math.cos(rotY);
        const z3d = z2 + 1000;
        const scale = fov / z3d;
        return {
          x: x2 * scale + centerX,
          y: y1 * scale + centerY,
          z: z3d,
          scale,
        };
      });

      projected.sort((a, b) => b.z - a.z);

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const opacity = Math.max(0.05, Math.min(0.9, 1200 / p.z - 0.5));

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(98, 126, 234, ${opacity})`;
        ctx!.fill();

        let connections = 0;
        for (let j = i + 1; j < projected.length && connections < 4; j++) {
          const p2 = projected[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120 * p.scale) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p2.x, p2.y);
            const lineAlpha = opacity * (1 - dist / (120 * p.scale)) * 0.4;
            ctx!.strokeStyle = `rgba(98, 126, 234, ${lineAlpha})`;
            ctx!.lineWidth = 0.8 * p.scale;
            ctx!.stroke();
            connections++;
          }
        }
      }
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="genesis-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.9,
        mixBlendMode: 'screen',
      }}
    />
  );
}
