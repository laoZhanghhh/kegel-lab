import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GameState } from '../types';

interface ArenaProps {
  gameState: GameState;
  onHit: () => void;
  onMiss: () => void;
}

export default function Arena({ gameState, onHit, onMiss }: ArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const targetsRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  
  // Game parameters
  const targetRadius = 0.5;
  const maxTargets = 3;

  const gameStateRef = useRef<GameState>(gameState);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const createTarget = useCallback(() => {
    if (!targetsRef.current) return;
    
    // Clear any existing targets if we're just starting
    const geometry = new THREE.SphereGeometry(targetRadius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 2,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    const target = new THREE.Mesh(geometry, material);
    
    // Random position in front of player
    // Spread them out more and ensure they are clearly in front
    target.position.x = (Math.random() - 0.5) * 16;
    target.position.y = 1 + Math.random() * 6;
    target.position.z = -12 - Math.random() * 8;
    
    target.userData.isTarget = true;
    targetsRef.current.add(target);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 10, 50);
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 0); // Eye level
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // GRID FLOOR
    const gridHelper = new THREE.GridHelper(100, 100, 0x333333, 0x111111);
    scene.add(gridHelper);

    // TARGET GROUP
    const targetGroup = new THREE.Group();
    scene.add(targetGroup);
    targetsRef.current = targetGroup;

    // SHOOTING LOGIC
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0); // Center of screen

    const handleMouseDown = () => {
      // Use ref to get current state in stale closure
      if (gameStateRef.current !== GameState.PLAYING) return;
      if (!controls.isLocked) {
        controls.lock();
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(targetGroup.children);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        targetGroup.remove(hitObject);
        onHit();
        createTarget(); // Add a new target immediately
      } else {
        onMiss();
      }
    };

    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);

    // RENDER LOOP
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (gameStateRef.current === GameState.PLAYING) {
        // Subtle animation for targets
        targetGroup.children.forEach((t) => {
          t.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.05);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onHit, onMiss, createTarget]); // Added essential deps

  // Handle pointer lock
  useEffect(() => {
    if (gameState === GameState.PLAYING && controlsRef.current && !controlsRef.current.isLocked) {
      // Small delay to ensure browser doesn't block it after countdown
      setTimeout(() => {
        controlsRef.current?.lock();
      }, 100);
    } else if (gameState === GameState.MENU && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [gameState]);

  // Initial targets creation when entering PLAYING state
  useEffect(() => {
    if (gameState === GameState.PLAYING && targetsRef.current) {
      targetsRef.current.clear();
      for (let i = 0; i < maxTargets; i++) {
        createTarget();
      }
    }
  }, [gameState, maxTargets, createTarget]);

  return <div ref={containerRef} className="w-full h-full" id="arena-container" />;
}
