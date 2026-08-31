'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, ShieldCheck, Camera, Activity, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

interface Frostbite3DStadiumCanvasProps {
  activeSponsor: string;
  onDwellUpdate?: (dwellSec: number, viewAngle: number, occlusionPct: number) => void;
}

export function Frostbite3DStadiumCanvas({
  activeSponsor,
  onDwellUpdate,
}: Frostbite3DStadiumCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewAngle, setViewAngle] = useState<number>(24.5);
  const [occlusionPct, setOcclusionPct] = useState<number>(4.2);
  const [dwellSeconds, setDwellSeconds] = useState<number>(3.4);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070D16');
    scene.fog = new THREE.FogExp2('#070D16', 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 28);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const stadiumSpot1 = new THREE.SpotLight(0x00c48c, 3.5);
    stadiumSpot1.position.set(20, 30, 20);
    stadiumSpot1.angle = Math.PI / 4;
    scene.add(stadiumSpot1);

    const stadiumSpot2 = new THREE.SpotLight(0x0072bc, 4.0);
    stadiumSpot2.position.set(-20, 30, -20);
    stadiumSpot2.angle = Math.PI / 4;
    scene.add(stadiumSpot2);

    // Pitch Ground
    const pitchGeo = new THREE.PlaneGeometry(36, 24);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x0c281e,
      roughness: 0.8,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    // Pitch Grid Lines
    const gridHelper = new THREE.GridHelper(36, 12, 0x00c48c, 0x163a2c);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Dynamic LED Billboard Canvas Texture
    const createBillboardTexture = (sponsorText: string, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#080E18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient accent border
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Sponsor Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${sponsorText.toUpperCase()} • FROSTBITE 3D ★`, canvas.width / 2, canvas.height / 2);

      return new THREE.CanvasTexture(canvas);
    };

    const sponsorColor =
      activeSponsor === 'Nike'
        ? '#00F0FF'
        : activeSponsor === 'Mountain Dew'
        ? '#E6FF00'
        : activeSponsor === 'PlayStation'
        ? '#0072BC'
        : '#FF7A00';

    const billboardMat = new THREE.MeshStandardMaterial({
      map: createBillboardTexture(activeSponsor, sponsorColor),
      emissive: new THREE.Color(sponsorColor),
      emissiveIntensity: 0.45,
      roughness: 0.2,
    });

    // Perimeter Hoardings
    const boardGeo = new THREE.BoxGeometry(32, 1.6, 0.4);
    const backBoard = new THREE.Mesh(boardGeo, billboardMat);
    backBoard.position.set(0, 0.8, -11.5);
    scene.add(backBoard);

    const frontBoard = new THREE.Mesh(boardGeo, billboardMat);
    frontBoard.position.set(0, 0.8, 11.5);
    scene.add(frontBoard);

    // Jumbotron / Hanging 3D Board
    const jumbotronGeo = new THREE.BoxGeometry(14, 5, 0.5);
    const jumbotron = new THREE.Mesh(jumbotronGeo, billboardMat);
    jumbotron.position.set(0, 9, -10);
    scene.add(jumbotron);

    // Dynamic Player Silhouette for Occlusion
    const playerGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.2, 16);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1.1, 4);
    scene.add(player);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow orbital camera sway
      if (isRotating) {
        camera.position.x = Math.sin(elapsedTime * 0.4) * 12;
        camera.position.z = 24 + Math.cos(elapsedTime * 0.4) * 4;
        camera.lookAt(0, 2, 0);

        // Player run-by animation causing momentary occlusion
        player.position.x = Math.sin(elapsedTime * 1.2) * 8;
        player.position.z = 3 + Math.cos(elapsedTime * 1.2) * 2;

        const currentAngle = Number((Math.abs(Math.sin(elapsedTime * 0.4)) * 35 + 10).toFixed(1));
        const currentOcclusion = player.position.x > -2 && player.position.x < 2 ? 18.5 : 3.2;
        const currentDwell = Number((3.2 + Math.sin(elapsedTime * 0.5) * 0.8).toFixed(1));

        setViewAngle(currentAngle);
        setOcclusionPct(currentOcclusion);
        setDwellSeconds(currentDwell);

        if (onDwellUpdate) {
          onDwellUpdate(currentDwell, currentAngle, currentOcclusion);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [activeSponsor, isRotating, onDwellUpdate]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-[#253D5B] bg-[#070D16] shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Real-Time Vision AI HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-[#0E1A29]/90 backdrop-blur-md border border-[#253D5B] rounded-xl p-3.5 space-y-2 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00F0FF]">
            <Camera className="w-3.5 h-3.5" />
            <span>FROSTBITE 3D VISION TELEMETRY</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/40 font-bold">
            VIEWABLE PASSED
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#253D5B]/60 text-xs">
          <div>
            <div className="text-[10px] text-[#5C728C] font-mono">Camera Angle</div>
            <div className="font-heading font-bold text-white tabular-nums">{viewAngle}°</div>
          </div>
          <div>
            <div className="text-[10px] text-[#5C728C] font-mono">Occlusion</div>
            <div className="font-heading font-bold text-[#38BDF8] tabular-nums">{occlusionPct}%</div>
          </div>
          <div>
            <div className="text-[10px] text-[#5C728C] font-mono">IAS Dwell</div>
            <div className="font-heading font-bold text-[#00C48C] tabular-nums">{dwellSeconds}s</div>
          </div>
        </div>
      </div>

      {/* Canvas Control Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all ${
            isRotating
              ? 'bg-[#0072BC] text-white border-[#0072BC] shadow-lg'
              : 'bg-[#16263A]/80 text-gray-300 border-white/10 hover:bg-[#16263A]'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>{isRotating ? 'Camera Orbiting' : 'Paused Camera'}</span>
        </button>
      </div>
    </div>
  );
}
