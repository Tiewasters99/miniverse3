import * as THREE from 'three';

export function createOpenSea(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
  camera.position.set(0, 15, 60);
  camera.lookAt(0, 5, 0);

  scene.background = new THREE.Color('#1e90ff');
  scene.add(new THREE.AmbientLight('#ffffff', 0.6));
  const sun = new THREE.DirectionalLight('#fffef8', 0.9);
  sun.position.set(20, 40, 20);
  scene.add(sun);

  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: '#1060a0', roughness: 0.3 }));
  ocean.rotation.x = -Math.PI / 2;
  scene.add(ocean);

  const boatGroup = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 18), new THREE.MeshStandardMaterial({ color: '#f5f5f0' }));
  hull.position.y = 1.5;
  boatGroup.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 18, 8), new THREE.MeshStandardMaterial({ color: '#5a4030' }));
  mast.position.set(0, 11, 0);
  boatGroup.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), new THREE.MeshStandardMaterial({ color: '#fff8f0', side: THREE.DoubleSide }));
  sail.position.set(2, 10, 0);
  sail.rotation.y = Math.PI / 6;
  boatGroup.add(sail);
  const cabinSea = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), new THREE.MeshStandardMaterial({ color: '#6a5040' }));
  cabinSea.position.set(0, 4.5, -4);
  boatGroup.add(cabinSea);
  boatGroup.userData.movable = true;
  boatGroup.userData.furnitureId = 'opensea-sailboat';
  boatGroup.userData.originalPosition = boatGroup.position.clone();
  boatGroup.userData.originalRotationY = boatGroup.rotation.y;
  if (movableObjectsRef) movableObjectsRef.current.push(boatGroup);
  scene.add(boatGroup);

  // Dolphin
  const dolphinGroup = new THREE.Group();
  const dolphinBody = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), new THREE.MeshStandardMaterial({ color: '#4a6a7a' }));
  dolphinBody.scale.set(1, 0.7, 2.5);
  dolphinGroup.add(dolphinBody);
  const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), new THREE.MeshStandardMaterial({ color: '#3a5a6a' }));
  dorsalFin.position.set(0, 1, 0);
  dorsalFin.rotation.z = 0.2;
  dolphinGroup.add(dorsalFin);
  dolphinGroup.position.set(-35, 4, -25);
  dolphinGroup.rotation.z = 0.5;
  dolphinGroup.userData.movable = true;
  dolphinGroup.userData.furnitureId = 'opensea-dolphin';
  dolphinGroup.userData.originalPosition = dolphinGroup.position.clone();
  dolphinGroup.userData.originalRotationY = dolphinGroup.rotation.y;
  if (movableObjectsRef) movableObjectsRef.current.push(dolphinGroup);
  scene.add(dolphinGroup);

  // Whale tail
  const whaleTailGroup = new THREE.Group();
  const whaleMat = new THREE.MeshStandardMaterial({ color: '#2a3a4a' });
  const leftFluke = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 3), whaleMat);
  leftFluke.position.set(-3.5, 0, 0);
  leftFluke.rotation.z = 0.3;
  whaleTailGroup.add(leftFluke);
  const rightFluke = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 3), whaleMat);
  rightFluke.position.set(3.5, 0, 0);
  rightFluke.rotation.z = -0.3;
  whaleTailGroup.add(rightFluke);
  const tailStock = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.5, 6, 8), whaleMat);
  tailStock.position.set(0, -4, 0);
  whaleTailGroup.add(tailStock);
  whaleTailGroup.position.set(40, 10, -50);
  scene.add(whaleTailGroup);

  return camera;
}
