import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { cameraDefaults } from '../config/rooms.js';
import { roomBounds } from '../config/rooms.js';
import { buildTextMesh } from '../utils/geometries.js';
import { WALL_TEXT_SPOTS } from '../utils/constants.js';
import ArrangeController from './ArrangeController.js';

import { createStudy } from '../rooms/ScholarsStudy.js';
import { createJamaica } from '../rooms/JamaicaBeach.js';
import { createOpenSea } from '../rooms/OpenSea.js';
import { createCabin } from '../rooms/CaptainsCabin.js';
import { createFrench } from '../rooms/FrenchLiterature.js';
import { createVersailles } from '../rooms/VersaillesGardens.js';
import { createOrangerie } from '../rooms/Orangerie.js';
import { createEmptyRoom } from '../rooms/EmptyRoom.js';

const roomBuilders = {
  study: createStudy,
  jamaica: createJamaica,
  opensea: createOpenSea,
  cabin: createCabin,
  french: createFrench,
  versailles: createVersailles,
  orangerie: createOrangerie,
};

export default function SceneManager({
  currentRoom,
  wallTextsRef,
  wallTextMeshesRef,
  clickableObjectsRef,
  movableObjectsRef,
  sceneRef,
  cameraRef,
  onClickPanel,
  onClickWallText,
  arrangeMode,
  onSelectFurniture,
  onDeselectFurniture,
}) {
  const mountRef = useRef(null);
  const movementRef = useRef({ forward: false, backward: false, left: false, right: false });
  const arrangeModeRef = useRef(false);

  // Sync arrangeMode prop to ref (avoids adding to main effect dependency array)
  useEffect(() => {
    arrangeModeRef.current = !!arrangeMode;
  }, [arrangeMode]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    clickableObjectsRef.current = [];
    if (movableObjectsRef) movableObjectsRef.current = [];

    const builder = roomBuilders[currentRoom] || createEmptyRoom;
    const camera = builder(scene, width, height, clickableObjectsRef, movableObjectsRef);

    sceneRef.current = scene;
    cameraRef.current = camera;

    // Load saved furniture layout
    if (movableObjectsRef) {
      ArrangeController.loadLayout(currentRoom, movableObjectsRef);
    }

    // Instantiate ArrangeController
    const bounds = roomBounds[currentRoom] || null;
    const arrangeCtrl = new ArrangeController(
      scene, camera, renderer.domElement, movableObjectsRef || { current: [] }, currentRoom, bounds
    );

    // Render stored wall texts
    wallTextMeshesRef.current = [];
    const roomTexts = wallTextsRef.current[currentRoom] || [];
    roomTexts.forEach((wt, idx) => {
      const mesh = buildTextMesh(wt, idx);
      scene.add(mesh);
      wallTextMeshesRef.current.push(mesh);
    });

    // Camera orbital controls
    const defaults = cameraDefaults[currentRoom] || { radius: 10, phi: 0.3, theta: 0 };
    let theta = defaults.theta;
    let phi = defaults.phi;
    let radius = defaults.radius;

    const updateCamera = () => {
      if (currentRoom === 'versailles') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 15;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 0, -50);
      } else if (currentRoom === 'orangerie') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 8;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 25;
        camera.lookAt(0, 6, 0);
      } else if (currentRoom === 'jamaica') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 4;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 15;
        camera.lookAt(0, 2, 5);
      } else if (currentRoom === 'opensea') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 15;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 30;
        camera.lookAt(0, 5, 0);
      } else if (currentRoom === 'cabin') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 2;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 2, 0);
      } else if (currentRoom === 'french') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi) - 8;
        camera.position.y = radius * Math.sin(phi) + 3;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(15, 5, 0);
      } else {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 2;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 2, 0);
      }
    };

    // Drag state
    let isDragging = false, prevX = 0, prevY = 0, dragDist = 0;
    let arrangeDragging = false; // true when dragging a selected furniture piece

    const onMouseDown = (e) => {
      if (arrangeModeRef.current) {
        const result = arrangeCtrl.handlePointerDown(e.clientX, e.clientY);
        if (result === 'select') {
          arrangeDragging = true;
          if (onSelectFurniture) onSelectFurniture(arrangeCtrl.selected);
          return;
        }
        if (result === 'deselect') {
          arrangeDragging = false;
          if (onDeselectFurniture) onDeselectFurniture();
          return;
        }
        // Clicked empty space with nothing selected — fall through to orbit
      }
      isDragging = true;
      dragDist = 0;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = (e) => {
      if (arrangeDragging) {
        arrangeCtrl.handlePointerUp();
        arrangeDragging = false;
        // After drag, re-notify parent of current state
        if (arrangeCtrl.selected && onSelectFurniture) onSelectFurniture(arrangeCtrl.selected);
        return;
      }
      isDragging = false;
    };

    const onMouseMove = (e) => {
      if (arrangeDragging) {
        arrangeCtrl.handlePointerMove(e.clientX, e.clientY);
        return;
      }
      if (!isDragging) return;
      const dx = e.clientX - prevX, dy = e.clientY - prevY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      theta -= dx * 0.008;
      phi = Math.max(0.1, Math.min(0.8, phi + dy * 0.008));
      updateCamera();
      prevX = e.clientX; prevY = e.clientY;
    };

    // Touch controls
    let touchStartX = 0, touchStartY = 0, touchDragDist = 0;
    let touchArrangeDragging = false;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const tx = e.touches[0].clientX, ty = e.touches[0].clientY;

      if (arrangeModeRef.current) {
        const result = arrangeCtrl.handlePointerDown(tx, ty);
        if (result === 'select') {
          touchArrangeDragging = true;
          if (onSelectFurniture) onSelectFurniture(arrangeCtrl.selected);
          return;
        }
        if (result === 'deselect') {
          touchArrangeDragging = false;
          if (onDeselectFurniture) onDeselectFurniture();
          return;
        }
      }

      isDragging = true;
      touchDragDist = 0;
      touchStartX = tx;
      touchStartY = ty;
      prevX = tx;
      prevY = ty;
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const tx = e.touches[0].clientX, ty = e.touches[0].clientY;

      if (touchArrangeDragging) {
        arrangeCtrl.handlePointerMove(tx, ty);
        return;
      }

      if (!isDragging) return;
      const dx = tx - prevX, dy = ty - prevY;
      touchDragDist += Math.abs(dx) + Math.abs(dy);
      theta -= dx * 0.008;
      phi = Math.max(0.1, Math.min(0.8, phi + dy * 0.008));
      updateCamera();
      prevX = tx; prevY = ty;
    };

    const onTouchEnd = (e) => {
      if (touchArrangeDragging) {
        arrangeCtrl.handlePointerUp();
        touchArrangeDragging = false;
        if (arrangeCtrl.selected && onSelectFurniture) onSelectFurniture(arrangeCtrl.selected);
        return;
      }

      if (touchDragDist < 10 && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        handleClick(touch.clientX, touch.clientY);
      }
      isDragging = false;
    };

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (clientX, clientY) => {
      // In arrange mode, pointer down already handled selection
      if (arrangeModeRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check wall text meshes first
      if (wallTextMeshesRef.current.length > 0) {
        const textHits = raycaster.intersectObjects(wallTextMeshesRef.current);
        if (textHits.length > 0) {
          const idx = textHits[0].object.userData.wallTextIndex;
          if (idx !== undefined) {
            onClickWallText(idx);
            return;
          }
        }
      }

      if (clickableObjectsRef.current.length === 0) return;
      const intersects = raycaster.intersectObjects(clickableObjectsRef.current);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        // Lamp toggle
        if (obj.userData.lampToggle && obj.userData.light) {
          const light = obj.userData.light;
          light.visible = !light.visible;
          if (obj.userData.glowMesh) {
            obj.userData.glowMesh.material.opacity = light.visible ? 0.6 : 0.1;
          }
          return;
        }
        const panelId = obj.userData.panelId;
        if (panelId) onClickPanel(panelId);
      }
    };

    const onClick = (e) => {
      if (dragDist > 5) { dragDist = 0; return; }
      dragDist = 0;
      handleClick(e.clientX, e.clientY);
    };

    renderer.domElement.addEventListener('click', onClick);

    // Hover cursor
    const onHoverMove = (e) => {
      if (arrangeDragging) {
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (arrangeModeRef.current) {
        // In arrange mode, show pointer on movable objects
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const movableMeshes = [];
        (movableObjectsRef?.current || []).forEach(obj => {
          obj.traverse(child => { if (child.isMesh) movableMeshes.push(child); });
        });
        const hits = raycaster.intersectObjects(movableMeshes);
        renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
        return;
      }

      const allClickable = [...clickableObjectsRef.current, ...wallTextMeshesRef.current];
      if (allClickable.length === 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allClickable);
      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
    };
    renderer.domElement.addEventListener('mousemove', onHoverMove);

    // WASD movement
    let targetX = 0, targetZ = 0;
    const moveSpeed = 0.05;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      switch (e.key.toLowerCase()) {
        case 'w': movementRef.current.forward = true; break;
        case 's': movementRef.current.backward = true; break;
        case 'a': movementRef.current.left = true; break;
        case 'd': movementRef.current.right = true; break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'w': movementRef.current.forward = false; break;
        case 's': movementRef.current.backward = false; break;
        case 'a': movementRef.current.left = false; break;
        case 'd': movementRef.current.right = false; break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    const fireLight = scene.getObjectByName('fireLight');
    const fireGlow = scene.getObjectByName('fireGlow');

    // Visibility change - pause when tab hidden
    let paused = false;
    const onVisibilityChange = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (paused) return;

      const move = movementRef.current;
      if (move.forward || move.backward || move.left || move.right) {
        const forward = new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta));
        const right = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
        if (move.forward) { targetX += forward.x * moveSpeed; targetZ += forward.z * moveSpeed; }
        if (move.backward) { targetX -= forward.x * moveSpeed; targetZ -= forward.z * moveSpeed; }
        if (move.left) { targetX -= right.x * moveSpeed; targetZ -= right.z * moveSpeed; }
        if (move.right) { targetX += right.x * moveSpeed; targetZ += right.z * moveSpeed; }
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
      }

      if (fireLight) fireLight.intensity = 1.0 + Math.random() * 0.4;
      if (fireGlow) fireGlow.material.opacity = 0.5 + Math.random() * 0.2;

      // Update box helper in arrange mode
      arrangeCtrl.update();

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      arrangeCtrl.dispose();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousemove', onHoverMove);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      mount.removeChild(renderer.domElement);
      // Dispose scene
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [currentRoom]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />;
}
