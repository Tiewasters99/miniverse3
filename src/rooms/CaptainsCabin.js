import * as THREE from 'three';

export function createCabin(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  scene.background = new THREE.Color('#1a1a2a');
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 2, 0);

  scene.add(new THREE.AmbientLight('#ffd4a3', 0.25));
  scene.add(new THREE.PointLight('#ffaa66', 0.8, 12).translateX(-3).translateY(3).translateZ(2));
  scene.add(new THREE.PointLight('#ffaa66', 0.5, 10).translateX(3).translateY(3).translateZ(-2));
  scene.add(new THREE.PointLight('#4a90c0', 0.3, 8).translateZ(-6).translateY(3));

  const darkWood = new THREE.MeshStandardMaterial({ color: '#2a1a0a', roughness: 0.7 });
  const richWood = new THREE.MeshStandardMaterial({ color: '#4a2a1a', roughness: 0.6 });
  const wallMat = new THREE.MeshStandardMaterial({ color: '#3a3a4d', roughness: 0.9 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b8962e', metalness: 0.7, roughness: 0.3 });
  const leather = new THREE.MeshStandardMaterial({ color: '#5a3020', roughness: 0.5 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), richWood);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  [['back', 0, 4, -6, 0], ['left', -6, 4, 0, Math.PI / 2], ['right', 6, 4, 0, -Math.PI / 2]].forEach(([, x, y, z, ry]) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMat);
    w.position.set(x, y, z);
    w.rotation.y = ry;
    scene.add(w);
  });

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 8;
  scene.add(ceiling);

  // Portholes
  const createPorthole = (x, y, z, rotY = 0) => {
    const pFrame = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 12, 24), brass);
    pFrame.position.set(x, y, z);
    pFrame.rotation.y = rotY;
    scene.add(pFrame);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshStandardMaterial({ color: '#4a7090', transparent: true, opacity: 0.5 }));
    glass.position.set(x, y, z + 0.05);
    glass.rotation.y = rotY;
    scene.add(glass);
  };
  createPorthole(0, 4, -5.9);
  createPorthole(-5.9, 4, -2, Math.PI / 2);
  createPorthole(-5.9, 4, 2, Math.PI / 2);

  // Bookshelf
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 4), darkWood);
  shelfBack.position.set(-5.85, 2.5, -2);
  scene.add(shelfBack);
  for (let i = 0; i < 4; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 4), richWood);
    shelf.position.set(-5.6, 0.8 + i * 1.2, -2);
    scene.add(shelf);
  }

  const seaBooks = ['#1a3a5a', '#2a4a3a', '#4a2a1a', '#3a3a5a', '#5a3a2a', '#2a3a4a'];
  for (let row = 0; row < 3; row++) {
    for (let b = 0; b < 6; b++) {
      const bookHeight = 0.7 + Math.random() * 0.25;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, bookHeight, 0.15 + Math.random() * 0.1),
        new THREE.MeshStandardMaterial({ color: seaBooks[(row * 6 + b) % seaBooks.length] })
      );
      book.position.set(-5.4, 1.2 + row * 1.2, -3.6 + b * 0.55);
      book.rotation.y = Math.PI / 2;
      scene.add(book);
    }
  }

  // Ship's wheel
  const wheelGroup = new THREE.Group();
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 12, 24), richWood);
  wheelGroup.add(wheelRim);
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12), brass);
  wheelHub.rotation.x = Math.PI / 2;
  wheelGroup.add(wheelHub);
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), richWood);
    spoke.rotation.z = (i / 8) * Math.PI * 2;
    spoke.position.x = Math.cos((i / 8) * Math.PI * 2) * 0.35;
    spoke.position.y = Math.sin((i / 8) * Math.PI * 2) * 0.35;
    wheelGroup.add(spoke);
  }
  wheelGroup.position.set(0, 5.5, -5.85);
  wheelGroup.userData.movable = true;
  wheelGroup.userData.furnitureId = 'cabin-wheel';
  wheelGroup.userData.originalPosition = wheelGroup.position.clone();
  wheelGroup.userData.originalRotationY = wheelGroup.rotation.y;
  scene.add(wheelGroup);
  movableObjectsRef.current.push(wheelGroup);

  // Desk
  const deskGroup = new THREE.Group();
  deskGroup.position.set(3, 0, -2.5);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), richWood);
  deskTop.position.set(0, 1.5, 0);
  deskGroup.add(deskTop);
  const deskLegL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.3), richWood);
  deskLegL.position.set(-1.4, 0.75, 0);
  deskGroup.add(deskLegL);
  const deskLegR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.3), richWood);
  deskLegR.position.set(1.4, 0.75, 0);
  deskGroup.add(deskLegR);
  deskGroup.userData.movable = true;
  deskGroup.userData.furnitureId = 'cabin-desk';
  deskGroup.userData.originalPosition = deskGroup.position.clone();
  deskGroup.userData.originalRotationY = deskGroup.rotation.y;
  scene.add(deskGroup);
  movableObjectsRef.current.push(deskGroup);

  // Chair
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-2.5, 0, 2);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), leather);
  seat.position.set(0, 0.5, 0);
  chairGroup.add(seat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), leather);
  chairBack.position.set(0, 1.1, -0.5);
  chairGroup.add(chairBack);
  chairGroup.userData.movable = true;
  chairGroup.userData.furnitureId = 'cabin-chair';
  chairGroup.userData.originalPosition = chairGroup.position.clone();
  chairGroup.userData.originalRotationY = chairGroup.rotation.y;
  scene.add(chairGroup);
  movableObjectsRef.current.push(chairGroup);

  // Map on wall
  const mapFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 0.1), richWood);
  mapFrame.position.set(3, 4.5, -5.9);
  scene.add(mapFrame);
  const mapSurface = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ color: '#d4c8a0' }));
  mapSurface.position.set(3, 4.5, -5.85);
  scene.add(mapSurface);

  return camera;
}
