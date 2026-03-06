import * as THREE from 'three';

export function createEmptyRoom(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  scene.background = new THREE.Color(0x050505);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 5, 12);
  camera.lookAt(0, 0, 0);

  // Soft ambient light so you can see the floor
  scene.add(new THREE.AmbientLight(0x404040, 1.5));

  // Floor plane — the empty stage
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  return camera;
}
