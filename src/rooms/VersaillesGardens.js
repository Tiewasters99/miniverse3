import * as THREE from 'three';

export function createVersailles(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 25, 60);
  camera.lookAt(0, 0, -50);

  scene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 32, 32), new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide })));
  scene.add(new THREE.AmbientLight('#fffef8', 0.5));
  const sun = new THREE.DirectionalLight('#fffae0', 0.9);
  sun.position.set(20, 40, 30);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 600), new THREE.MeshStandardMaterial({ color: '#4a6b35' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -150;
  scene.add(ground);

  const parterre = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.MeshStandardMaterial({ color: '#d4c9b0' }));
  parterre.rotation.x = -Math.PI / 2;
  parterre.position.set(0, 0.02, 20);
  scene.add(parterre);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(8, 0.4, 8, 32), new THREE.MeshStandardMaterial({ color: '#a8a090' }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.3, 0);
  scene.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshStandardMaterial({ color: '#5a7a8a', metalness: 0.3 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.15, 0);
  scene.add(water);

  const canal = new THREE.Mesh(new THREE.PlaneGeometry(15, 250), new THREE.MeshStandardMaterial({ color: '#4a6a7a', metalness: 0.4 }));
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(0, 0.01, -180);
  scene.add(canal);

  const treeWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 200), new THREE.MeshStandardMaterial({ color: '#2d4a25' }));
  treeWall.position.set(-50, 6, -60);
  scene.add(treeWall);
  const treeWall2 = treeWall.clone();
  treeWall2.position.set(50, 6, -60);
  scene.add(treeWall2);

  return camera;
}
